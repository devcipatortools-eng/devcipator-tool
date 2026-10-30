import { CATEGORIES, SITE, getCategory, toolsInCategory } from "@/config/tools.config";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.id }));
}

// Used instead of a static `alt` export so the alt text can name the category.
export function generateImageMetadata({ params }: { params: { category: string } }) {
  const cat = getCategory(params.category);
  return [{ id: "card", alt: `Free ${cat?.title ?? "tools"} – ${SITE.name}`, size: OG_SIZE, contentType: OG_CONTENT_TYPE }];
}

export default async function Image({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return new Response(null, { status: 404 });
  return ogImage({ eyebrow: `${toolsInCategory(cat.id).length} free tools`, title: `Free ${cat.title}`, description: cat.tagline });
}
