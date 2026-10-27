"use client";

import type { ReactNode } from "react";
import { RotateCcw, Square } from "lucide-react";
import { getTool } from "@/config/tools.config";
import type { Processor } from "@/hooks/useProcessor";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/controls";
import { FileDropzone } from "./FileDropzone";
import { ProgressBar } from "./ProgressBar";
import { ResultList } from "./ResultList";

export interface ToolAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  /** Shown under the button when disabled, e.g. "Add at least two files". */
  hint?: string;
}

export interface ToolLayoutProps {
  slug: string;
  /** Number of loaded input files; 0 shows the upload screen. */
  fileCount: number;
  onFiles: (files: File[]) => void;
  /** Clears inputs; ToolLayout resets the processor itself. */
  onReset: () => void;
  processor: Processor;
  action: ToolAction;
  /** Settings panel content (right column). */
  options?: ReactNode;
  /** Preview / canvas / waveform / file list (left column). */
  children: ReactNode;
  /** Show the "add more files" button under the options. Defaults to tool.multiple. */
  allowAddMore?: boolean;
  zipName?: string;
  dropLabel?: ReactNode;
}

/**
 * Shared workspace shell for every tool: upload screen, preview area,
 * settings panel, primary action, progress, errors and downloadable results.
 */
export function ToolLayout({
  slug,
  fileCount,
  onFiles,
  onReset,
  processor,
  action,
  options,
  children,
  allowAddMore,
  zipName,
  dropLabel,
}: ToolLayoutProps) {
  const tool = getTool(slug);
  if (!tool) throw new Error(`Unknown tool: ${slug}`);
  const running = processor.status === "running";

  if (fileCount === 0) {
    return <FileDropzone tool={tool} onFiles={onFiles} label={dropLabel} />;
  }

  function reset() {
    processor.reset();
    onReset();
  }

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">{children}</div>

      <aside className="flex flex-col gap-4 md:sticky md:top-20" aria-label="Settings">
        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Settings</h2>
            <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-fg cursor-pointer pointer-coarse:-my-3.5 pointer-coarse:py-3.5">
              <RotateCcw className="size-3.5" aria-hidden /> Start over
            </button>
          </div>

          {options}

          {(allowAddMore ?? tool.multiple) && !running && <FileDropzone tool={tool} onFiles={onFiles} variant="compact" />}

          <div className="flex flex-col gap-2 border-t border-border pt-4">
            {running ? (
              <>
                <ProgressBar progress={processor.progress} />
                <Button variant="secondary" icon={<Square className="size-3.5" />} onClick={processor.cancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="w-full" icon={action.icon} onClick={action.onClick} disabled={action.disabled}>
                  {action.label}
                </Button>
                {action.disabled && action.hint && <p className="text-center text-xs text-fg-subtle">{action.hint}</p>}
              </>
            )}
          </div>

          {processor.status === "error" && processor.error && <Notice tone="danger">{processor.error}</Notice>}
        </div>

        {processor.status === "done" && <ResultList results={processor.results} zipName={zipName ?? `${slug}.zip`} message={processor.message} />}
      </aside>
    </div>
  );
}

/** Card wrapper used for the preview column. */
export function Panel({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-surface shadow-card ${className ?? ""}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
