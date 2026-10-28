"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { CATEGORIES, TOOLS, type ToolCategory } from "@/config/tools.config";
import { searchTools } from "@/lib/search";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { cn } from "@/lib/cn";
import { ToolCard } from "./ToolCard";
import { QuickAccess } from "./QuickAccess";

type Filter = "all" | ToolCategory;

export function ToolExplorer() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const pool = filter === "all" ? TOOLS : TOOLS.filter((t) => t.category === filter);
  const results = searchTools(query, pool);
  const counts = Object.fromEntries([
    ["all", TOOLS.length],
    ...CATEGORIES.map((c) => [c.id, TOOLS.filter((t) => t.category === c.id).length]),
  ]) as Record<Filter, number>;
  const tabs: Array<{ id: Filter; label: string }> = [{ id: "all", label: "All" }, ...CATEGORIES.map((c) => ({ id: c.id, label: c.label }))];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" aria-hidden />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-fg-muted shadow-card">
            <span className="flex gap-1" aria-hidden>
              <span className="size-1.5 rounded-full bg-doc" />
              <span className="size-1.5 rounded-full bg-img" />
              <span className="size-1.5 rounded-full bg-aud" />
              <span className="size-1.5 rounded-full bg-utl" />
            </span>
            {TOOLS.length} tools · No uploads · No sign-up
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-fg sm:text-6xl">
            Every file tool you need,{" "}
            <span className="text-primary">running in your browser.</span>
          </h1>
          <p className="max-w-2xl text-balance text-lg text-fg-muted">
            Merge and sign PDFs, compress images, cut audio, make QR codes and more. Your files are processed on your device and never uploaded.
          </p>
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-fg-subtle" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools, e.g. “mp3”"
              aria-label="Search tools"
              className="h-14 w-full rounded-2xl border border-border-strong bg-surface pl-12 pr-12 text-base text-fg shadow-pop placeholder:text-fg-subtle focus:border-primary focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-fg-subtle hover:text-fg cursor-pointer pointer-coarse:right-1 pointer-coarse:p-3.5"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pt-10 sm:px-6">
        <QuickAccess />

        <section id="all-tools" aria-label="All tools" className="flex scroll-mt-24 flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div role="tablist" aria-label="Filter by category" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0 max-sm:[mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-24px),transparent)]">
              {tabs.map((tab) => {
                const active = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    type="button"
                    aria-selected={active}
                    onClick={(e) => {
                      setFilter(tab.id);
                      // On phones the row scrolls; keep the chosen chip and its neighbours in view.
                      e.currentTarget.scrollIntoView({ block: "nearest", inline: "center" });
                    }}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium cursor-pointer pointer-coarse:min-h-11",
                      active ? "border-fg bg-fg text-bg" : "border-border bg-surface text-fg-muted hover:text-fg hover:border-border-strong",
                    )}
                  >
                    {tab.id !== "all" && <span className={cn("size-2 rounded-full", CATEGORY_STYLE[tab.id].solid)} aria-hidden />}
                    {tab.label}
                    <span className={cn("text-xs tabular-nums", active ? "text-bg/70" : "text-fg-subtle")}>{counts[tab.id]}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-fg-subtle" aria-live="polite">
              {query ? `${results.length} of ${pool.length} tools match “${query}”` : `Showing ${pool.length} tools`}
            </p>
          </div>

          {results.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((tool) => (
                <li key={tool.slug}>
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
              <p className="font-medium text-fg">No tools found</p>
              <p className="mt-1 text-sm text-fg-muted">Try a different word, or clear the filters.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="mt-4 text-sm font-medium text-primary hover:underline cursor-pointer"
              >
                Reset search
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
