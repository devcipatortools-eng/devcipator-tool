"use client";

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { closePdf, openPdf, PasswordRequiredError } from "@/lib/pdf/pdfjs";
import { errorMessage } from "@/lib/files";

export interface PdfDocumentState {
  doc: PDFDocumentProxy | null;
  numPages: number;
  loading: boolean;
  error: string | null;
  needsPassword: boolean;
}

interface Loaded {
  file: File;
  doc: PDFDocumentProxy | null;
  error: string | null;
  needsPassword: boolean;
}

/**
 * Opens a File with PDF.js for previews. The document (and its worker-side
 * memory) is destroyed when the file changes or the component unmounts.
 */
export function usePdfDocument(file: File | null | undefined): PdfDocumentState {
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let opened: PDFDocumentProxy | null = null;
    file
      .arrayBuffer()
      .then((buf) => openPdf(buf))
      .then((doc) => {
        opened = doc;
        if (cancelled) closePdf(doc);
        else setLoaded({ file, doc, error: null, needsPassword: false });
      })
      .catch((err) => {
        if (cancelled) return;
        const needsPassword = err instanceof PasswordRequiredError;
        setLoaded({ file, doc: null, error: needsPassword ? null : errorMessage(err), needsPassword });
      });
    return () => {
      cancelled = true;
      if (opened) closePdf(opened);
    };
  }, [file]);

  // State always belongs to a specific file; anything else is still loading.
  if (!file) return { doc: null, numPages: 0, loading: false, error: null, needsPassword: false };
  if (!loaded || loaded.file !== file) return { doc: null, numPages: 0, loading: true, error: null, needsPassword: false };
  return { doc: loaded.doc, numPages: loaded.doc?.numPages ?? 0, loading: false, error: loaded.error, needsPassword: loaded.needsPassword };
}
