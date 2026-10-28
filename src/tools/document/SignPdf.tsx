"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Signature, X } from "lucide-react";
import { useProcessor } from "@/hooks/useProcessor";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { pdfBlob, pdfWorker } from "@/lib/pdf/client";
import { canvasToBytes } from "@/lib/pdf/pdfjs";
import type { DisplayRect } from "@/lib/pdf/api";
import { decodeImage, imageSize } from "@/lib/image/decode";
import { uid, withExtension } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { PdfPageCanvas } from "@/components/pdf/PdfPageCanvas";
import { SignatureCanvas, trimCanvas } from "@/components/pdf/SignatureCanvas";
import { FileDropzone } from "@/components/tool/FileDropzone";
import { Button, IconButton } from "@/components/ui/Button";
import { Notice, Segmented, Toggle } from "@/components/ui/controls";

interface Placement {
  id: string;
  pageIndex: number;
  /** Normalised to the displayed page (0..1, top-left origin). */
  left: number;
  top: number;
  width: number;
  /** Displayed page width / height, so height can follow the signature's aspect ratio. */
  pageRatio: number;
}

const VIEW_WIDTH = 600;

/** Makes near-white pixels transparent (for photos of signatures on paper). */
function knockOutWhite(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const lightness = (d[i] + d[i + 1] + d[i + 2]) / 3;
    if (lightness > 200) d[i + 3] = Math.round(Math.max(0, (235 - lightness) / 35) * d[i + 3]);
  }
  ctx.putImageData(img, 0, 0);
}

export default function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState<"draw" | "upload">("draw");
  const [drawn, setDrawn] = useState<HTMLCanvasElement | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<HTMLCanvasElement | null>(null);
  const [removeWhite, setRemoveWhite] = useState(true);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [page, setPage] = useState(1);
  const [pageRatio, setPageRatio] = useState(0.77);
  const processor = useProcessor();
  const { doc, numPages, error, needsPassword } = usePdfDocument(file);
  const overlay = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; mode: "move" | "resize"; x: number; y: number; start: Placement } | null>(null);

  const signature = source === "draw" ? drawn : uploaded;
  // Encoded once per signature change, not on every drag frame.
  const sigUrl = useMemo(() => signature?.toDataURL("image/png") ?? null, [signature]);
  const sigRatio = signature ? signature.width / signature.height : 3;

  useEffect(() => {
    if (!uploadFile) return;
    let cancelled = false;
    decodeImage(uploadFile).then((img) => {
      if (cancelled) return;
      const { width, height } = imageSize(img);
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      if ("close" in img) img.close();
      if (removeWhite) knockOutWhite(c);
      setUploaded(trimCanvas(c) ?? c);
    });
    return () => {
      cancelled = true;
    };
  }, [uploadFile, removeWhite]);

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    doc.getPage(page).then((p) => {
      const vp = p.getViewport({ scale: 1 });
      if (!cancelled) setPageRatio(vp.width / vp.height);
    });
    return () => {
      cancelled = true;
    };
  }, [doc, page]);

  const heightOf = (p: Placement) => (p.width * p.pageRatio) / sigRatio;

  function addToPage() {
    // On a phone-width preview 30% is too small to grab, so start larger.
    const width = (overlay.current?.offsetWidth ?? VIEW_WIDTH) < 480 ? 0.45 : 0.3;
    const height = (width * pageRatio) / sigRatio;
    setPlacements((ps) => [...ps, { id: uid(), pageIndex: page - 1, left: Math.min(0.6, 0.95 - width), top: Math.max(0, 0.85 - height), width, pageRatio }]);
  }

  function onPointerDown(e: React.PointerEvent, p: Placement, mode: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { id: p.id, mode, x: e.clientX, y: e.clientY, start: p };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const box = overlay.current?.getBoundingClientRect();
    if (!d || !box) return;
    const dx = (e.clientX - d.x) / box.width;
    const dy = (e.clientY - d.y) / box.height;
    setPlacements((ps) =>
      ps.map((p) => {
        if (p.id !== d.id) return p;
        const s = d.start;
        if (d.mode === "move") {
          const h = heightOf(s);
          return { ...p, left: Math.min(1 - s.width, Math.max(0, s.left + dx)), top: Math.min(1 - h, Math.max(0, s.top + dy)) };
        }
        const maxW = Math.min(1 - s.left, ((1 - s.top) * sigRatio) / s.pageRatio);
        return { ...p, width: Math.min(maxW, Math.max(0.05, s.width + dx)) };
      }),
    );
  }

  async function apply() {
    if (!file || !signature) return;
    const rects: DisplayRect[] = placements.map((p) => ({ pageIndex: p.pageIndex, left: p.left, top: p.top, width: p.width, height: heightOf(p) }));
    await processor.run(async ({ report, signal }) => {
      report(null, "Preparing signature");
      const png = await canvasToBytes(signature, "image/png");
      const buf = await file.arrayBuffer();
      const bytes = await pdfWorker().call("sign", [buf, png, rects], { onProgress: report, signal, transfer: [buf] });
      return [{ name: withExtension(file.name, "pdf", "-signed"), blob: pdfBlob(bytes), note: `${rects.length} signature${rects.length === 1 ? "" : "s"}` }];
    });
  }

  const onPage = placements.filter((p) => p.pageIndex === page - 1);

  return (
    <ToolLayout
      slug="sign-pdf"
      fileCount={file ? 1 : 0}
      onFiles={(f) => {
        setFile(f[0]);
        setPlacements([]);
        setPage(1);
      }}
      onReset={() => {
        setFile(null);
        setPlacements([]);
      }}
      processor={processor}
      action={{
        label: "Sign PDF",
        icon: <Signature className="size-5" />,
        disabled: !signature || placements.length === 0,
        hint: !signature ? "Create your signature first." : "Place the signature on a page.",
        onClick: apply,
      }}
      options={
        <>
          <Segmented
            label="Signature"
            value={source}
            onChange={setSource}
            options={[
              { value: "draw", label: "Draw" },
              { value: "upload", label: "Upload image" },
            ]}
          />
          {/* Keep the pad mounted so switching tabs doesn't erase the drawing. */}
          <div className={source === "draw" ? "" : "hidden"}>
            <SignatureCanvas onChange={setDrawn} />
          </div>
          {source === "upload" && (
            <>
              <FileDropzone
                tool={{ accept: ["image/png", "image/jpeg", "image/webp", ".png", ".jpg", ".jpeg", ".webp"], acceptLabel: "PNG, JPG, WebP", maxSizeMB: 10, multiple: false, category: "document" }}
                variant="compact"
                label={uploadFile ? `Signature: ${uploadFile.name}` : "Choose signature image"}
                onFiles={(f) => setUploadFile(f[0])}
              />
              <Toggle label="Remove white background" hint="For photos or scans of a signature on paper." checked={removeWhite} onChange={setRemoveWhite} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {sigUrl && <img src={sigUrl} alt="Uploaded signature" className="bg-checker max-h-24 self-start rounded-lg border border-border p-2" />}
            </>
          )}
          <Button variant="secondary" icon={<Plus className="size-4" />} disabled={!signature || !doc} onClick={addToPage}>
            Place on page {page}
          </Button>
          {placements.length > 0 && (
            <p className="text-sm text-fg-muted">
              {placements.length} placement{placements.length === 1 ? "" : "s"} on page{new Set(placements.map((p) => p.pageIndex)).size === 1 ? "" : "s"}{" "}
              {[...new Set(placements.map((p) => p.pageIndex + 1))].sort((a, b) => a - b).join(", ")}
            </p>
          )}
        </>
      }
    >
      <Panel
        title={`Page ${page} of ${numPages || "…"}`}
        actions={
          <>
            <IconButton label="Previous page" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="size-4" />
            </IconButton>
            <IconButton label="Next page" onClick={() => setPage((p) => Math.min(numPages, p + 1))} disabled={page >= numPages}>
              <ChevronRight className="size-4" />
            </IconButton>
          </>
        }
      >
        {needsPassword && <Notice tone="warning">This PDF is password-protected. Remove the password in your PDF reader first.</Notice>}
        {error && <Notice tone="danger">{error}</Notice>}
        {doc && (
          // No overflow clipping here: the remove and resize handles stick out past the page edge.
          <div className="flex justify-center">
            <div ref={overlay} className="relative select-none border border-border bg-white shadow-card" style={{ width: VIEW_WIDTH, maxWidth: "100%" }} onPointerMove={onPointerMove} onPointerUp={() => (drag.current = null)}>
              <PdfPageCanvas doc={doc} pageNumber={page} width={VIEW_WIDTH} className="[&>canvas]:!w-full" />
              {/* touch-none sits on each signature only, so swiping elsewhere on the page still scrolls. */}
              {sigUrl &&
                onPage.map((p) => (
                  <div
                    key={p.id}
                    className="group absolute cursor-move touch-none outline outline-2 outline-dashed outline-primary"
                    style={{ left: `${p.left * 100}%`, top: `${p.top * 100}%`, width: `${p.width * 100}%`, height: `${heightOf(p) * 100}%` }}
                    onPointerDown={(e) => onPointerDown(e, p, "move")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sigUrl} alt="Signature" className="pointer-events-none size-full" draggable={false} />
                    <button
                      type="button"
                      aria-label="Remove signature"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setPlacements((ps) => ps.filter((x) => x.id !== p.id))}
                      className="absolute -right-3 -top-3 flex size-6 items-center justify-center rounded-full bg-danger text-white shadow-pop cursor-pointer pointer-coarse:after:absolute pointer-coarse:after:-inset-2.5 pointer-coarse:after:content-['']"
                    >
                      <X className="size-3.5" />
                    </button>
                    <span
                      aria-label="Resize signature"
                      className="absolute -bottom-2 -right-2 size-4 cursor-nwse-resize rounded-sm border-2 border-white bg-primary pointer-coarse:-bottom-2.5 pointer-coarse:-right-2.5 pointer-coarse:size-5 pointer-coarse:after:absolute pointer-coarse:after:-inset-3 pointer-coarse:after:content-['']"
                      onPointerDown={(e) => onPointerDown(e, p, "resize")}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
        <p className="mt-3 text-center text-xs text-fg-subtle">Drag a signature to move it; drag the corner handle to resize it.</p>
      </Panel>
    </ToolLayout>
  );
}
