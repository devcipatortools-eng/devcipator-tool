"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, X } from "lucide-react";
import { POPULAR_TOOLS, TOOLS, getTool, type ToolConfig } from "@/config/tools.config";
import { searchTools } from "@/lib/search";
import { ToolIcon } from "@/components/tool/ToolIcon";
import { cn } from "@/lib/cn";

const POPULAR = POPULAR_TOOLS.map(getTool).filter((t): t is ToolConfig => Boolean(t));

export function SearchDialog() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = query.trim() ? searchTools(query).slice(0, 8) : POPULAR;

  function open() {
    setQuery("");
    setActive(0);
    dialogRef.current?.showModal();
    inputRef.current?.focus();
  }

  function close() {
    dialogRef.current?.close();
  }

  function go(tool: ToolConfig) {
    close();
    router.push(`/tools/${tool.slug}`);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogRef.current?.open) close();
        else open();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 text-sm text-fg-muted hover:border-border-strong hover:text-fg cursor-pointer md:w-56"
        aria-label="Search tools"
      >
        <Search className="size-4" aria-hidden />
        <span className="hidden md:inline">Search {TOOLS.length} tools…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-surface-2 px-1.5 font-mono text-[10px] text-fg-subtle md:pointer-fine:inline">
          Ctrl K
        </kbd>
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto mt-[12vh] w-[min(640px,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-fg shadow-pop backdrop:bg-black/50"
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-5 text-fg-subtle" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Search tools — e.g. merge, mp3, background"
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-fg-subtle"
            aria-label="Search tools"
          />
          <button type="button" onClick={close} className="rounded-md p-1 text-fg-subtle hover:text-fg cursor-pointer" aria-label="Close search">
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          <p className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-fg-subtle">
            {query.trim() ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Popular tools"}
          </p>
          {results.length === 0 && <p className="px-2 py-6 text-center text-sm text-fg-muted">No tools match “{query}”.</p>}
          <ul>
            {results.map((tool, i) => (
              <li key={tool.slug}>
                <button
                  type="button"
                  onClick={() => go(tool)}
                  onMouseMove={() => setActive(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left cursor-pointer",
                    i === active && "bg-surface-2",
                  )}
                >
                  <ToolIcon tool={tool} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{tool.title}</span>
                    <span className="block truncate text-xs text-fg-muted">{tool.description}</span>
                  </span>
                  {i === active && <CornerDownLeft className="size-4 text-fg-subtle" aria-hidden />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}
