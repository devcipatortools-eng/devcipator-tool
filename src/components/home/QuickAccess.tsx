"use client";

import Link from "next/link";
import { Clock, Flame, X } from "lucide-react";
import { POPULAR_TOOLS, getTool, type ToolConfig } from "@/config/tools.config";
import { useRecentTools } from "@/hooks/useRecentTools";
import { ToolIcon } from "@/components/tool/ToolIcon";

function Chip({ tool }: { tool: ToolConfig }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3.5 text-sm font-medium text-fg hover:border-border-strong hover:bg-surface-2"
    >
      <ToolIcon tool={tool} size="sm" className="size-7 rounded-full [&>svg]:size-3.5" />
      {tool.title}
    </Link>
  );
}

/** “Recently used” when the visitor has history, otherwise “Popular tools”. */
export function QuickAccess() {
  const [recent, clear] = useRecentTools();
  const recentTools = recent.map(getTool).filter((t): t is ToolConfig => Boolean(t));
  const showRecent = recentTools.length > 0;
  const tools = showRecent ? recentTools : POPULAR_TOOLS.map(getTool).filter((t): t is ToolConfig => Boolean(t));

  return (
    <section aria-label={showRecent ? "Recently used tools" : "Popular tools"} className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-fg-muted">
        {showRecent ? <Clock className="size-4" aria-hidden /> : <Flame className="size-4 text-doc" aria-hidden />}
        {showRecent ? "Recently used" : "Popular tools"}
        {showRecent && (
          <button type="button" onClick={clear} className="ml-1 inline-flex items-center gap-1 text-xs text-fg-subtle hover:text-fg cursor-pointer">
            <X className="size-3" aria-hidden /> Clear
          </button>
        )}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {tools.map((t) => (
          <Chip key={t.slug} tool={t} />
        ))}
      </div>
    </section>
  );
}
