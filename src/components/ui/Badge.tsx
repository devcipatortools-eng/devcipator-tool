import type { ToolBadge } from "@/config/tools.config";
import { cn } from "@/lib/cn";

const BADGE_STYLE: Record<ToolBadge, string> = {
  Popular: "bg-primary-soft text-primary-strong",
  New: "bg-success-soft text-success-strong",
  Batch: "bg-surface-3 text-fg-muted",
  Live: "bg-utl-soft text-utl-strong",
};

export function Badge({ badge, className }: { badge: ToolBadge; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-1 text-[11px] font-semibold uppercase tracking-wider leading-none",
        BADGE_STYLE[badge],
        className,
      )}
    >
      {badge}
    </span>
  );
}
