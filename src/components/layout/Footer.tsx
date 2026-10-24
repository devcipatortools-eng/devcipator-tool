import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { CATEGORIES, SITE, toolsInCategory } from "@/config/tools.config";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-sm text-fg-muted">{SITE.description}</p>
          <p className="inline-flex items-center gap-2 text-sm text-fg-muted">
            <ShieldCheck className="size-4 text-success" aria-hidden />
            Private by design — processed on your device.
          </p>
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <h2 className={cn("mb-3 text-xs font-semibold uppercase tracking-wider", CATEGORY_STYLE[cat.id].text)}>
              <Link href={`/category/${cat.id}`}>{cat.label} tools</Link>
            </h2>
            <ul className="flex flex-col gap-1.5">
              {toolsInCategory(cat.id).map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/tools/${tool.slug}`} className="text-sm text-fg-muted hover:text-fg">
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-fg-subtle sm:flex-row sm:px-6">
          <p>© {SITE.name}. All processing happens locally in your browser.</p>
          <nav className="flex gap-5" aria-label="Legal">
            <Link href="/privacy" className="hover:text-fg">Privacy</Link>
            <Link href="/terms" className="hover:text-fg">Terms</Link>
            <Link href="/#all-tools" className="hover:text-fg">All tools</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
