import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ToolConfig } from "@/config/tools.config";
import { Badge } from "@/components/ui/Badge";
import { ToolIcon } from "@/components/tool/ToolIcon";

/** Compact icon-left row on phones, stacked card from `sm` up. */
export function ToolCard({ tool }: { tool: ToolConfig }) {
  const badges = tool.badges.slice(0, 2).map((b) => <Badge key={b} badge={b} />);
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex h-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-card hover:border-border-strong hover:bg-surface-2 sm:flex-col sm:items-stretch sm:p-5"
    >
      <div className="flex shrink-0 items-start justify-between gap-2">
        <ToolIcon tool={tool} />
        <div className="hidden flex-wrap justify-end gap-1 sm:flex">{badges}</div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-semibold text-fg">
          {tool.title}
          <ArrowUpRight className="hidden size-4 text-fg-subtle opacity-0 group-hover:opacity-100 sm:block" aria-hidden />
          {badges.length > 0 && <span className="flex gap-1 sm:hidden">{badges}</span>}
        </h3>
        <p className="text-sm leading-relaxed text-fg-muted">{tool.description}</p>
      </div>
    </Link>
  );
}
