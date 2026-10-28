"use client";

import { useEffect, useRef, useState } from "react";
import type SignaturePad from "signature_pad";
import { Eraser, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const PEN_COLORS = ["#111827", "#1d4ed8", "#b91c1c"];

/** Returns a copy of the canvas cropped to its non-transparent pixels (plus padding). */
export function trimCanvas(source: HTMLCanvasElement, padding = 6): HTMLCanvasElement | null {
  const ctx = source.getContext("2d")!;
  const { width, height } = source;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);
  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext("2d")!.drawImage(source, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

/** signature_pad wrapper. Emits a trimmed transparent canvas after every stroke. */
export function SignatureCanvas({ onChange }: { onChange: (canvas: HTMLCanvasElement | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const onChangeRef = useRef(onChange);
  const [color, setColor] = useState(PEN_COLORS[0]);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let pad: SignaturePad | null = null;
    let disposed = false;

    const emit = () => {
      const p = padRef.current;
      if (!p) return;
      setEmpty(p.isEmpty());
      onChangeRef.current(p.isEmpty() ? null : trimCanvas(canvas));
    };

    // Match the backing store to the CSS size × devicePixelRatio for crisp strokes.
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const data = padRef.current?.toData();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")!.scale(ratio, ratio);
      if (padRef.current) {
        padRef.current.clear();
        if (data) padRef.current.fromData(data);
      }
    };

    import("signature_pad").then(({ default: SignaturePadCtor }) => {
      if (disposed) return;
      resize();
      pad = new SignaturePadCtor(canvas, { penColor: PEN_COLORS[0], minWidth: 0.8, maxWidth: 2.6 });
      pad.addEventListener("endStroke", emit);
      padRef.current = pad;
    });

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      disposed = true;
      observer.disconnect();
      pad?.off();
      padRef.current = null;
    };
  }, []);

  function pickColor(c: string) {
    setColor(c);
    const pad = padRef.current;
    if (!pad) return;
    pad.penColor = c;
    // Recolour existing strokes too.
    pad.fromData(pad.toData().map((g) => ({ ...g, penColor: c })));
    onChangeRef.current(pad.isEmpty() ? null : trimCanvas(canvasRef.current!));
  }

  function undo() {
    const pad = padRef.current;
    if (!pad) return;
    const data = pad.toData();
    data.pop();
    pad.fromData(data);
    setEmpty(pad.isEmpty());
    onChangeRef.current(pad.isEmpty() ? null : trimCanvas(canvasRef.current!));
  }

  function clear() {
    padRef.current?.clear();
    setEmpty(true);
    onChangeRef.current(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative rounded-xl border border-border-strong bg-white">
        <canvas ref={canvasRef} className="block h-40 w-full touch-none rounded-xl" aria-label="Signature drawing area" />
        <div className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-dashed border-neutral-300" />
        {empty && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-neutral-400">Sign here</p>}
      </div>
      <div className="flex items-center justify-between">
        {/* The swatch stays small; the button around it is the touch target. */}
        <div className="flex gap-1.5 pointer-coarse:gap-0" role="radiogroup" aria-label="Pen colour">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={`Pen colour ${c}`}
              onClick={() => pickColor(c)}
              className="flex size-6 items-center justify-center rounded-full cursor-pointer pointer-coarse:size-11"
            >
              <span
                className={cn("size-6 rounded-full ring-offset-2 ring-offset-surface", color === c && "ring-2 ring-primary")}
                style={{ background: c }}
              />
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" icon={<Undo2 className="size-4" />} onClick={undo} disabled={empty}>
            Undo
          </Button>
          <Button size="sm" variant="ghost" icon={<Eraser className="size-4" />} onClick={clear} disabled={empty}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
