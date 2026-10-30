import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, CircleCheck, ShieldCheck } from "lucide-react";
import { TOOLS, getCategory, getTool, relatedTools, toolFaqs } from "@/config/tools.config";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { ToolIcon } from "@/components/tool/ToolIcon";
import { ToolLoader } from "@/components/tool/ToolLoader";
import { ToolCard } from "@/components/home/ToolCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { ORGANIZATION_ID, WEBSITE_ID, absoluteUrl, breadcrumbList, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/tools/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: "Tool not found" };
  return {
    ...pageMetadata({ title: tool.seoTitle, description: tool.metaDescription, path: `/tools/${tool.slug}` }),
    keywords: tool.keywords,
  };
}

export default async function ToolPage({ params }: PageProps<"/tools/[slug]">) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const category = getCategory(tool.category)!;
  const style = CATEGORY_STYLE[tool.category];
  const related = relatedTools(tool, 6);

  const faqs = toolFaqs(tool);
  const url = absoluteUrl(`/tools/${tool.slug}`);

  const graph = [
    {
      "@type": "WebApplication",
      "@id": `${url}#app`,
      name: tool.title,
      description: tool.metaDescription,
      url,
      applicationCategory: category.applicationCategory,
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript and a modern web browser",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: tool.features,
      inLanguage: "en",
      isPartOf: { "@id": WEBSITE_ID },
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@type": "HowTo",
      "@id": `${url}#how-to`,
      name: `How to use ${tool.title}`,
      step: tool.steps.map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: category.label, path: `/category/${category.id}` },
      { name: tool.title, path: `/tools/${tool.slug}` },
    ]),
  ];

  return (
    <>
      <JsonLd graph={graph} />

      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-fg-subtle">
            <Link href="/" className="-my-3 py-3 hover:text-fg">Home</Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href={`/category/${category.id}`} className="-mx-2 -my-3 px-2 py-3 hover:text-fg">{category.label}</Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-fg-muted" aria-current="page">{tool.title}</span>
          </nav>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <ToolIcon tool={tool} size="lg" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{tool.title}</h1>
                {tool.badges.map((b) => (
                  <Badge key={b} badge={b} />
                ))}
              </div>
              <p className="max-w-3xl text-base text-fg-muted">{tool.intro}</p>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-success" aria-hidden /> Processed on your device
                </span>
                <span className={cn("inline-flex items-center gap-1.5", style.text)}>
                  <span className={cn("size-2 rounded-full", style.solid)} aria-hidden /> {category.title}
                </span>
                {tool.acceptLabel && <span>Accepts {tool.acceptLabel}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <ToolLoader slug={tool.slug} />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-12">
          <section aria-labelledby="how-to">
            <h2 id="how-to" className="text-2xl font-semibold tracking-tight text-fg">How to use {tool.title}</h2>
            <ol className="mt-5 grid gap-4 md:grid-cols-3">
              {tool.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 md:flex-col md:p-5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-sm font-semibold text-primary-strong">{i + 1}</span>
                  <p className="text-sm text-fg max-md:pt-1.5">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="features">
            <h2 id="features" className="text-2xl font-semibold tracking-tight text-fg">Features</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {tool.features.map((f) => (
                <li key={f} className="flex items-start gap-3 rounded-xl bg-surface-2 px-4 py-3 text-sm text-fg">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="faq">
            <h2 id="faq" className="text-2xl font-semibold tracking-tight text-fg">Frequently asked questions</h2>
            <div className="mt-5 flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
              {faqs.map((f) => (
                <div key={f.q} className="p-4 md:p-5">
                  <h3 className="font-medium text-fg">{f.q}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside aria-labelledby="related" className="lg:sticky lg:top-20 lg:self-start">
          <h2 id="related" className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-subtle">Related tools</h2>
          <ul className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-2">
            {related.map((t) => (
              <li key={t.slug}>
                <Link href={`/tools/${t.slug}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-2">
                  <ToolIcon tool={t} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">{t.title}</span>
                    <span className="block truncate text-xs text-fg-muted">{t.description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Below lg the related-tools list already sits right above, so this would repeat it. */}
      <section aria-labelledby="more" className="mx-auto mt-16 hidden max-w-7xl px-4 sm:px-6 lg:block">
        <div className="flex items-end justify-between gap-4">
          <h2 id="more" className="text-xl font-semibold tracking-tight text-fg">More {category.title}</h2>
          <Link href={`/category/${category.id}`} className={cn("text-sm font-medium pointer-coarse:-my-3 pointer-coarse:py-3", style.text)}>
            View all<span className="sr-only"> {category.title}</span> →
          </Link>
        </div>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.filter((t) => t.category === tool.category && t.slug !== tool.slug)
            .slice(0, 4)
            .map((t) => (
              <li key={t.slug}>
                <ToolCard tool={t} />
              </li>
            ))}
        </ul>
      </section>
    </>
  );
}
