/// <reference lib="webworker" />
import { PDFDocument, PDFPage, StandardFonts, degrees, rgb } from "pdf-lib";
import { exposeWorker, type WorkerContext } from "@/lib/worker-rpc";
import type { DisplayRect, OrganizedPage, PageNumberOptions, PdfApi, RasterPage } from "@/lib/pdf/api";

function friendlyLoadError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/encrypted/i.test(msg)) return new Error("This PDF is password-protected. Remove the password in your PDF reader first.");
  return new Error(`Could not read the PDF: ${msg}`);
}

async function load(data: ArrayBuffer): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(data, { updateMetadata: false });
  } catch (err) {
    throw friendlyLoadError(err);
  }
}

function stamp(doc: PDFDocument) {
  doc.setProducer("Devcipator Tools");
  doc.setModificationDate(new Date());
}

/**
 * Maps a point on the page *as displayed* (rotation applied, origin top-left,
 * in points) to PDF user space. Lets stamps land where the user placed them on
 * pages that carry a /Rotate attribute.
 */
function displayToUser(page: PDFPage, X: number, Y: number): { x: number; y: number; rotation: number } {
  const box = page.getCropBox();
  const W = box.width;
  const H = box.height;
  const rotation = ((page.getRotation().angle % 360) + 360) % 360;
  let p: number;
  let q: number;
  // (p, q) are top-left coordinates on the unrotated page.
  if (rotation === 90) [p, q] = [Y, H - X];
  else if (rotation === 180) [p, q] = [W - X, H - Y];
  else if (rotation === 270) [p, q] = [W - Y, X];
  else [p, q] = [X, Y];
  return { x: box.x + p, y: box.y + (H - q), rotation };
}

function displaySize(page: PDFPage): { width: number; height: number } {
  const { width, height } = page.getCropBox();
  const r = ((page.getRotation().angle % 360) + 360) % 360;
  return r === 90 || r === 270 ? { width: height, height: width } : { width, height };
}

function hexToRgb(hex: string) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return rgb(0.2, 0.2, 0.2);
  return rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255);
}

async function drawRaster(doc: PDFDocument, p: RasterPage) {
  const img = p.format === "png" ? await doc.embedPng(p.bytes) : await doc.embedJpg(p.bytes);
  const page = doc.addPage([p.pageWidth, p.pageHeight]);
  const scale = Math.min((p.pageWidth - p.margin * 2) / p.pixelWidth, (p.pageHeight - p.margin * 2) / p.pixelHeight);
  const w = p.pixelWidth * scale;
  const h = p.pixelHeight * scale;
  page.drawImage(img, { x: (p.pageWidth - w) / 2, y: (p.pageHeight - h) / 2, width: w, height: h });
}

exposeWorker<PdfApi>({
  async info(data: ArrayBuffer) {
    try {
      const doc = await PDFDocument.load(data, { updateMetadata: false });
      return { pageCount: doc.getPageCount(), encrypted: doc.isEncrypted };
    } catch {
      const doc = await PDFDocument.load(data, { ignoreEncryption: true, updateMetadata: false });
      return { pageCount: doc.getPageCount(), encrypted: true };
    }
  },

  async merge(files: ArrayBuffer[], ctx: WorkerContext) {
    const out = await PDFDocument.create();
    for (let i = 0; i < files.length; i++) {
      ctx.progress(i / files.length, `Merging file ${i + 1} of ${files.length}`);
      const src = await load(files[i]);
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    }
    stamp(out);
    ctx.progress(0.95, "Saving");
    return out.save({ useObjectStreams: true });
  },

  async split(data: ArrayBuffer, groups: number[][], ctx: WorkerContext) {
    const src = await load(data);
    const results: Uint8Array[] = [];
    for (let i = 0; i < groups.length; i++) {
      ctx.progress(i / groups.length, `Creating part ${i + 1} of ${groups.length}`);
      const part = await PDFDocument.create();
      const pages = await part.copyPages(src, groups[i]);
      pages.forEach((p) => part.addPage(p));
      stamp(part);
      results.push(await part.save({ useObjectStreams: true }));
    }
    return results;
  },

  async organize(data: ArrayBuffer, pages: OrganizedPage[], ctx: WorkerContext) {
    ctx.progress(null, "Rebuilding document");
    const src = await load(data);
    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, pages.map((p) => p.index));
    copied.forEach((page, i) => {
      const extra = pages[i].rotate;
      if (extra) page.setRotation(degrees((((page.getRotation().angle + extra) % 360) + 360) % 360));
      out.addPage(page);
    });
    stamp(out);
    return out.save({ useObjectStreams: true });
  },

  async images(pages: RasterPage[], title: string | undefined, ctx: WorkerContext) {
    const doc = await PDFDocument.create();
    if (title) doc.setTitle(title);
    for (let i = 0; i < pages.length; i++) {
      ctx.progress(i / pages.length, `Adding page ${i + 1} of ${pages.length}`);
      await drawRaster(doc, pages[i]);
    }
    stamp(doc);
    ctx.progress(0.98, "Saving");
    return doc.save({ useObjectStreams: true });
  },

  async pageNumbers(data: ArrayBuffer, o: PageNumberOptions, ctx: WorkerContext) {
    const doc = await load(data);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const color = hexToRgb(o.color);
    const pages = doc.getPages();
    const numbered = pages.length - o.fromPage;
    const total = o.totalOnlyNumbered ? numbered + o.startAt - 1 : pages.length;
    pages.forEach((page, i) => {
      if (i < o.fromPage) return;
      ctx.progress(i / pages.length, `Numbering page ${i + 1}`);
      const n = o.startAt + (i - o.fromPage);
      // Standard fonts only cover WinAnsi; strip anything else from the template.
      const text = o.format.replaceAll("{n}", String(n)).replaceAll("{total}", String(total)).replace(/[^\x20-\x7E -ÿ]/g, "");
      const tw = font.widthOfTextAtSize(text, o.fontSize);
      const { width, height } = displaySize(page);
      const [vertical, horizontal] = o.position.split("-");
      const X = horizontal === "left" ? o.margin : horizontal === "right" ? width - o.margin - tw : (width - tw) / 2;
      const baseline = vertical === "top" ? o.margin + o.fontSize : height - o.margin;
      const pt = displayToUser(page, X, baseline);
      page.drawText(text, { x: pt.x, y: pt.y, size: o.fontSize, font, color, rotate: degrees(pt.rotation) });
    });
    stamp(doc);
    return doc.save({ useObjectStreams: true });
  },

  async sign(data: ArrayBuffer, png: Uint8Array, placements: DisplayRect[], ctx: WorkerContext) {
    ctx.progress(null, "Applying signature");
    const doc = await load(data);
    const image = await doc.embedPng(png);
    for (const pl of placements) {
      const page = doc.getPage(pl.pageIndex);
      const { width, height } = displaySize(page);
      const w = pl.width * width;
      const h = pl.height * height;
      // Anchor is the image's bottom-left corner as seen on screen.
      const pt = displayToUser(page, pl.left * width, (pl.top + pl.height) * height);
      page.drawImage(image, { x: pt.x, y: pt.y, width: w, height: h, rotate: degrees(pt.rotation) });
    }
    stamp(doc);
    return doc.save({ useObjectStreams: true });
  },
});
