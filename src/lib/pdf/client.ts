import { createWorkerClient } from "@/lib/worker-rpc";
import type { PdfApi } from "./api";

let client: ReturnType<typeof createWorkerClient<PdfApi>> | null = null;

/** Shared pdf-lib worker. All structural PDF operations run off the main thread. */
export function pdfWorker() {
  if (!client) {
    client = createWorkerClient<PdfApi>(
      () => new Worker(new URL("../../workers/pdf.worker.ts", import.meta.url), { type: "module", name: "pdf" }),
    );
  }
  return client;
}

export function pdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}
