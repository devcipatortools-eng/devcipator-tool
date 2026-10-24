"use client";

import { useEffect, useRef } from "react";
import type { Peaks } from "@/hooks/useAudio";
import { formatDuration } from "@/lib/files";

export interface Selection {
  start: number;
  end: number;
}

interface WaveformProps {
  peaks: Peaks | null;
  duration: number;
  playhead?: number;
  selection?: Selection;
  onSelectionChange?: (s: Selection) => void;
  /** "keep" dims outside the selection; "remove" dims the selection itself. */
  selectionMode?: "keep" | "remove";
  onSeek?: (time: number) => void;
  height?: number;
}

const HANDLE_HIT = 10;

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Canvas waveform with an optional draggable selection (two handles) and a playhead. */
export function Waveform({ peaks, duration, playhead, selection, onSelectionChange, selectionMode = "keep", onSeek, height = 160 }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ kind: "start" | "end" | "new"; anchor: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const wave = cssVar("--aud");
      const dim = cssVar("--border-strong");
      const accent = cssVar("--primary");
      const mid = h / 2;
      const count = peaks.min.length;
      const sx = selection ? (selection.start / duration) * w : 0;
      const ex = selection ? (selection.end / duration) * w : w;

      if (selection) {
        ctx.fillStyle = selectionMode === "keep" ? cssVar("--aud-soft") : cssVar("--danger-soft");
        ctx.fillRect(sx, 0, ex - sx, h);
      }
      for (let x = 0; x < w; x++) {
        const b0 = Math.floor((x / w) * count);
        const b1 = Math.max(b0 + 1, Math.floor(((x + 1) / w) * count));
        let lo = 0;
        let hi = 0;
        for (let b = b0; b < b1 && b < count; b++) {
          if (peaks.min[b] < lo) lo = peaks.min[b];
          if (peaks.max[b] > hi) hi = peaks.max[b];
        }
        const inside = !selection || (x >= sx && x <= ex);
        const active = selectionMode === "keep" ? inside : !inside || !selection;
        ctx.fillStyle = active ? wave : dim;
        const top = mid - hi * (mid - 4);
        const bottom = mid - lo * (mid - 4);
        ctx.fillRect(x, top, 1, Math.max(1, bottom - top));
      }
      if (selection) {
        ctx.fillStyle = accent;
        ctx.fillRect(sx - 1, 0, 2, h);
        ctx.fillRect(ex - 1, 0, 2, h);
        ctx.fillRect(sx - 5, 0, 10, 14);
        ctx.fillRect(ex - 5, h - 14, 10, 14);
      }
      if (playhead !== undefined && playhead > 0) {
        ctx.fillStyle = cssVar("--fg");
        ctx.fillRect((playhead / duration) * w - 0.5, 0, 1.5, h);
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [peaks, duration, playhead, selection, selectionMode, height]);

  function timeAt(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return Math.min(duration, Math.max(0, ((e.clientX - r.left) / r.width) * duration));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!onSelectionChange || !selection) {
      onSeek?.(timeAt(e));
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - r.left;
    const sx = (selection.start / duration) * r.width;
    const ex = (selection.end / duration) * r.width;
    const t = timeAt(e);
    if (Math.abs(x - sx) <= HANDLE_HIT) drag.current = { kind: "start", anchor: selection.end };
    else if (Math.abs(x - ex) <= HANDLE_HIT) drag.current = { kind: "end", anchor: selection.start };
    else if (e.shiftKey || !onSeek) {
      drag.current = { kind: "new", anchor: t };
      onSelectionChange({ start: t, end: t });
    } else {
      // Plain click seeks; drag from here creates a new selection.
      drag.current = { kind: "new", anchor: t };
      onSeek(t);
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || !onSelectionChange || !selection) return;
    const t = timeAt(e);
    if (d.kind === "start") onSelectionChange({ start: Math.min(t, d.anchor - 0.01), end: d.anchor });
    else if (d.kind === "end") onSelectionChange({ start: d.anchor, end: Math.max(t, d.anchor + 0.01) });
    else if (Math.abs(t - d.anchor) > duration * 0.003) onSelectionChange({ start: Math.min(t, d.anchor), end: Math.max(t, d.anchor) });
  }

  return (
    <div className="flex flex-col gap-1">
      <canvas
        ref={canvasRef}
        style={{ height }}
        className="w-full cursor-crosshair touch-none rounded-lg bg-surface-2"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        role="img"
        aria-label="Audio waveform"
      />
      <div className="flex justify-between font-mono text-[11px] text-fg-subtle tabular-nums">
        <span>0:00</span>
        <span>{formatDuration(duration / 2)}</span>
        <span>{formatDuration(duration)}</span>
      </div>
    </div>
  );
}
