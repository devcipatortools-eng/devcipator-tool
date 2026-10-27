import { cn } from "@/lib/cn";

/**
 * Placeholder shown while a tool's code loads. `minHeight` reserves the tool's real height
 * (for tools that render a full workspace up front) so the content below does not jump.
 */
export function ToolSkeleton({ minHeight }: { minHeight?: string }) {
  return (
    <div
      className={cn(
        "flex justify-center rounded-3xl border-2 border-dashed border-border bg-surface text-sm text-fg-subtle",
        minHeight ? cn("items-start pt-28", minHeight) : "min-h-72 items-center",
      )}
    >
      Loading tool…
    </div>
  );
}
