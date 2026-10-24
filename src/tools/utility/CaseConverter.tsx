"use client";

import { useState } from "react";
import { Copy, Eraser, Undo2 } from "lucide-react";
import { useCopy } from "@/hooks/useCopy";
import { convertCase, type CaseStyle } from "@/lib/text";
import { Panel } from "@/components/tool/ToolLayout";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const STYLES: Array<{ id: CaseStyle; label: string; example: string }> = [
  { id: "upper", label: "UPPERCASE", example: "HELLO WORLD" },
  { id: "lower", label: "lowercase", example: "hello world" },
  { id: "title", label: "Title Case", example: "Hello World" },
  { id: "sentence", label: "Sentence case", example: "Hello world" },
  { id: "camel", label: "camelCase", example: "helloWorld" },
  { id: "pascal", label: "PascalCase", example: "HelloWorld" },
  { id: "snake", label: "snake_case", example: "hello_world" },
  { id: "kebab", label: "kebab-case", example: "hello-world" },
  { id: "constant", label: "CONSTANT_CASE", example: "HELLO_WORLD" },
];

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [original, setOriginal] = useState<string | null>(null);
  const [active, setActive] = useState<CaseStyle | null>(null);
  const { copied, copy } = useCopy();

  function apply(style: CaseStyle) {
    if (!text) return;
    if (original === null) setOriginal(text);
    setText(convertCase(original ?? text, style));
    setActive(style);
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Convert to">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => apply(s.id)}
              disabled={!text}
              className={cn(
                "flex flex-col items-start rounded-xl border px-3 py-2.5 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                active === s.id ? "border-primary bg-primary-soft" : "border-border hover:border-border-strong hover:bg-surface-2",
              )}
            >
              <span className="text-sm font-semibold text-fg">{s.label}</span>
              <span className="font-mono text-xs text-fg-subtle">{s.example}</span>
            </button>
          ))}
        </div>
      </Panel>
      <Panel
        title="Text"
        actions={
          <>
            <Button
              size="sm"
              variant="ghost"
              icon={<Undo2 className="size-4" />}
              disabled={original === null}
              onClick={() => {
                if (original !== null) setText(original);
                setOriginal(null);
                setActive(null);
              }}
            >
              Original
            </Button>
            <Button size="sm" variant="ghost" icon={<Copy className="size-4" />} onClick={() => copy(text, "text")} disabled={!text}>
              {copied === "text" ? "Copied" : "Copy"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<Eraser className="size-4" />}
              disabled={!text}
              onClick={() => {
                setText("");
                setOriginal(null);
                setActive(null);
              }}
            >
              Clear
            </Button>
          </>
        }
      >
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            // Editing makes the current text the new original.
            setOriginal(null);
            setActive(null);
          }}
          placeholder="Paste or type text, then pick a case above…"
          className="min-h-[320px] w-full resize-y rounded-lg border border-border bg-surface-2 p-4 font-mono text-sm leading-relaxed text-fg placeholder:text-fg-subtle focus:border-primary focus:outline-none"
          aria-label="Text to convert"
          autoFocus
        />
      </Panel>
    </div>
  );
}
