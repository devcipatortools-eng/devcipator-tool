"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/** Displays an existing canvas element responsively (no copy). */
export function CanvasView({
  canvas,
  className,
  onPoint,
}: {
  canvas: HTMLCanvasElement | null;
  className?: string;
  /** Called with normalised (0..1) coordinates when the canvas is clicked or dragged. */
  onPoint?: (x: number, y: number) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!holder.current) return;
    if (canvas) holder.current.replaceChildren(canvas);
    else holder.current.replaceChildren();
  }, [canvas]);

  function point(e: React.PointerEvent<HTMLDivElement>) {
    const el = e.currentTarget.firstElementChild;
    if (!onPoint || !el) return;
    const r = el.getBoundingClientRect();
    onPoint(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  }

  return (
    <div
      ref={holder}
      className={cn(
        "bg-checker flex items-center justify-center overflow-hidden rounded-lg touch-none",
        "[&>canvas]:block [&>canvas]:h-auto [&>canvas]:max-h-[560px] [&>canvas]:max-w-full",
        onPoint && "cursor-crosshair",
        className,
      )}
      onPointerDown={(e) => {
        if (!onPoint) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        point(e);
      }}
      onPointerMove={(e) => {
        if (onPoint && e.currentTarget.hasPointerCapture(e.pointerId)) point(e);
      }}
    />
  );
}
