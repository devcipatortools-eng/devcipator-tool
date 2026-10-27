import type { ToolConfig } from "@/config/tools.config";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { cn } from "@/lib/cn";

const SIZES = {
  xs: { box: "size-6 rounded-md", icon: "size-3.5" },
  chip: { box: "size-7 rounded-full", icon: "size-3.5" },
  sm: { box: "size-8 rounded-lg", icon: "size-4" },
  md: { box: "size-10 rounded-xl", icon: "size-5" },
  lg: { box: "size-14 rounded-2xl", icon: "size-7" },
};

export function ToolIcon({ tool, size = "md", className }: { tool: ToolConfig; size?: keyof typeof SIZES; className?: string }) {
  const Icon = tool.icon;
  const style = CATEGORY_STYLE[tool.category];
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", SIZES[size].box, style.soft, style.text, className)}>
      <Icon className={SIZES[size].icon} aria-hidden strokeWidth={1.9} />
    </span>
  );
}
