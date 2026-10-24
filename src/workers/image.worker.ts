/// <reference lib="webworker" />
import { exposeWorker } from "@/lib/worker-rpc";
import { runOps } from "@/lib/image/ops";
import type { ImageApi } from "@/lib/image/api";

const make = (w: number, h: number) => new OffscreenCanvas(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));

exposeWorker<ImageApi>({
  async transform(blob, ops) {
    let bmp: ImageBitmap;
    try {
      bmp = await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      throw new Error("This image format cannot be decoded by your browser.");
    }
    try {
      return await runOps(bmp, bmp.width, bmp.height, ops, make);
    } finally {
      // Free the decoded pixels immediately; large photos are tens of MB.
      bmp.close();
    }
  },
});
