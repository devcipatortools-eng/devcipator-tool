"use client";

import { useEffect } from "react";
import { recordToolUse } from "@/hooks/useRecentTools";
import { TOOL_COMPONENTS } from "@/tools/registry";

/** Client entry for a tool page: lazy-loads the tool's workspace and records it as recently used. */
export function ToolLoader({ slug }: { slug: string }) {
  useEffect(() => {
    recordToolUse(slug);
  }, [slug]);

  const Tool = TOOL_COMPONENTS[slug];
  if (!Tool) return null;
  return <Tool />;
}
