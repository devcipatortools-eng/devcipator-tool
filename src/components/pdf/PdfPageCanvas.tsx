"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { FileText } from "lucide-react";
import { renderPage } from "@/lib/pdf/pdfjs";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { cn } from "@/lib/cn";

/** Renders one page of an open PDF.js document into a responsive canvas. */
export function PdfPageCanvas({
  doc,
  pageNumber,
  width = 160,
  rotation = 0,
  className,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  width?: number;
  rotation?: number;
  className?: string;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const page = await doc.getPage(pageNumber);
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const canvas = await renderPage(page, { maxWidth: width * dpr, maxHeight: width * dpr * 1.6, rotation });
        if (cancelled || !holder.current) return;
        canvas.className = "block h-auto max-w-full";
        canvas.style.width = `${canvas.width / dpr}px`;
        holder.current.replaceChildren(canvas);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber, width, rotation]);

  return (
    <div ref={holder} className={cn("flex items-center justify-center", className)} style={{ minHeight: width * 0.5 }}>
      {failed && <FileText className="size-8 text-fg-subtle" aria-label="Preview unavailable" />}
    </div>
  );
}

/** First-page thumbnail for a PDF File. */
export function PdfFileThumb({ file, width = 44 }: { file: File; width?: number }) {
  const { doc, error, needsPassword } = usePdfDocument(file);
  return (
    <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white" style={{ width, height: width * 1.3 }}>
      {doc ? (
        <PdfPageCanvas doc={doc} pageNumber={1} width={width} />
      ) : (
        <FileText className={cn("size-5", error || needsPassword ? "text-danger" : "text-fg-subtle")} aria-hidden />
      )}
    </div>
  );
}
