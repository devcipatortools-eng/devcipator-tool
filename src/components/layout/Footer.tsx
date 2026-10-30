import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { CATEGORIES, SITE, toolsInCategory } from "@/config/tools.config";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-surface sm:mt-24">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-1 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="col-span-2 mb-4 flex flex-col gap-4 sm:col-span-1 sm:mb-0">
          <Logo />
          <p className="max-w-xs text-sm text-fg-muted">{SITE.description}</p>
          <p className="inline-flex items-center gap-2 text-sm text-fg-muted">
            <ShieldCheck className="size-4 text-success" aria-hidden />
            Private by design — processed on your device.
          </p>
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <h2 className={cn("text-xs font-semibold uppercase tracking-wider sm:mb-3", CATEGORY_STYLE[cat.id].text)}>
              <Link href={`/category/${cat.id}`} className="inline-block py-3.5 sm:py-0 pointer-coarse:sm:py-2">{cat.title}</Link>
            </h2>
            {/* The full tool list is too long for phones; they get the category links only. */}
            <ul className="hidden flex-col gap-1.5 pointer-coarse:gap-0 sm:flex">
              {toolsInCategory(cat.id).map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/tools/${tool.slug}`} className="inline-block text-sm text-fg-muted hover:text-fg pointer-coarse:py-2.5">
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
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p>© {SITE.name}. All processing happens locally in your browser.</p>
            <p>
              Powered by <span className="font-medium text-fg-muted">Devcipator</span>
            </p>
          </div>
          <nav className="flex gap-5" aria-label="Legal">
            <Link href="/privacy" className="hover:text-fg max-sm:py-3 pointer-coarse:py-3">Privacy</Link>
            <Link href="/terms" className="hover:text-fg max-sm:py-3 pointer-coarse:py-3">Terms</Link>
            <Link href="/#all-tools" className="hover:text-fg max-sm:py-3 pointer-coarse:py-3">All tools</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
