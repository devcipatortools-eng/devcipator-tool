import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CATEGORIES, getCategory, toolsInCategory } from "@/config/tools.config";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { cn } from "@/lib/cn";
import { ToolCard } from "@/components/home/ToolCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { WEBSITE_ID, absoluteUrl, breadcrumbList, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/category/[category]">): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return { title: "Category not found" };
  return pageMetadata({ title: cat.seoTitle, description: cat.metaDescription, path: `/category/${cat.id}` });
}

export default async function CategoryPage({ params }: PageProps<"/category/[category]">) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();
  const tools = toolsInCategory(cat.id);
  const style = CATEGORY_STYLE[cat.id];
  const url = absoluteUrl(`/category/${cat.id}`);

  const graph = [
    {
      "@type": "CollectionPage",
      "@id": url,
      url,
      name: cat.seoTitle,
      description: cat.metaDescription,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: {
        "@type": "ItemList",
        name: cat.title,
        numberOfItems: tools.length,
        itemListElement: tools.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.title, url: absoluteUrl(`/tools/${t.slug}`) })),
      },
    },
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: cat.label, path: `/category/${cat.id}` },
    ]),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <JsonLd graph={graph} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-fg-subtle">
        <Link href="/" className="-my-3 py-3 hover:text-fg">Home</Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="text-fg-muted" aria-current="page">{cat.label}</span>
      </nav>
      <header className="mt-6 flex flex-col gap-3">
        <span className={cn("h-1.5 w-12 rounded-full", style.solid)} aria-hidden />
        <h1 className="text-4xl font-semibold tracking-tight text-fg">{cat.title}</h1>
        <p className="max-w-2xl text-lg text-fg-muted">{cat.tagline} All {tools.length} tools run locally in your browser.</p>
      </header>
      <h2 className="sr-only">All {cat.title}</h2>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
      <section aria-labelledby="about" className="mt-14 max-w-3xl">
        <h2 id="about" className="text-2xl font-semibold tracking-tight text-fg">{cat.aboutTitle}</h2>
        <div className="mt-4 flex flex-col gap-4 text-base leading-relaxed text-fg-muted">
          {cat.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>
      <nav aria-label="Other categories" className="mt-14 flex flex-wrap gap-2">
        {CATEGORIES.filter((c) => c.id !== cat.id).map((c) => (
          <Link key={c.id} href={`/category/${c.id}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-fg-muted hover:text-fg pointer-coarse:min-h-11">
            <span className={cn("size-2 rounded-full", CATEGORY_STYLE[c.id].solid)} aria-hidden />
            {c.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}
