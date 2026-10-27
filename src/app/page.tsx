import Link from "next/link";
import { Cpu, ShieldCheck, Zap } from "lucide-react";
import { CATEGORIES, toolsInCategory } from "@/config/tools.config";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { cn } from "@/lib/cn";
import { ToolExplorer } from "@/components/home/ToolExplorer";

const PILLARS = [
  { icon: ShieldCheck, title: "Private by default", text: "Files are processed locally with Web APIs and WebAssembly. Nothing is uploaded." },
  { icon: Zap, title: "Fast, no queues", text: "No server round-trips. Heavy work runs in background threads so the page stays responsive." },
  { icon: Cpu, title: "Pro-grade engines", text: "pdf-lib, PDF.js, the Canvas API and the Web Audio API — the same engines used by desktop apps." },
];

export default function Home() {
  return (
    <>
      <ToolExplorer />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section aria-label="Categories" className="mt-20 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6 hover:border-border-strong"
            >
              <span className={cn("h-1 w-10 rounded-full", CATEGORY_STYLE[cat.id].solid)} aria-hidden />
              <h2 className="text-lg font-semibold text-fg">{cat.title}</h2>
              <p className="text-sm text-fg-muted">{cat.tagline}</p>
              <p className={cn("mt-auto text-sm font-medium", CATEGORY_STYLE[cat.id].text)}>
                {toolsInCategory(cat.id).length} tools →
              </p>
            </Link>
          ))}
        </section>

        <section aria-label="Why Devcipator" className="mt-12 sm:mt-6 grid gap-4 rounded-2xl border border-border bg-surface-2 p-6 md:grid-cols-3 md:p-8">
          {PILLARS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary ring-1 ring-border">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-fg">{title}</h3>
                <p className="mt-1 text-sm text-fg-muted">{text}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
