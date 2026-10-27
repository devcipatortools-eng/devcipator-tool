"use client";

import { useState } from "react";
import { FileImage } from "lucide-react";
import { useProcessor, throwIfAborted, yieldToMain } from "@/hooks/useProcessor";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { canvasToBytes, renderPage } from "@/lib/pdf/pdfjs";
import { parseRanges } from "@/lib/pdf/ranges";
import { baseName, type OutputFile } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { PdfPageCanvas } from "@/components/pdf/PdfPageCanvas";
import { Field, Notice, Segmented, Select, Slider, TextInput } from "@/components/ui/controls";

type Format = "png" | "jpg";

export default function PdfToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<Format>("png");
  const [dpi, setDpi] = useState("150");
  const [quality, setQuality] = useState(90);
  const [which, setWhich] = useState<"all" | "range">("all");
  const [range, setRange] = useState("1-3");
  const processor = useProcessor();
  const { doc, numPages, error, needsPassword, loading } = usePdfDocument(file);

  const selection = which === "all" || numPages === 0 ? { groups: [Array.from({ length: numPages }, (_, i) => i)], error: null } : parseRanges(range, numPages);
  const pages = [...new Set(selection.groups.flat())];
  const selected = new Set(pages);

  async function convert() {
    if (!doc || !file) return;
    const scale = Number(dpi) / 72;
    await processor.run(async ({ report, signal }) => {
      const out: OutputFile[] = [];
      for (let i = 0; i < pages.length; i++) {
        throwIfAborted(signal);
        const n = pages[i] + 1;
        report(i / pages.length, `Rendering page ${n} (${i + 1} of ${pages.length})`);
        const page = await doc.getPage(n);
        const canvas = await renderPage(page, { scale });
        const bytes = await canvasToBytes(canvas, format === "png" ? "image/png" : "image/jpeg", quality / 100);
        out.push({
          name: `${baseName(file.name)}-page-${String(n).padStart(String(numPages).length, "0")}.${format}`,
          blob: new Blob([bytes as BlobPart], { type: format === "png" ? "image/png" : "image/jpeg" }),
          note: `${canvas.width}×${canvas.height}`,
        });
        // Release the bitmap memory right away; large pages at 300 DPI are ~30 MB each.
        canvas.width = canvas.height = 0;
        page.cleanup();
        await yieldToMain();
      }
      return out;
    });
  }

  return (
    <ToolLayout
      slug="pdf-to-images"
      fileCount={file ? 1 : 0}
      onFiles={(f) => setFile(f[0])}
      onReset={() => setFile(null)}
      processor={processor}
      zipName={file ? `${baseName(file.name)}-images.zip` : undefined}
      action={{
        label: `Convert ${pages.length || ""} page${pages.length === 1 ? "" : "s"} to ${format.toUpperCase()}`,
        icon: <FileImage className="size-5" />,
        disabled: !doc || !!selection.error || pages.length === 0,
        hint: selection.error ?? undefined,
        onClick: convert,
      }}
      options={
        <>
          <Segmented
            label="Image format"
            value={format}
            onChange={setFormat}
            options={[
              { value: "png", label: "PNG" },
              { value: "jpg", label: "JPG" },
            ]}
          />
          <Select
            label="Resolution"
            value={dpi}
            onChange={setDpi}
            options={[
              { value: "72", label: "72 DPI — screen, small files" },
              { value: "150", label: "150 DPI — recommended" },
              { value: "200", label: "200 DPI — sharp" },
              { value: "300", label: "300 DPI — print quality" },
            ]}
          />
          {format === "jpg" && <Slider label="JPG quality" value={quality} onChange={setQuality} min={30} max={100} format={(v) => `${v}%`} />}
          <Segmented
            label="Pages"
            value={which}
            onChange={setWhich}
            options={[
              { value: "all", label: "All pages" },
              { value: "range", label: "Choose pages" },
            ]}
          />
          {which === "range" && (
            <Field label="Page ranges" hint="For example: 1-3, 5, 8-">
              <TextInput value={range} onChange={(e) => setRange(e.target.value)} aria-label="Page ranges" />
            </Field>
          )}
          {selection.error && <Notice tone="danger">{selection.error}</Notice>}
        </>
      }
    >
      <Panel title={file ? `${file.name} · ${numPages || "…"} pages` : "Preview"} actions={<span className="text-xs text-fg-subtle">Highlighted pages are exported</span>}>
        {needsPassword && <Notice tone="warning">This PDF is password-protected. Remove the password in your PDF reader first.</Notice>}
        {error && <Notice tone="danger">{error}</Notice>}
        {loading && <p className="py-10 text-center text-sm text-fg-subtle">Loading pages…</p>}
        {doc && (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: numPages }, (_, i) => (
              <li key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-full overflow-hidden rounded-lg border bg-white p-1 ${selected.has(i) ? "border-primary ring-2 ring-primary/40" : "border-border opacity-40"}`}>
                  <PdfPageCanvas doc={doc} pageNumber={i + 1} width={110} />
                </div>
                <span className="text-xs text-fg-muted tabular-nums">{i + 1}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </ToolLayout>
  );
}
