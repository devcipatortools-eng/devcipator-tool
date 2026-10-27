"use client";

import { useState } from "react";
import { RotateCcw, RotateCw, Save, Undo2 } from "lucide-react";
import { useProcessor } from "@/hooks/useProcessor";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { pdfBlob, pdfWorker } from "@/lib/pdf/client";
import { withExtension } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { PdfPageCanvas } from "@/components/pdf/PdfPageCanvas";
import { Button, IconButton } from "@/components/ui/Button";
import { Notice } from "@/components/ui/controls";
import { cn } from "@/lib/cn";

const norm = (deg: number) => ((deg % 360) + 360) % 360;

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [rotations, setRotations] = useState<number[]>([]);
  const processor = useProcessor();
  const { doc, numPages, error, needsPassword, loading } = usePdfDocument(file);

  // Reset rotations whenever a new document opens.
  const [initFor, setInitFor] = useState<unknown>(null);
  if (doc && initFor !== doc) {
    setInitFor(doc);
    setRotations(Array(numPages).fill(0));
  }

  const rotatePage = (i: number, delta: number) => setRotations((r) => r.map((v, k) => (k === i ? norm(v + delta) : v)));
  const rotateAll = (delta: number) => setRotations((r) => r.map((v) => norm(v + delta)));
  const changed = rotations.filter((r) => r !== 0).length;

  async function save() {
    if (!file) return;
    const pages = rotations.map((rotate, index) => ({ index, rotate }));
    await processor.run(async ({ report, signal }) => {
      const buf = await file.arrayBuffer();
      const bytes = await pdfWorker().call("organize", [buf, pages], { onProgress: report, signal, transfer: [buf] });
      return [{ name: withExtension(file.name, "pdf", "-rotated"), blob: pdfBlob(bytes), note: `${changed} page${changed === 1 ? "" : "s"} rotated` }];
    });
  }

  return (
    <ToolLayout
      slug="rotate-pdf"
      fileCount={file ? 1 : 0}
      onFiles={(f) => setFile(f[0])}
      onReset={() => {
        setFile(null);
        setRotations([]);
      }}
      processor={processor}
      action={{ label: "Save rotated PDF", icon: <Save className="size-5" />, disabled: !doc || changed === 0, hint: "Rotate at least one page.", onClick: save }}
      options={
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Rotate all pages</span>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" size="sm" icon={<RotateCcw className="size-4" />} onClick={() => rotateAll(-90)} disabled={!doc} aria-label="Rotate all pages left 90°">
                Left
              </Button>
              <Button variant="secondary" size="sm" icon={<RotateCw className="size-4" />} onClick={() => rotateAll(90)} disabled={!doc} aria-label="Rotate all pages right 90°">
                Right
              </Button>
              <Button variant="secondary" size="sm" onClick={() => rotateAll(180)} disabled={!doc}>
                180°
              </Button>
            </div>
          </div>
          <Button variant="ghost" icon={<Undo2 className="size-4" />} disabled={changed === 0} onClick={() => setRotations(Array(numPages).fill(0))}>
            Reset rotations
          </Button>
          <p className="text-sm text-fg-muted">
            {changed} of {numPages} pages will be rotated.
          </p>
        </>
      }
    >
      <Panel title="Pages" actions={<span className="text-xs text-fg-subtle">Use the buttons under each page</span>}>
        {needsPassword && <Notice tone="warning">This PDF is password-protected. Remove the password in your PDF reader first.</Notice>}
        {error && <Notice tone="danger">{error}</Notice>}
        {loading && <p className="py-10 text-center text-sm text-fg-subtle">Loading pages…</p>}
        {doc && (
          <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {rotations.map((rot, i) => (
              <li key={i} className={cn("flex flex-col gap-2 rounded-xl border bg-surface-2 p-2", rot ? "border-primary" : "border-border")}>
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg bg-white">
                  <PdfPageCanvas doc={doc} pageNumber={i + 1} width={140} rotation={rot} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="pl-1 text-xs text-fg-muted tabular-nums">
                    {i + 1}
                    {rot !== 0 && <span className="text-primary-strong"> · {rot}°</span>}
                  </span>
                  <div className="flex">
                    <IconButton label={`Rotate page ${i + 1} left`} onClick={() => rotatePage(i, -90)} className="size-7 pointer-coarse:size-9">
                      <RotateCcw className="size-3.5" />
                    </IconButton>
                    <IconButton label={`Rotate page ${i + 1} right`} onClick={() => rotatePage(i, 90)} className="size-7 pointer-coarse:size-9">
                      <RotateCw className="size-3.5" />
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
