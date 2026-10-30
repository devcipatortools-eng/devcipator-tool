import { SITE, TOOLS, getCategory, getTool } from "@/config/tools.config";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

// Used instead of a static `alt` export so the alt text can name the tool.
export function generateImageMetadata({ params }: { params: { slug: string } }) {
  const tool = getTool(params.slug);
  return [{ id: "card", alt: `${tool?.title ?? "Tool"} – ${SITE.name}`, size: OG_SIZE, contentType: OG_CONTENT_TYPE }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return new Response(null, { status: 404 });
  return ogImage({ eyebrow: getCategory(tool.category)!.title, title: tool.title, description: tool.description });
}
