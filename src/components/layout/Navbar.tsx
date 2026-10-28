"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { CATEGORIES, toolsInCategory } from "@/config/tools.config";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { SearchDialog } from "./SearchDialog";
import { ThemeToggle } from "./ThemeToggle";
import { ToolIcon } from "@/components/tool/ToolIcon";

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus whenever the route changes (state survives navigation under Activity).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur supports-[backdrop-filter]:bg-bg/75">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6" aria-label="Main">
        <Logo />

        <div className="relative ml-4 hidden lg:block" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            className={cn(
              "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium cursor-pointer",
              menuOpen ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg hover:bg-surface-2",
            )}
          >
            All tools <ChevronDown className="size-4" aria-hidden />
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-11 grid w-[min(1040px,calc(100vw-3rem))] grid-cols-4 gap-6 rounded-2xl border border-border bg-surface p-5 shadow-pop">
              {CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <Link
                    href={`/category/${cat.id}`}
                    className={cn("mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider", CATEGORY_STYLE[cat.id].text)}
                  >
                    <span className={cn("size-2 rounded-full", CATEGORY_STYLE[cat.id].solid)} />
                    {cat.label}
                  </Link>
                  <ul className="flex flex-col">
                    {toolsInCategory(cat.id).map((tool) => (
                      <li key={tool.slug}>
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
                        >
                          <ToolIcon tool={tool} size="xs" />
                          {tool.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden items-center gap-1 lg:flex">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium",
                pathname === `/category/${cat.id}` ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg hover:bg-surface-2",
              )}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <SearchDialog />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Open menu"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted lg:hidden cursor-pointer pointer-coarse:size-11"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-surface px-4 py-4 lg:hidden">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="mb-4">
              <Link
                href={`/category/${cat.id}`}
                className={cn("mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider pointer-coarse:mb-0 pointer-coarse:py-3.5", CATEGORY_STYLE[cat.id].text)}
              >
                <span className={cn("size-2 rounded-full", CATEGORY_STYLE[cat.id].solid)} />
                {cat.label}
              </Link>
              <ul className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
                {toolsInCategory(cat.id).map((tool) => (
                  <li key={tool.slug}>
                    <Link href={`/tools/${tool.slug}`} className="block rounded-lg px-2 py-1.5 text-sm text-fg-muted hover:bg-surface-2 hover:text-fg pointer-coarse:py-3">
                      {tool.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
