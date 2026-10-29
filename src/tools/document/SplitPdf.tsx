"use client";

import { useState } from "react";
import { Scissors } from "lucide-react";
import { useProcessor } from "@/hooks/useProcessor";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { pdfBlob, pdfWorker } from "@/lib/pdf/client";
import { chunkPages, describeGroup, parseRanges } from "@/lib/pdf/ranges";
import { baseName } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { PdfPageCanvas } from "@/components/pdf/PdfPageCanvas";
import { Field, Notice, NumberInput, Segmented, TextInput } from "@/components/ui/controls";
import { cn } from "@/lib/cn";

type Mode = "ranges" | "chunks" | "all";

const GROUP_COLORS = ["ring-primary", "ring-doc", "ring-img", "ring-aud"];

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<Mode>("ranges");
  const [ranges, setRanges] = useState("1-2, 3-");
  const [chunk, setChunk] = useState(2);
  const processor = useProcessor();
  const { doc, numPages, error, needsPassword, loading } = usePdfDocument(file);

  const parsed =
    numPages === 0
      ? { groups: [], error: null }
      : mode === "ranges"
        ? parseRanges(ranges, numPages)
        : mode === "chunks"
          ? Number.isInteger(chunk) && chunk >= 1
            ? { groups: chunkPages(numPages, chunk), error: null }
            : { groups: [], error: "Pages per file must be a whole number of 1 or more." }
          : { groups: chunkPages(numPages, 1), error: null };

  const pageGroup = new Map<number, number>();
  parsed.groups.forEach((g, gi) => g.forEach((p) => pageGroup.set(p, gi)));

  async function split() {
    if (!file) return;
    const groups = parsed.groups;
    await processor.run(async ({ report, signal }) => {
      const buf = await file.arrayBuffer();
      const parts = await pdfWorker().call("split", [buf, groups], { onProgress: report, signal, transfer: [buf] });
      return parts.map((bytes, i) => ({
        name: `${baseName(file.name)}-${describeGroup(groups[i])}.pdf`,
        blob: pdfBlob(bytes),
        note: `${groups[i].length} page${groups[i].length === 1 ? "" : "s"}`,
      }));
    });
  }

  return (
    <ToolLayout
      slug="split-pdf"
      fileCount={file ? 1 : 0}
      onFiles={(f) => setFile(f[0])}
      onReset={() => setFile(null)}
      processor={processor}
      zipName={file ? `${baseName(file.name)}-split.zip` : undefined}
      action={{
        label: parsed.groups.length ? `Split into ${parsed.groups.length} PDF${parsed.groups.length === 1 ? "" : "s"}` : "Split PDF",
        icon: <Scissors className="size-5" />,
        disabled: !doc || !!parsed.error || parsed.groups.length === 0,
        hint: parsed.error ?? undefined,
        onClick: split,
      }}
      options={
        <>
          <Segmented
            label="Split mode"
            value={mode}
            onChange={(m) => {
              setMode(m);
              processor.reset();
            }}
            options={[
              { value: "ranges", label: "Ranges" },
              { value: "chunks", label: "Every N" },
              { value: "all", label: "All pages" },
            ]}
          />
          {mode === "ranges" && (
            <Field label="Page ranges" hint="Comma-separated; each range becomes one file. “5-” means page 5 to the end.">
              <TextInput value={ranges} onChange={(e) => {
                  setRanges(e.target.value);
                  processor.reset();
                }} placeholder="1-3, 5, 8-" aria-label="Page ranges" />
            </Field>
          )}
          {mode === "chunks" && (
            <Field label="Pages per file">
              <NumberInput value={chunk} onChange={(v) => {
                  setChunk(v);
                  processor.reset();
                }} min={1} max={numPages || 1} label="Pages per file" />
            </Field>
          )}
          {parsed.error && <Notice tone="danger">{parsed.error}</Notice>}
        </>
      }
    >
      <Panel title={file ? `${file.name} · ${numPages || "…"} pages` : "Preview"} actions={<span className="text-xs text-fg-subtle">Outlined pages are included</span>}>
        {needsPassword && <Notice tone="warning">This PDF is password-protected. Remove the password in your PDF reader first.</Notice>}
        {error && <Notice tone="danger">{error}</Notice>}
        {loading && <p className="py-10 text-center text-sm text-fg-subtle">Loading pages…</p>}
        {doc && (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: numPages }, (_, i) => {
              const g = pageGroup.get(i);
              return (
                <li key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "w-full overflow-hidden rounded-lg border border-border bg-white p-1",
                      g !== undefined ? `ring-2 ${GROUP_COLORS[g % GROUP_COLORS.length]}` : "opacity-40",
                    )}
                  >
                    <PdfPageCanvas doc={doc} pageNumber={i + 1} width={110} />
                  </div>
                  <span className="text-xs text-fg-muted tabular-nums">
                    {i + 1}
                    {g !== undefined && <span className="text-fg-subtle"> · part {g + 1}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </ToolLayout>
  );
}
