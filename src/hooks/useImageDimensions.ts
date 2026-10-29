"use client";

import { useEffect, useRef, useState } from "react";
import { decodeImage, imageSize } from "@/lib/image/decode";

/** Natural pixel size of each image file (EXIF orientation applied); null once a file fails to decode. */
export function useImageDimensions(files: File[]): Map<File, { width: number; height: number } | null> {
  const [dims, setDims] = useState(new Map<File, { width: number; height: number } | null>());
  const requested = useRef(new WeakSet<File>());
  useEffect(() => {
    for (const f of files) {
      if (requested.current.has(f)) continue;
      requested.current.add(f);
      decodeImage(f)
        .then((img) => {
          const size = imageSize(img);
          if ("close" in img) img.close();
          setDims((prev) => new Map(prev).set(f, size));
        })
        .catch(() => setDims((prev) => new Map(prev).set(f, null)));
    }
  }, [files]);
  return dims;
}
