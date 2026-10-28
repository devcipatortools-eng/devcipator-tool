export interface PdfInfo {
  pageCount: number;
  encrypted: boolean;
}

export interface OrganizedPage {
  /** 0-based index in the source document. */
  index: number;
  /** Extra clockwise rotation in degrees (multiple of 90). */
  rotate: number;
}

/** A page made from an encoded raster image (JPEG or PNG). */
export interface RasterPage {
  bytes: Uint8Array;
  format: "jpg" | "png";
  pixelWidth: number;
  pixelHeight: number;
  /** Page box in points; the image is fitted inside (minus margin) and centred. */
  pageWidth: number;
  pageHeight: number;
  margin: number;
}

/** Rectangle on the page as displayed (rotation applied), normalised 0..1 from the top-left. */
export interface DisplayRect {
  pageIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
}

export type NumberPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

export interface PageNumberOptions {
  /** Supports {n} (page number) and {total}. */
  format: string;
  position: NumberPosition;
  fontSize: number;
  /** Hex colour, e.g. #333333 */
  color: string;
  /** Distance from the page edge in points. */
  margin: number;
  /** 0-based index of the first page that gets a number. */
  fromPage: number;
  /** Number printed on that first numbered page. */
  startAt: number;
  /** Whether {total} counts only numbered pages. */
  totalOnlyNumbered: boolean;
}

/** Value of {total}. Never below the last printed number, so "Page 7 of 4" cannot happen. */
export function pageNumberTotal(pageCount: number, o: Pick<PageNumberOptions, "fromPage" | "startAt" | "totalOnlyNumbered">): number {
  const last = o.startAt + pageCount - o.fromPage - 1;
  return o.totalOnlyNumbered ? last : Math.max(pageCount, last);
}

/** Operations implemented by pdf.worker.ts. */
export type PdfApi = {
  info(data: ArrayBuffer): PdfInfo;
  merge(files: ArrayBuffer[]): Uint8Array;
  split(data: ArrayBuffer, groups: number[][]): Uint8Array[];
  organize(data: ArrayBuffer, pages: OrganizedPage[]): Uint8Array;
  images(pages: RasterPage[], title?: string): Uint8Array;
  pageNumbers(data: ArrayBuffer, options: PageNumberOptions): Uint8Array;
  sign(data: ArrayBuffer, png: Uint8Array, placements: DisplayRect[]): Uint8Array;
};
