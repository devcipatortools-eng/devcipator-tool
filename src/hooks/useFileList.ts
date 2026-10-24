"use client";

import { useCallback, useState } from "react";
import { uid } from "@/lib/files";

export interface FileItem {
  id: string;
  file: File;
}

/** Ordered list of input files with stable ids for keys and reordering. */
export function useFileList(multiple: boolean) {
  const [items, setItems] = useState<FileItem[]>([]);

  const add = useCallback(
    (files: File[]) => {
      const next = files.map((file) => ({ id: uid(), file }));
      setItems((prev) => (multiple ? [...prev, ...next] : next.slice(0, 1)));
    },
    [multiple],
  );

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);

  const move = useCallback((from: number, to: number) => {
    setItems((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, files: items.map((i) => i.file), add, remove, move, clear, setItems };
}
