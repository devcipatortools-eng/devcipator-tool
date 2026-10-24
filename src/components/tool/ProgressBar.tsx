import type { Progress } from "@/hooks/useProcessor";

export function ProgressBar({ progress }: { progress: Progress }) {
  const pct = progress.value == null ? null : Math.round(Math.min(1, Math.max(0, progress.value)) * 100);
  return (
    <div className="flex flex-col gap-1.5" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-fg-muted">{progress.label || "Working…"}</span>
        {pct != null && <span className="font-mono tabular-nums text-fg">{pct}%</span>}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct ?? undefined}
      >
        {pct != null ? (
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        ) : (
          // Indeterminate: static striped bar (the product ships without animation).
          <div className="h-full w-full bg-[repeating-linear-gradient(-45deg,var(--primary)_0_8px,var(--primary-soft)_8px_16px)]" />
        )}
      </div>
    </div>
  );
}
