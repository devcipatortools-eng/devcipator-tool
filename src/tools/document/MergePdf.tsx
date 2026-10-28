"use client";

import { useMemo, useState } from "react";
import { Combine } from "lucide-react";
import { useFileList } from "@/hooks/useFileList";
import { useProcessor } from "@/hooks/useProcessor";
import { usePdfInfos, usePdfMerge } from "@/hooks/usePdfOps";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { ReorderHint, SortableFileList } from "@/components/tool/SortableFileList";
import { PdfFileThumb } from "@/components/pdf/PdfPageCanvas";
import { Field, TextInput, Notice } from "@/components/ui/controls";

export default function MergePdf() {
  const list = useFileList(true);
  const processor = useProcessor();
  const merge = usePdfMerge();
  const [name, setName] = useState("merged");
  const files = useMemo(() => list.items.map((i) => i.file), [list.items]);
  const infos = usePdfInfos(files);

  const totalPages = files.reduce((n, f) => {
    const info = infos.get(f);
    return n + (info && info !== "error" ? info.pageCount : 0);
  }, 0);
  const problems = files.filter((f) => {
    const info = infos.get(f);
    return info === "error" || (info && info.encrypted);
  });

  return (
    <ToolLayout
      slug="merge-pdf"
      fileCount={list.items.length}
      onFiles={list.add}
      onReset={list.clear}
      processor={processor}
      action={{
        label: files.length < 2 ? "Merge PDFs" : `Merge ${files.length} PDFs`,
        icon: <Combine className="size-5" />,
        disabled: files.length < 2 || problems.length > 0,
        hint: problems.length ? "Remove the highlighted files first." : "Add at least two PDFs.",
        onClick: () => processor.run((ctx) => merge(files, `${name.trim() || "merged"}.pdf`, ctx)),
      }}
      options={
        <>
          <Field label="Output file name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} aria-label="Output file name" />
          </Field>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-surface-2 px-3 py-2">
              <dt className="text-xs text-fg-subtle">Files</dt>
              <dd className="font-semibold tabular-nums">{files.length}</dd>
            </div>
            <div className="rounded-lg bg-surface-2 px-3 py-2">
              <dt className="text-xs text-fg-subtle">Total pages</dt>
              <dd className="font-semibold tabular-nums">{totalPages || "—"}</dd>
            </div>
          </dl>
        </>
      }
    >
      <Panel title="Files in merge order" actions={<ReorderHint drag="Drag rows to reorder" />}>
        {problems.length > 0 && (
          <Notice tone="warning" className="mb-3">
            {problems.length} file{problems.length > 1 ? "s are" : " is"} encrypted or unreadable. Remove {problems.length > 1 ? "them" : "it"} or remove the password first.
          </Notice>
        )}
        <SortableFileList
          items={list.items}
          onMove={list.move}
          onRemove={list.remove}
          renderLeading={(item) => <PdfFileThumb file={item.file} />}
          renderMeta={(item) => {
            const info = infos.get(item.file);
            if (!info) return "reading…";
            if (info === "error") return <span className="text-danger">unreadable</span>;
            if (info.encrypted) return <span className="text-danger">password protected</span>;
            return `${info.pageCount} page${info.pageCount === 1 ? "" : "s"}`;
          }}
        />
      </Panel>
    </ToolLayout>
  );
}
