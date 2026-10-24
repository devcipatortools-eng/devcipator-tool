"use client";

import { useEffect, useRef, useState } from "react";
import { pdfBlob, pdfWorker } from "@/lib/pdf/client";
import type { PdfInfo } from "@/lib/pdf/api";
import type { ProcessContext } from "./useProcessor";
import type { OutputFile } from "@/lib/files";

/** Page count / encryption info for a list of PDFs, keyed by File identity. */
export function usePdfInfos(files: File[]): Map<File, PdfInfo | "error"> {
  const [infos, setInfos] = useState<Map<File, PdfInfo | "error">>(new Map());
  const requested = useRef(new WeakSet<File>());
  useEffect(() => {
    for (const f of files) {
      if (requested.current.has(f)) continue;
      requested.current.add(f);
      f.arrayBuffer()
        .then((buf) => pdfWorker().call("info", [buf], { transfer: [buf] }))
        .then(
          (info) => setInfos((prev) => new Map(prev).set(f, info)),
          () => setInfos((prev) => new Map(prev).set(f, "error")),
        );
    }
  }, [files]);
  return infos;
}

/** Merges PDFs in order inside the pdf worker. */
export function usePdfMerge() {
  return async (files: File[], name: string, { report, signal }: ProcessContext): Promise<OutputFile[]> => {
    report(0, "Reading files");
    const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
    const bytes = await pdfWorker().call("merge", [buffers], { onProgress: report, signal, transfer: buffers });
    return [{ name, blob: pdfBlob(bytes) }];
  };
}
