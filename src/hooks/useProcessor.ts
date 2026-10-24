"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage, type OutputFile } from "@/lib/files";

export type ProcessStatus = "idle" | "running" | "done" | "error";

export interface Progress {
  /** 0..1, or null for indeterminate. */
  value: number | null;
  label: string;
}

export interface ProcessContext {
  report: (value: number | null, label?: string) => void;
  signal: AbortSignal;
}

export interface ProcessorState {
  status: ProcessStatus;
  progress: Progress;
  results: OutputFile[];
  error: string | null;
  message: string | null;
}

export type ProcessResult = OutputFile[] | { files: OutputFile[]; message?: string };

/**
 * Runs an async job with progress reporting, cancellation and result/error state.
 * Each tool passes its own job; the UI (ToolLayout) renders the state.
 */
export function useProcessor() {
  const [state, setState] = useState<ProcessorState>({
    status: "idle",
    progress: { value: null, label: "" },
    results: [],
    error: null,
    message: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(async (job: (ctx: ProcessContext) => Promise<ProcessResult>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "running", progress: { value: null, label: "Starting…" }, results: [], error: null, message: null });

    const report = (value: number | null, label?: string) => {
      if (controller.signal.aborted) return;
      setState((s) => ({ ...s, progress: { value, label: label ?? s.progress.label } }));
    };

    try {
      const out = await job({ report, signal: controller.signal });
      if (controller.signal.aborted) return;
      const files = Array.isArray(out) ? out : out.files;
      const message = Array.isArray(out) ? null : (out.message ?? null);
      setState({ status: "done", progress: { value: 1, label: "Done" }, results: files, error: null, message });
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(err);
      setState((s) => ({ ...s, status: "error", error: errorMessage(err) }));
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, status: "idle", progress: { value: null, label: "" } }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle", progress: { value: null, label: "" }, results: [], error: null, message: null });
  }, []);

  return { ...state, run, cancel, reset };
}

export type Processor = ReturnType<typeof useProcessor>;

export function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
}

/** Lets the browser paint between heavy synchronous steps. */
export function yieldToMain(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}
