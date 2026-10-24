"use client";

import { useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

/** Draggable split view comparing two images of the same size. */
export function BeforeAfter({ before, after, beforeLabel = "Original", afterLabel = "Result" }: { before: string; after: string | null; beforeLabel?: string; afterLabel?: string }) {
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);

  function update(clientX: number) {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  }

  return (
    <div
      ref={box}
      className="bg-checker relative select-none overflow-hidden rounded-xl border border-border touch-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) update(e.clientX);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after ?? before} alt={afterLabel} className="block max-h-[560px] w-full object-contain" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt={beforeLabel} className="block max-h-[560px] w-full object-contain" draggable={false} />
      </div>
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -ml-px w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.25)]" />
        <div className="absolute top-1/2 -ml-4 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-800 shadow-pop">
          <MoveHorizontal className="size-4" />
        </div>
      </div>
      <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">{beforeLabel}</span>
      <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">{afterLabel}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        className="sr-only"
        aria-label="Comparison position"
      />
    </div>
  );
}
