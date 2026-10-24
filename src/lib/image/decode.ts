/** Image helpers that run on the main thread (need DOM image decoding for SVG etc.). */

export async function loadImageElement(source: Blob | string): Promise<HTMLImageElement> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    if (typeof source !== "string") {
      // Revoke after the decode; the decoded image stays usable for drawing.
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
}

/** Decodes any browser-supported image into a drawable bitmap, honouring EXIF orientation. */
export async function decodeImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (blob.type !== "image/svg+xml") {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      // Fall through to <img> decoding (handles some formats createImageBitmap rejects).
    }
  }
  return loadImageElement(blob);
}

export function imageSize(img: ImageBitmap | HTMLImageElement | HTMLCanvasElement): { width: number; height: number } {
  if (img instanceof HTMLImageElement) return { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height };
  return { width: img.width, height: img.height };
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(width));
  c.height = Math.max(1, Math.round(height));
  return c;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error(`Your browser cannot encode ${type}.`))), type, quality),
  );
}

/** Returns bytes pdf-lib can embed directly (JPEG/PNG), converting other formats to PNG. */
export async function imageToEmbeddable(blob: Blob): Promise<{ bytes: Uint8Array; format: "png" | "jpg"; width: number; height: number }> {
  const img = await decodeImage(blob);
  const { width, height } = imageSize(img);
  const isJpeg = blob.type === "image/jpeg";
  const isPng = blob.type === "image/png";
  // JPEGs with EXIF rotation must be re-encoded so the page shows them upright.
  if (isPng || isJpeg) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (isPng || !hasExifRotation(bytes)) return { bytes, format: isPng ? "png" : "jpg", width, height };
  }
  const canvas = createCanvas(width, height);
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  const out = await canvasToBlob(canvas, isJpeg ? "image/jpeg" : "image/png", 0.92);
  return { bytes: new Uint8Array(await out.arrayBuffer()), format: isJpeg ? "jpg" : "png", width, height };
}

/** True if a JPEG carries an EXIF orientation other than 1 (normal). */
function hasExifRotation(bytes: Uint8Array): boolean {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return false;
  let i = 2;
  while (i + 4 < bytes.length && i < 65536) {
    if (bytes[i] !== 0xff) return false;
    const marker = bytes[i + 1];
    const len = (bytes[i + 2] << 8) | bytes[i + 3];
    if (marker === 0xe1 && bytes[i + 4] === 0x45 && bytes[i + 5] === 0x78) {
      const tiff = i + 10;
      const little = bytes[tiff] === 0x49;
      const u16 = (o: number) => (little ? bytes[o] | (bytes[o + 1] << 8) : (bytes[o] << 8) | bytes[o + 1]);
      const u32 = (o: number) => (little ? u16(o) | (u16(o + 2) << 16) : (u16(o) << 16) | u16(o + 2));
      const ifd = tiff + u32(tiff + 4);
      const count = u16(ifd);
      for (let e = 0; e < count; e++) {
        const entry = ifd + 2 + e * 12;
        if (u16(entry) === 0x0112) return u16(entry + 8) !== 1;
      }
      return false;
    }
    i += 2 + len;
  }
  return false;
}
