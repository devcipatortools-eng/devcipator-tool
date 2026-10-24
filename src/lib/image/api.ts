import type { ImageOps, ImageResult } from "./ops";

/** Operations implemented by image.worker.ts. */
export type ImageApi = {
  transform(blob: Blob, ops: ImageOps): ImageResult;
};
