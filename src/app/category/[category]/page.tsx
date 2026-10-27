import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CATEGORIES, getCategory, toolsInCategory } from "@/config/tools.config";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { cn } from "@/lib/cn";
import { ToolCard } from "@/components/home/ToolCard";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/category/[category]">): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return { title: "Category not found" };
  return {
    title: `${cat.title} — Free & Private`,
    description: `${cat.tagline} ${toolsInCategory(cat.id).length} free tools that run entirely in your browser.`,
    alternates: { canonical: `/category/${cat.id}` },
  };
}

export default async function CategoryPage({ params }: PageProps<"/category/[category]">) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();
  const tools = toolsInCategory(cat.id);
  const style = CATEGORY_STYLE[cat.id];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
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
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
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
