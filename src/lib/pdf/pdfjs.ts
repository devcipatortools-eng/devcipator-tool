import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

type PdfJs = typeof import("pdfjs-dist");
let pdfjsPromise: Promise<PdfJs> | null = null;

const BASE = "/vendor/pdfjs";

/** Lazily loads PDF.js and points it at the self-hosted worker (copied by scripts/copy-vendor.mjs). */
export function getPdfjs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `${BASE}/pdf.worker.min.mjs`;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export class PasswordRequiredError extends Error {
  constructor() {
    super("This PDF is password-protected.");
  }
}

export async function openPdf(data: ArrayBuffer | Uint8Array, password?: string): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfjs();
  // PDF.js transfers the buffer to its worker, so always hand it a copy.
  const bytes = data instanceof Uint8Array ? data.slice() : new Uint8Array(data.slice(0));
  const task = pdfjs.getDocument({
    data: bytes,
    password,
    cMapUrl: `${BASE}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${BASE}/standard_fonts/`,
    wasmUrl: `${BASE}/wasm/`,
    iccUrl: `${BASE}/iccs/`,
    stopAtErrors: false,
  });
  try {
    return await task.promise;
  } catch (err) {
    if (err && typeof err === "object" && "name" in err && err.name === "PasswordException") throw new PasswordRequiredError();
    throw err;
  }
}

/** Releases a document and its worker-side resources. */
export function closePdf(doc: PDFDocumentProxy): void {
  void doc.loadingTask.destroy();
}

export interface RenderOptions {
  /** Scale relative to 72 DPI; ignored when maxWidth/maxHeight are set. */
  scale?: number;
  maxWidth?: number;
  maxHeight?: number;
  /** Extra clockwise rotation in degrees. */
  rotation?: number;
  background?: string;
}

export async function renderPage(page: PDFPageProxy, opts: RenderOptions = {}): Promise<HTMLCanvasElement> {
  const rotation = ((page.rotate + (opts.rotation ?? 0)) % 360 + 360) % 360;
  const base = page.getViewport({ scale: 1, rotation });
  let scale = opts.scale ?? 1;
  if (opts.maxWidth || opts.maxHeight) {
    scale = Math.min(opts.maxWidth ? opts.maxWidth / base.width : Infinity, opts.maxHeight ? opts.maxHeight / base.height : Infinity);
  }
  const viewport = page.getViewport({ scale, rotation });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = opts.background ?? "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas;
}

export interface TextLine {
  text: string;
  x: number;
  /** Baseline y from the top of the page, in points. */
  y: number;
  fontSize: number;
  /** Individual fragments with their x position, used for column detection. */
  segments: Array<{ text: string; x: number; width: number }>;
}

interface RawItem {
  str: string;
  x: number;
  y: number;
  width: number;
  size: number;
}

/** Extracts the text layer as reading-order lines, merging fragments that share a baseline. */
export async function extractLines(page: PDFPageProxy): Promise<TextLine[]> {
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const items: RawItem[] = [];
  for (const item of content.items) {
    if (!("str" in item) || !item.str) continue;
    const [a, b, , , e, f] = item.transform as number[];
    const size = Math.hypot(a, b) || item.height || 10;
    // Convert to top-left origin using the viewport transform.
    const [x, y] = viewport.convertToViewportPoint(e, f);
    items.push({ str: item.str, x, y, width: item.width, size });
  }
  items.sort((p, q) => (Math.abs(p.y - q.y) < Math.min(p.size, q.size) * 0.5 ? p.x - q.x : p.y - q.y));

  const lines: TextLine[] = [];
  for (const it of items) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(last.y - it.y) < Math.min(last.fontSize, it.size) * 0.5) {
      const prev = last.segments[last.segments.length - 1];
      const gap = it.x - (prev.x + prev.width);
      if (gap > it.size * 0.15 && !prev.text.endsWith(" ") && !it.str.startsWith(" ")) {
        // A large gap starts a new segment (column); a small one is a word space.
        if (gap > it.size * 1.5) last.segments.push({ text: it.str, x: it.x, width: it.width });
        else {
          prev.text += " " + it.str;
          prev.width = it.x + it.width - prev.x;
        }
      } else {
        prev.text += it.str;
        prev.width = it.x + it.width - prev.x;
      }
      last.fontSize = Math.max(last.fontSize, it.size);
    } else {
      lines.push({ text: "", x: it.x, y: it.y, fontSize: it.size, segments: [{ text: it.str, x: it.x, width: it.width }] });
    }
  }
  for (const l of lines) {
    l.segments = l.segments.map((s) => ({ ...s, text: s.text.replace(/\s+/g, " ").trim() })).filter((s) => s.text);
    l.text = l.segments.map((s) => s.text).join("  ");
  }
  return lines.filter((l) => l.text);
}

export async function canvasToBytes(canvas: HTMLCanvasElement, type: "image/jpeg" | "image/png", quality?: number): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas encoding failed"))), type, quality),
  );
  return new Uint8Array(await blob.arrayBuffer());
}
