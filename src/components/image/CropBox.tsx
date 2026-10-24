"use client";

import { useRef } from "react";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Handle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLES: Array<{ h: Exclude<Handle, "move">; className: string; cursor: string }> = [
  { h: "nw", className: "-left-1.5 -top-1.5", cursor: "nwse-resize" },
  { h: "ne", className: "-right-1.5 -top-1.5", cursor: "nesw-resize" },
  { h: "sw", className: "-left-1.5 -bottom-1.5", cursor: "nesw-resize" },
  { h: "se", className: "-right-1.5 -bottom-1.5", cursor: "nwse-resize" },
  { h: "n", className: "left-1/2 -top-1.5 -ml-1.5", cursor: "ns-resize" },
  { h: "s", className: "left-1/2 -bottom-1.5 -ml-1.5", cursor: "ns-resize" },
  { h: "w", className: "top-1/2 -left-1.5 -mt-1.5", cursor: "ew-resize" },
  { h: "e", className: "top-1/2 -right-1.5 -mt-1.5", cursor: "ew-resize" },
];

const MIN = 8;

/** Applies a drag of (dx, dy) image pixels to the rect for the given handle. */
export function dragRect(start: Rect, handle: Handle, dx: number, dy: number, W: number, H: number, aspect: number | null): Rect {
  if (handle === "move") {
    return {
      ...start,
      x: Math.min(W - start.width, Math.max(0, start.x + dx)),
      y: Math.min(H - start.height, Math.max(0, start.y + dy)),
    };
  }
  let x1 = start.x;
  let y1 = start.y;
  let x2 = start.x + start.width;
  let y2 = start.y + start.height;
  if (handle.includes("w")) x1 = Math.min(x2 - MIN, Math.max(0, x1 + dx));
  if (handle.includes("e")) x2 = Math.max(x1 + MIN, Math.min(W, x2 + dx));
  if (handle.includes("n")) y1 = Math.min(y2 - MIN, Math.max(0, y1 + dy));
  if (handle.includes("s")) y2 = Math.max(y1 + MIN, Math.min(H, y2 + dy));

  if (aspect) {
    let w = x2 - x1;
    let h = y2 - y1;
    const horizontal = handle.includes("e") || handle.includes("w");
    if (horizontal) h = w / aspect;
    else w = h * aspect;
    // Anchor the edge opposite to the handle; centre for edge handles.
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const maxW = handle.includes("w") ? x2 : handle.includes("e") ? W - x1 : 2 * Math.min(cx, W - cx);
    const maxH = handle.includes("n") ? y2 : handle.includes("s") ? H - y1 : 2 * Math.min(cy, H - cy);
    const scale = Math.min(1, maxW / w, maxH / h);
    w *= scale;
    h *= scale;
    x1 = handle.includes("w") ? x2 - w : handle.includes("e") ? x1 : cx - w / 2;
    y1 = handle.includes("n") ? y2 - h : handle.includes("s") ? y1 : cy - h / 2;
    x2 = x1 + w;
    y2 = y1 + h;
  }
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

export function CropBox({
  src,
  naturalWidth,
  naturalHeight,
  rect,
  onChange,
  aspect,
}: {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  rect: Rect;
  onChange: (r: Rect) => void;
  aspect: number | null;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ handle: Handle; startX: number; startY: number; start: Rect; scale: number } | null>(null);

  function begin(handle: Handle, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const shown = imgRef.current?.getBoundingClientRect();
    if (!shown) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { handle, startX: e.clientX, startY: e.clientY, start: rect, scale: naturalWidth / shown.width };
  }
  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) * d.scale;
    const dy = (e.clientY - d.startY) * d.scale;
    const r = dragRect(d.start, d.handle, dx, dy, naturalWidth, naturalHeight, aspect);
    onChange({ x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) });
  }
  function end() {
    drag.current = null;
  }

  const pct = (v: number, total: number) => `${(v / total) * 100}%`;

  return (
    <div className="bg-checker relative inline-block max-w-full select-none overflow-hidden rounded-lg touch-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} src={src} alt="Image to crop" className="block max-h-[560px] max-w-full" draggable={false} />
      <div
        className="absolute cursor-move outline outline-2 outline-white shadow-[0_0_0_9999px_rgba(8,10,20,0.6)]"
        style={{
          left: pct(rect.x, naturalWidth),
          top: pct(rect.y, naturalHeight),
          width: pct(rect.width, naturalWidth),
          height: pct(rect.height, naturalHeight),
        }}
        onPointerDown={(e) => begin("move", e)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      >
        {/* Rule-of-thirds guides */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 left-1/3 w-px bg-white/50" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white/50" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/50" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white/50" />
        </div>
        {HANDLES.map(({ h, className, cursor }) => (
          <span
            key={h}
            className={`absolute size-3 rounded-sm border border-neutral-700 bg-white ${className}`}
            style={{ cursor }}
            onPointerDown={(e) => begin(h, e)}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
        ))}
      </div>
    </div>
  );
}
