"use client";

import { useState } from "react";
import { CircleCheck, Download, FileArchive, FileText } from "lucide-react";
import { downloadBlob, formatBytes, zipFiles, type OutputFile } from "@/lib/files";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { Button } from "@/components/ui/Button";

function ResultPreview({ file }: { file: OutputFile }) {
  const url = useObjectUrl(file.blob);
  const type = file.blob.type;
  if (url && type.startsWith("image/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="bg-checker size-11 shrink-0 rounded-lg border border-border object-contain" />;
  }
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-fg-muted">
      <FileText className="size-5" aria-hidden />
    </span>
  );
}

function ResultRow({ file }: { file: OutputFile }) {
  const url = useObjectUrl(file.blob.type.startsWith("audio/") ? file.blob : null);
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-2.5">
      <div className="flex items-center gap-3">
        <ResultPreview file={file} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-fg-muted">
            {formatBytes(file.blob.size)}
            {file.note && <span className="ml-1.5 font-medium text-success">{file.note}</span>}
          </p>
        </div>
        <Button size="sm" variant="secondary" icon={<Download className="size-4" />} onClick={() => downloadBlob(file.blob, file.name)} aria-label={`Download ${file.name}`}>
          <span className="hidden sm:inline">Save</span>
        </Button>
      </div>
      {url && <audio controls src={url} className="h-9 w-full" preload="metadata" />}
    </li>
  );
}

export function ResultList({ results, zipName = "devcipator-files.zip", message }: { results: OutputFile[]; zipName?: string; message?: string | null }) {
  const [zipping, setZipping] = useState(false);
  if (results.length === 0 && !message) return null;

  async function downloadAll() {
    setZipping(true);
    try {
      downloadBlob(await zipFiles(results), zipName);
    } finally {
      setZipping(false);
    }
  }

  return (
    <section aria-label="Results" className="flex flex-col gap-3 rounded-2xl border border-success/30 bg-success-soft/60 p-3">
      <p className="flex items-center gap-2 px-1 text-sm font-semibold text-success">
        <CircleCheck className="size-4" aria-hidden />
        {results.length > 0 ? `${results.length} file${results.length === 1 ? "" : "s"} ready` : "Finished"}
      </p>
      {message && <p className="px-1 text-sm text-fg">{message}</p>}
      {results.length === 1 && (
        <Button size="lg" className="w-full" icon={<Download className="size-5" />} onClick={() => downloadBlob(results[0].blob, results[0].name)}>
          Download
        </Button>
      )}
      {results.length > 1 && (
        <Button size="lg" className="w-full" loading={zipping} icon={<FileArchive className="size-5" />} onClick={downloadAll}>
          Download all (ZIP)
        </Button>
      )}
      {results.length > 0 && (
        <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {results.map((f, i) => (
            <ResultRow key={`${f.name}-${i}`} file={f} />
          ))}
        </ul>
      )}
    </section>
  );
}
