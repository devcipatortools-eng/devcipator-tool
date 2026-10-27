"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Copy, Eraser } from "lucide-react";
import { useCopy } from "@/hooks/useCopy";
import { formatSeconds, textStats, topKeywords } from "@/lib/text";
import { Panel } from "@/components/tool/ToolLayout";
import { Button } from "@/components/ui/Button";

export default function WordCounter() {
  const [text, setText] = useState("");
  // Deferred so typing stays instant even with very long texts.
  const deferred = useDeferredValue(text);
  const stats = useMemo(() => textStats(deferred), [deferred]);
  const keywords = useMemo(() => topKeywords(deferred), [deferred]);
  const { copied, copy } = useCopy();

  const cards = [
    { label: "Words", value: stats.words.toLocaleString() },
    { label: "Characters", value: stats.characters.toLocaleString() },
    { label: "Without spaces", value: stats.charactersNoSpaces.toLocaleString() },
    { label: "Sentences", value: stats.sentences.toLocaleString() },
    { label: "Paragraphs", value: stats.paragraphs.toLocaleString() },
    { label: "Reading time", value: formatSeconds(stats.readingSeconds) },
  ];

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_300px] lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel
        title="Your text"
        actions={
          <>
            <Button size="sm" variant="ghost" icon={<Copy className="size-4" />} onClick={() => copy(text, "text")} disabled={!text}>
              {copied === "text" ? "Copied" : "Copy"}
            </Button>
            <Button size="sm" variant="ghost" icon={<Eraser className="size-4" />} onClick={() => setText("")} disabled={!text}>
              Clear
            </Button>
          </>
        }
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your text here…"
          className="min-h-[420px] w-full resize-y rounded-lg border border-border bg-surface-2 p-4 text-base leading-relaxed text-fg placeholder:text-fg-subtle focus:border-primary focus:outline-none"
          aria-label="Text to count"
          autoFocus
        />
      </Panel>

      <aside className="flex flex-col gap-4 md:sticky md:top-20" aria-label="Statistics">
        <ul className="grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <li key={c.label} className="rounded-2xl border border-border bg-surface p-4 shadow-card">
              <p className="text-xs font-medium text-fg-subtle">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-fg tabular-nums">{c.value}</p>
            </li>
          ))}
        </ul>
        <Panel title="Details">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-fg-muted">Speaking time</dt>
            <dd className="text-right font-medium tabular-nums">{formatSeconds(stats.speakingSeconds)}</dd>
            <dt className="text-fg-muted">Lines</dt>
            <dd className="text-right font-medium tabular-nums">{stats.lines}</dd>
            <dt className="text-fg-muted">Avg. word length</dt>
            <dd className="text-right font-medium tabular-nums">{stats.avgWordLength.toFixed(1)} chars</dd>
          </dl>
        </Panel>
        <Panel title="Top keywords">
          {keywords.length === 0 ? (
            <p className="text-sm text-fg-subtle">Keywords appear as you type.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {keywords.map((k) => (
                <li key={k.word} className="flex items-center gap-3 text-sm">
                  <span className="w-24 truncate font-medium text-fg">{k.word}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <span className="block h-full rounded-full bg-utl" style={{ width: `${Math.max(4, k.share * 100)}%` }} />
                  </span>
                  <span className="w-14 text-right text-xs text-fg-muted tabular-nums">
                    {k.count} · {Math.round(k.share * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </aside>
    </div>
  );
}
