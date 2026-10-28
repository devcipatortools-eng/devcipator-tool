"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, RotateCw, Save, Trash2, Undo2 } from "lucide-react";
import { useProcessor } from "@/hooks/useProcessor";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { pdfBlob, pdfWorker } from "@/lib/pdf/client";
import { withExtension } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { ReorderHint } from "@/components/tool/SortableFileList";
import { PdfPageCanvas } from "@/components/pdf/PdfPageCanvas";
import { Button, IconButton } from "@/components/ui/Button";
import { Notice } from "@/components/ui/controls";
import { cn } from "@/lib/cn";

interface PageState {
  index: number;
  rotate: number;
  deleted: boolean;
}

export default function OrganizePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageState[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const processor = useProcessor();
  const { doc, numPages, error, needsPassword, loading } = usePdfDocument(file);

  // Initialise the page list once the document's page count is known.
  const [initFor, setInitFor] = useState<unknown>(null);
  if (doc && initFor !== doc) {
    setInitFor(doc);
    setPages(Array.from({ length: numPages }, (_, i) => ({ index: i, rotate: 0, deleted: false })));
  }

  const kept = pages.filter((p) => !p.deleted);
  const changed = pages.some((p, i) => p.index !== i || p.rotate !== 0 || p.deleted);

  function update(i: number, patch: Partial<PageState>) {
    setPages((prev) => prev.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  }
  function move(from: number, to: number) {
    setPages((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [p] = next.splice(from, 1);
      next.splice(to, 0, p);
      return next;
    });
  }
  function rotateAll(delta: number) {
    setPages((prev) => prev.map((p) => ({ ...p, rotate: (p.rotate + delta + 360) % 360 })));
  }

  async function save() {
    if (!file) return;
    const order = kept.map((p) => ({ index: p.index, rotate: p.rotate }));
    await processor.run(async ({ report, signal }) => {
      const buf = await file.arrayBuffer();
      const bytes = await pdfWorker().call("organize", [buf, order], { onProgress: report, signal, transfer: [buf] });
      return [{ name: withExtension(file.name, "pdf", "-organized"), blob: pdfBlob(bytes), note: `${order.length} pages` }];
    });
  }

  return (
    <ToolLayout
      slug="organize-pdf"
      fileCount={file ? 1 : 0}
      onFiles={(f) => setFile(f[0])}
      onReset={() => {
        setFile(null);
        setPages([]);
      }}
      processor={processor}
      action={{
        label: "Save organized PDF",
        icon: <Save className="size-5" />,
        disabled: !doc || kept.length === 0,
        hint: kept.length === 0 ? "Keep at least one page." : undefined,
        onClick: save,
      }}
      options={
        <>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" icon={<RotateCcw className="size-4" />} onClick={() => rotateAll(-90)} disabled={!doc} aria-label="Rotate all pages left">
              All left
            </Button>
            <Button variant="secondary" icon={<RotateCw className="size-4" />} onClick={() => rotateAll(90)} disabled={!doc} aria-label="Rotate all pages right">
              All right
            </Button>
          </div>
          <Button
            variant="ghost"
            icon={<Undo2 className="size-4" />}
            disabled={!changed}
            onClick={() => {
              setPages(Array.from({ length: numPages }, (_, i) => ({ index: i, rotate: 0, deleted: false })));
              processor.reset();
            }}
          >
            Reset all changes
          </Button>
          <p className="text-sm text-fg-muted">
            {kept.length} of {pages.length} pages kept
            {pages.length - kept.length > 0 && <span className="text-danger"> · {pages.length - kept.length} deleted</span>}
          </p>
        </>
      }
    >
      <Panel title="Pages" actions={<ReorderHint drag="Drag or use the arrows to reorder" />}>
        {needsPassword && <Notice tone="warning">This PDF is password-protected. Remove the password in your PDF reader first.</Notice>}
        {error && <Notice tone="danger">{error}</Notice>}
        {loading && <p className="py-10 text-center text-sm text-fg-subtle">Loading pages…</p>}
        {doc && (
          <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {pages.map((p, i) => (
              <li
                key={p.index}
                draggable
                onDragStart={() => setDragFrom(i)}
                onDragOver={(e) => dragFrom !== null && e.preventDefault()}
                onDrop={() => {
                  if (dragFrom !== null) move(dragFrom, i);
                  setDragFrom(null);
                }}
                onDragEnd={() => setDragFrom(null)}
                className={cn(
                  "group flex cursor-grab flex-col gap-2 rounded-xl border bg-surface-2 p-2",
                  dragFrom === i ? "border-primary opacity-50" : "border-border",
                  p.deleted && "opacity-45",
                )}
              >
                <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-white">
                  <PdfPageCanvas doc={doc} pageNumber={p.index + 1} width={140} rotation={p.rotate} />
                  {p.deleted && (
                    <span className="absolute inset-0 flex items-center justify-center bg-danger-soft/80 text-sm font-semibold text-danger">Deleted</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-y-1">
                  <span className="pl-1 text-xs text-fg-muted tabular-nums">
                    {i + 1}
                    {p.index !== i && <span className="text-fg-subtle"> (was {p.index + 1})</span>}
                  </span>
                  <div className="flex flex-wrap">
                    <IconButton label="Move left" onClick={() => move(i, i - 1)} disabled={i === 0} size="dense">
                      <ArrowLeft className="size-3.5" />
                    </IconButton>
                    <IconButton label="Move right" onClick={() => move(i, i + 1)} disabled={i === pages.length - 1} size="dense">
                      <ArrowRight className="size-3.5" />
                    </IconButton>
                    <IconButton label="Rotate clockwise" onClick={() => update(i, { rotate: (p.rotate + 90) % 360 })} size="dense">
                      <RotateCw className="size-3.5" />
                    </IconButton>
                    <IconButton
                      label={p.deleted ? "Restore page" : "Delete page"}
                      onClick={() => update(i, { deleted: !p.deleted })}
                      active={p.deleted}
                      size="dense"
                    >
                      {p.deleted ? <Undo2 className="size-3.5" /> : <Trash2 className="size-3.5" />}
                    </IconButton>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </ToolLayout>
  );
}
