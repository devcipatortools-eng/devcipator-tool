import { createWorkerClient, type CallOptions } from "@/lib/worker-rpc";
import { decodeImage, imageSize } from "./decode";
import { runOps, type ImageOps, type ImageResult } from "./ops";
import type { ImageApi } from "./api";

let client: ReturnType<typeof createWorkerClient<ImageApi>> | null = null;

/** Shared image worker (OffscreenCanvas) for resize / convert / crop / rotate jobs. */
export function imageWorker() {
  if (!client) {
    client = createWorkerClient<ImageApi>(
      () => new Worker(new URL("../../workers/image.worker.ts", import.meta.url), { type: "module", name: "image" }),
    );
  }
  return client;
}

const workerCapable = () => typeof OffscreenCanvas !== "undefined" && "convertToBlob" in OffscreenCanvas.prototype;

/** Runs image ops in the worker when possible; SVG (and old browsers) fall back to the main thread. */
export async function transformImage(blob: Blob, ops: ImageOps, opts?: CallOptions): Promise<ImageResult> {
  if (blob.type !== "image/svg+xml" && workerCapable()) {
    try {
      return await imageWorker().call("transform", [blob, ops], opts);
    } catch (err) {
      if (opts?.signal?.aborted) throw err;
      if (!/decode/i.test(String(err))) throw err;
      // The worker could not decode this format — try the main thread below.
    }
  }
  const img = await decodeImage(blob);
  try {
    const { width, height } = imageSize(img);
    const make = (w: number, h: number) => {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w));
      c.height = Math.max(1, Math.round(h));
      return c;
    };
    return await runOps(img, width, height, ops, make);
  } finally {
    if ("close" in img) img.close();
  }
}
