"use client";

import { useEffect, useState } from "react";
import { decodeImage, imageSize } from "@/lib/image/decode";
import { errorMessage } from "@/lib/files";

export interface DecodedImage {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  /** Downscaled copy for fast interactive previews. */
  preview: HTMLCanvasElement;
}

/** Decodes a file once and keeps a preview-sized canvas; the bitmap is closed when the file changes. */
export function useDecodedImage(file: File | null, previewMax = 1000) {
  const [state, setState] = useState<{ file: File; image: DecodedImage | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let decoded: ImageBitmap | HTMLImageElement | null = null;
    decodeImage(file)
      .then((source) => {
        decoded = source;
        if (cancelled) return;
        const { width, height } = imageSize(source);
        const s = Math.min(1, previewMax / Math.max(width, height));
        const preview = document.createElement("canvas");
        preview.width = Math.max(1, Math.round(width * s));
        preview.height = Math.max(1, Math.round(height * s));
        const ctx = preview.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(source, 0, 0, preview.width, preview.height);
        setState({ file, image: { source, width, height, preview }, error: null });
      })
      .catch((err) => !cancelled && setState({ file, image: null, error: errorMessage(err) }));
    return () => {
      cancelled = true;
      if (decoded && "close" in decoded) decoded.close();
    };
  }, [file, previewMax]);

  const current = file && state?.file === file ? state : null;
  return { image: current?.image ?? null, error: current?.error ?? null };
}
