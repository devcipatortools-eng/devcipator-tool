/**
 * Pure canvas pipeline shared by the image worker (OffscreenCanvas) and the
 * main-thread fallback (HTMLCanvasElement, needed for SVG input).
 */

export type OutputFormat = "image/jpeg" | "image/png" | "image/webp" | "image/bmp";

export interface ImageOps {
  /** Crop rectangle in source pixels. */
  crop?: { x: number; y: number; width: number; height: number };
  /** Final size in pixels (after crop and rotation). */
  resize?: { width: number; height: number };
  rotate?: 0 | 90 | 180 | 270;
  flipH?: boolean;
  flipV?: boolean;
  format: OutputFormat;
  /** 0..1 for lossy formats. */
  quality?: number;
  /** Fill colour behind transparent pixels (always applied for JPEG). */
  background?: string;
}

export interface ImageResult {
  blob: Blob;
  width: number;
  height: number;
}

type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type AnyCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
export type CanvasFactory = (w: number, h: number) => AnyCanvas;

function ctx2d(c: AnyCanvas): AnyCtx {
  const ctx = c.getContext("2d") as AnyCtx | null;
  if (!ctx) throw new Error("Canvas 2D is not available.");
  return ctx;
}

/** High-quality downscale: halve repeatedly, then a final smooth step. */
function scaleTo(src: AnyCanvas | CanvasImageSource, sw: number, sh: number, tw: number, th: number, make: CanvasFactory): AnyCanvas {
  let cur: CanvasImageSource = src as CanvasImageSource;
  let cw = sw;
  let ch = sh;
  while (cw / 2 >= tw && ch / 2 >= th) {
    const next = make(Math.round(cw / 2), Math.round(ch / 2));
    const c = ctx2d(next);
    c.imageSmoothingQuality = "high";
    c.drawImage(cur, 0, 0, cw, ch, 0, 0, next.width, next.height);
    cur = next as CanvasImageSource;
    cw = next.width;
    ch = next.height;
  }
  const out = make(tw, th);
  const c = ctx2d(out);
  c.imageSmoothingQuality = "high";
  c.drawImage(cur, 0, 0, cw, ch, 0, 0, tw, th);
  return out;
}

/** Applies crop → rotate/flip → resize → background, returning the final canvas. */
export function applyOps(source: CanvasImageSource, srcWidth: number, srcHeight: number, ops: Omit<ImageOps, "format" | "quality">, make: CanvasFactory, forceBackground?: string): AnyCanvas {
  const crop = ops.crop ?? { x: 0, y: 0, width: srcWidth, height: srcHeight };
  const rotate = ops.rotate ?? 0;
  const swap = rotate === 90 || rotate === 270;
  const rw = swap ? crop.height : crop.width;
  const rh = swap ? crop.width : crop.height;

  let stage: AnyCanvas = make(rw, rh);
  const c = ctx2d(stage);
  c.translate(rw / 2, rh / 2);
  c.rotate((rotate * Math.PI) / 180);
  c.scale(ops.flipH ? -1 : 1, ops.flipV ? -1 : 1);
  c.drawImage(source, crop.x, crop.y, crop.width, crop.height, -crop.width / 2, -crop.height / 2, crop.width, crop.height);

  if (ops.resize && (ops.resize.width !== rw || ops.resize.height !== rh)) {
    stage = scaleTo(stage, rw, rh, Math.max(1, Math.round(ops.resize.width)), Math.max(1, Math.round(ops.resize.height)), make);
  }

  const bg = forceBackground ?? ops.background;
  if (bg) {
    const flat = make(stage.width, stage.height);
    const fc = ctx2d(flat);
    fc.fillStyle = bg;
    fc.fillRect(0, 0, flat.width, flat.height);
    fc.drawImage(stage as CanvasImageSource, 0, 0);
    stage = flat;
  }
  return stage;
}

/** 24-bit BMP encoder — browsers cannot encode BMP natively. */
function encodeBmp(canvas: AnyCanvas): Blob {
  const { width, height } = canvas;
  const pixels = ctx2d(canvas).getImageData(0, 0, width, height).data;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const dataSize = rowSize * height;
  const buf = new ArrayBuffer(54 + dataSize);
  const v = new DataView(buf);
  v.setUint16(0, 0x424d); // "BM"
  v.setUint32(2, 54 + dataSize, true);
  v.setUint32(10, 54, true);
  v.setUint32(14, 40, true);
  v.setInt32(18, width, true);
  v.setInt32(22, height, true); // positive = bottom-up rows
  v.setUint16(26, 1, true);
  v.setUint16(28, 24, true);
  v.setUint32(34, dataSize, true);
  v.setInt32(38, 2835, true); // 72 DPI
  v.setInt32(42, 2835, true);
  const out = new Uint8Array(buf);
  for (let y = 0; y < height; y++) {
    const src = (height - 1 - y) * width * 4;
    let dst = 54 + y * rowSize;
    for (let x = 0; x < width; x++, dst += 3) {
      const i = src + x * 4;
      out[dst] = pixels[i + 2];
      out[dst + 1] = pixels[i + 1];
      out[dst + 2] = pixels[i];
    }
  }
  return new Blob([buf], { type: "image/bmp" });
}

export async function encodeCanvas(canvas: AnyCanvas, format: OutputFormat, quality?: number): Promise<Blob> {
  if (format === "image/bmp") return encodeBmp(canvas);
  if ("convertToBlob" in canvas) return canvas.convertToBlob({ type: format, quality });
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(`Your browser cannot encode ${format}.`))), format, quality),
  );
}

export async function runOps(source: CanvasImageSource, w: number, h: number, ops: ImageOps, make: CanvasFactory): Promise<ImageResult> {
  const canvas = applyOps(source, w, h, ops, make, ops.format === "image/jpeg" || ops.format === "image/bmp" ? (ops.background ?? "#ffffff") : undefined);
  const blob = await encodeCanvas(canvas, ops.format, ops.quality);
  if (blob.type !== ops.format) throw new Error(`Your browser cannot encode ${ops.format.replace("image/", "").toUpperCase()}.`);
  return { blob, width: canvas.width, height: canvas.height };
}

export function formatFor(type: string): OutputFormat {
  if (type === "image/jpeg" || type === "image/png" || type === "image/webp" || type === "image/bmp") return type;
  return "image/png";
}

export const EXT: Record<OutputFormat, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/bmp": "bmp" };
