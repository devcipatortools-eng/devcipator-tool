"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Hash } from "lucide-react";
import { useProcessor } from "@/hooks/useProcessor";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { pdfBlob, pdfWorker } from "@/lib/pdf/client";
import { pageNumberTotal, type NumberPosition, type PageNumberOptions } from "@/lib/pdf/api";
import { withExtension } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { PdfPageCanvas } from "@/components/pdf/PdfPageCanvas";
import { IconButton } from "@/components/ui/Button";
import { ColorInput, Field, NumberInput, Notice, Select, Slider, TextInput, Toggle } from "@/components/ui/controls";
import { cn } from "@/lib/cn";

const FORMATS = [
  { value: "Page {n} of {total}", label: "Page 1 of 10" },
  { value: "{n}", label: "1" },
  { value: "{n} / {total}", label: "1 / 10" },
  { value: "Page {n}", label: "Page 1" },
  { value: "- {n} -", label: "- 1 -" },
  { value: "custom", label: "Custom…" },
];

const POSITIONS: NumberPosition[] = ["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"];
const PREVIEW_WIDTH = 420;

export default function AddPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState(FORMATS[0].value);
  const [custom, setCustom] = useState("Page {n} of {total}");
  const [opts, setOpts] = useState<Omit<PageNumberOptions, "format">>({
    position: "bottom-center",
    fontSize: 11,
    color: "#333333",
    margin: 28,
    fromPage: 0,
    startAt: 1,
    totalOnlyNumbered: false,
  });
  const [previewPage, setPreviewPage] = useState(1);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const processor = useProcessor();
  const { doc, numPages, error, needsPassword } = usePdfDocument(file);
  const set = (patch: Partial<typeof opts>) => setOpts((o) => ({ ...o, ...patch }));
  const format = preset === "custom" ? custom : preset;

  useEffect(() => {
    if (!doc) return;
    let cancelled = false;
    doc.getPage(previewPage).then((p) => {
      const vp = p.getViewport({ scale: 1 });
      if (!cancelled) setPageSize({ width: vp.width, height: vp.height });
    });
    return () => {
      cancelled = true;
    };
  }, [doc, previewPage]);

  const index = previewPage - 1;
  const numbered = numPages - opts.fromPage;
  const total = pageNumberTotal(numPages, opts);
  const label = index >= opts.fromPage ? format.replaceAll("{n}", String(opts.startAt + index - opts.fromPage)).replaceAll("{total}", String(total)) : null;
  const scale = pageSize ? PREVIEW_WIDTH / pageSize.width : 1;
  const [vertical, horizontal] = opts.position.split("-");

  async function apply() {
    if (!file) return;
    const options: PageNumberOptions = { ...opts, format };
    await processor.run(async ({ report, signal }) => {
      const buf = await file.arrayBuffer();
      const bytes = await pdfWorker().call("pageNumbers", [buf, options], { onProgress: report, signal, transfer: [buf] });
      return [{ name: withExtension(file.name, "pdf", "-numbered"), blob: pdfBlob(bytes), note: `${numbered} pages numbered` }];
    });
  }

  return (
    <ToolLayout
      slug="add-page-numbers"
      fileCount={file ? 1 : 0}
      onFiles={(f) => setFile(f[0])}
      onReset={() => setFile(null)}
      processor={processor}
      action={{ label: "Add page numbers", icon: <Hash className="size-5" />, disabled: !doc || !format.includes("{n}"), hint: "The format must contain {n}.", onClick: apply }}
      options={
        <>
          <Select label="Format" value={preset} onChange={setPreset} options={FORMATS} />
          {preset === "custom" && (
            <Field label="Custom format" hint="Use {n} for the page number and {total} for the page count.">
              <TextInput value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Custom format" />
            </Field>
          )}
          <Field label="Position">
            <div className="grid grid-cols-3 gap-1.5">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set({ position: p })}
                  className={cn(
                    "rounded-lg border px-1 py-1.5 text-xs font-medium capitalize cursor-pointer pointer-coarse:min-h-11",
                    opts.position === p ? "border-primary bg-primary-soft text-primary-strong" : "border-border text-fg-muted hover:text-fg",
                  )}
                >
                  {p.replace("-", " ")}
                </button>
              ))}
            </div>
          </Field>
          <Slider label="Font size" value={opts.fontSize} onChange={(fontSize) => set({ fontSize })} min={6} max={36} format={(v) => `${v} pt`} />
          <Slider label="Distance from edge" value={opts.margin} onChange={(margin) => set({ margin })} min={8} max={90} format={(v) => `${v} pt`} />
          <ColorInput label="Colour" value={opts.color} onChange={(color) => set({ color })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start on page">
              <NumberInput value={opts.fromPage + 1} onChange={(v) => set({ fromPage: Math.min(Math.max(0, (v || 1) - 1), Math.max(0, numPages - 1)) })} min={1} max={numPages || 1} label="Start on page" />
            </Field>
            <Field label="First number">
              <NumberInput value={opts.startAt} onChange={(v) => set({ startAt: Number.isFinite(v) ? v : 1 })} min={0} label="First number" />
            </Field>
          </div>
          {opts.fromPage > 0 && <Toggle label="Total counts numbered pages only" checked={opts.totalOnlyNumbered} onChange={(totalOnlyNumbered) => set({ totalOnlyNumbered })} />}
        </>
      }
    >
      <Panel
        title={`Preview · page ${previewPage} of ${numPages || "…"}`}
        actions={
          <>
            <IconButton label="Previous page" onClick={() => setPreviewPage((p) => Math.max(1, p - 1))} disabled={previewPage <= 1}>
              <ChevronLeft className="size-4" />
            </IconButton>
            <IconButton label="Next page" onClick={() => setPreviewPage((p) => Math.min(numPages, p + 1))} disabled={previewPage >= numPages}>
              <ChevronRight className="size-4" />
            </IconButton>
          </>
        }
      >
        {needsPassword && <Notice tone="warning">This PDF is password-protected. Remove the password in your PDF reader first.</Notice>}
        {error && <Notice tone="danger">{error}</Notice>}
        {doc && pageSize && (
          <div className="flex justify-center">
            <div className="relative overflow-hidden rounded-lg border border-border bg-white shadow-card" style={{ width: PREVIEW_WIDTH }}>
              <PdfPageCanvas doc={doc} pageNumber={previewPage} width={PREVIEW_WIDTH} />
              {label && (
                <span
                  className="pointer-events-none absolute whitespace-nowrap font-[Helvetica,Arial,sans-serif] leading-none"
                  style={{
                    color: opts.color,
                    fontSize: opts.fontSize * scale,
                    [vertical === "top" ? "top" : "bottom"]: opts.margin * scale - (vertical === "bottom" ? opts.fontSize * scale * 0.2 : 0),
                    ...(horizontal === "left" ? { left: opts.margin * scale } : horizontal === "right" ? { right: opts.margin * scale } : { left: "50%", transform: "translateX(-50%)" }),
                  }}
                >
                  {label}
                </span>
              )}
            </div>
          </div>
        )}
      </Panel>
    </ToolLayout>
  );
}
