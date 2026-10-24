import type { ToolCategory } from "@/config/tools.config";

/** Static class strings per category so Tailwind can see them at build time. */
export const CATEGORY_STYLE: Record<
  ToolCategory,
  { text: string; soft: string; solid: string; border: string }
> = {
  document: { text: "text-doc-strong", soft: "bg-doc-soft", solid: "bg-doc", border: "border-doc" },
  image: { text: "text-img-strong", soft: "bg-img-soft", solid: "bg-img", border: "border-img" },
  audio: { text: "text-aud-strong", soft: "bg-aud-soft", solid: "bg-aud", border: "border-aud" },
  utility: { text: "text-utl-strong", soft: "bg-utl-soft", solid: "bg-utl", border: "border-utl" },
};
