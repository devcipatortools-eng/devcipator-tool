import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ToolConfig } from "@/config/tools.config";
import { Badge } from "@/components/ui/Badge";
import { ToolIcon } from "@/components/tool/ToolIcon";

export function ToolCard({ tool }: { tool: ToolConfig }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-5 shadow-card hover:border-border-strong hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-2">
        <ToolIcon tool={tool} />
        <div className="flex flex-wrap justify-end gap-1">
          {tool.badges.slice(0, 2).map((b) => (
            <Badge key={b} badge={b} />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="flex items-center gap-1 font-semibold text-fg">
          {tool.title}
          <ArrowUpRight className="size-4 text-fg-subtle opacity-0 group-hover:opacity-100" aria-hidden />
        </h3>
        <p className="text-sm leading-relaxed text-fg-muted">{tool.description}</p>
      </div>
    </Link>
  );
}
