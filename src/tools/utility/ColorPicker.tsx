"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";
import { useCopy } from "@/hooks/useCopy";
import { useDecodedImage } from "@/hooks/useDecodedImage";
import { isLight, medianCut, toHex, toHslString, toRgbString, type Rgb } from "@/lib/color";
import { getTool } from "@/config/tools.config";
import { Panel } from "@/components/tool/ToolLayout";
import { FileDropzone } from "@/components/tool/FileDropzone";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const ZOOM_CELLS = 11; // pixels shown in the magnifier (odd, so there is a centre pixel)
const ZOOM_SIZE = 132;

function ColorValues({ rgb }: { rgb: Rgb }) {
  const { copied, copy } = useCopy();
  const rows = [
    { label: "HEX", value: toHex(rgb) },
    { label: "RGB", value: toRgbString(rgb) },
    { label: "HSL", value: toHslString(rgb) },
  ];
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.label}>
          <button
            type="button"
            onClick={() => copy(r.value)}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left hover:border-border-strong cursor-pointer"
            aria-label={`Copy ${r.label} ${r.value}`}
          >
            <span className="w-9 text-xs font-semibold text-fg-subtle">{r.label}</span>
            <span className="flex-1 font-mono text-sm text-fg">{r.value}</span>
            {copied === r.value ? <Check className="size-4 text-success" /> : <Copy className="size-4 text-fg-subtle" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function ColorPicker() {
  const [file, setFile] = useState<File | null>(null);
  const [picked, setPicked] = useState<Rgb | null>(null);
  const [hover, setHover] = useState<{ rgb: Rgb; x: number; y: number } | null>(null);
  const [history, setHistory] = useState<Rgb[]>([]);
  const { image, error } = useDecodedImage(file, 1100);
  const viewRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef<HTMLCanvasElement>(null);
  const tool = getTool("color-picker")!;
  const { copied, copy } = useCopy();

  // Full-resolution pixels (capped) for exact sampling.
  const pixels = useMemo(() => {
    if (!image) return null;
    const s = Math.min(1, 4096 / Math.max(image.width, image.height));
    const c = document.createElement("canvas");
    c.width = Math.round(image.width * s);
    c.height = Math.round(image.height * s);
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(image.source, 0, 0, c.width, c.height);
    return { data: ctx.getImageData(0, 0, c.width, c.height), width: c.width, height: c.height };
  }, [image]);

  const palette = useMemo(() => {
    if (!image) return [];
    const c = document.createElement("canvas");
    const s = Math.min(1, 160 / Math.max(image.preview.width, image.preview.height));
    c.width = Math.max(1, Math.round(image.preview.width * s));
    c.height = Math.max(1, Math.round(image.preview.height * s));
    const ctx = c.getContext("2d")!;
    ctx.drawImage(image.preview, 0, 0, c.width, c.height);
    return medianCut(ctx.getImageData(0, 0, c.width, c.height).data, 8);
  }, [image]);

  useEffect(() => {
    const canvas = viewRef.current;
    if (!canvas || !image) return;
    canvas.width = image.preview.width;
    canvas.height = image.preview.height;
    canvas.getContext("2d")!.drawImage(image.preview, 0, 0);
  }, [image]);

  function sampleAt(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!pixels) return null;
    const r = e.currentTarget.getBoundingClientRect();
    const px = Math.min(pixels.width - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * pixels.width)));
    const py = Math.min(pixels.height - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * pixels.height)));
    const i = (py * pixels.width + px) * 4;
    const d = pixels.data.data;
    return { rgb: [d[i], d[i + 1], d[i + 2]] as Rgb, px, py, x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const s = sampleAt(e);
    if (!s || !pixels) return;
    setHover({ rgb: s.rgb, x: e.currentTarget.offsetLeft + s.x, y: e.currentTarget.offsetTop + s.y });
    const zoom = zoomRef.current;
    if (!zoom) return;
    const ctx = zoom.getContext("2d")!;
    const cell = ZOOM_SIZE / ZOOM_CELLS;
    const half = Math.floor(ZOOM_CELLS / 2);
    const d = pixels.data.data;
    for (let dy = 0; dy < ZOOM_CELLS; dy++) {
      for (let dx = 0; dx < ZOOM_CELLS; dx++) {
        const x = s.px + dx - half;
        const y = s.py + dy - half;
        if (x < 0 || y < 0 || x >= pixels.width || y >= pixels.height) ctx.fillStyle = "#808080";
        else {
          const i = (y * pixels.width + x) * 4;
          ctx.fillStyle = `rgb(${d[i]},${d[i + 1]},${d[i + 2]})`;
        }
        ctx.fillRect(dx * cell, dy * cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
    ctx.strokeStyle = isLight(s.rgb) ? "#000" : "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(half * cell, half * cell, cell, cell);
  }

  function pick(rgb: Rgb) {
    setPicked(rgb);
    setHistory((h) => [rgb, ...h.filter((c) => toHex(c) !== toHex(rgb))].slice(0, 16));
  }

  if (!file) return <FileDropzone tool={tool} onFiles={(f) => setFile(f[0])} label="Drop an image to pick colours from" />;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex flex-col gap-4">
        <Panel title="Click to pick a colour" actions={<button type="button" onClick={() => setFile(null)} className="text-xs font-medium text-fg-muted hover:text-fg cursor-pointer">Change image</button>}>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="relative flex justify-center">
            <canvas
              ref={viewRef}
              className="block h-auto max-h-[600px] max-w-full cursor-crosshair rounded-lg"
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
              onPointerDown={(e) => {
                const s = sampleAt(e);
                if (s) pick(s.rgb);
              }}
              aria-label="Image — click to pick a colour"
            />
            <div
              className={cn("pointer-events-none absolute flex flex-col items-center gap-1", !hover && "hidden")}
              style={hover ? { left: hover.x + 18, top: Math.max(0, hover.y - ZOOM_SIZE - 18) } : undefined}
            >
              <canvas ref={zoomRef} width={ZOOM_SIZE} height={ZOOM_SIZE} className="rounded-full border-2 border-white shadow-pop" style={{ width: ZOOM_SIZE / 1.2, height: ZOOM_SIZE / 1.2 }} />
              {hover && <span className="rounded bg-black/75 px-1.5 py-0.5 font-mono text-[11px] text-white">{toHex(hover.rgb)}</span>}
            </div>
          </div>
        </Panel>
        <Panel title="Image palette">
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {palette.map((p) => {
              const hex = toHex(p.rgb);
              return (
                <li key={hex}>
                  <button
                    type="button"
                    onClick={() => {
                      pick(p.rgb);
                      copy(hex);
                    }}
                    className="flex h-20 w-full flex-col justify-end rounded-lg p-1.5 text-left ring-1 ring-inset ring-black/10 cursor-pointer"
                    style={{ background: hex }}
                    title={`${hex} · ${Math.round(p.share * 100)}% of image — click to copy`}
                  >
                    <span className={cn("font-mono text-[10px] font-semibold", isLight(p.rgb) ? "text-black/80" : "text-white/90")}>{copied === hex ? "Copied" : hex}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20" aria-label="Picked colour">
        <Panel title="Picked colour">
          {picked ? (
            <div className="flex flex-col gap-3">
              <div className="h-24 rounded-xl ring-1 ring-inset ring-black/10" style={{ background: toHex(picked) }} />
              <ColorValues rgb={picked} />
            </div>
          ) : (
            <p className="text-sm text-fg-subtle">Hover the image to magnify, click to pick.</p>
          )}
        </Panel>
        {history.length > 0 && (
          <Panel title="History" actions={<Button size="sm" variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setHistory([])}>Clear</Button>}>
            <ul className="grid grid-cols-8 gap-1.5">
              {history.map((c) => (
                <li key={toHex(c)}>
                  <button type="button" onClick={() => setPicked(c)} className="aspect-square w-full rounded-md ring-1 ring-inset ring-black/10 cursor-pointer" style={{ background: toHex(c) }} aria-label={`Select ${toHex(c)}`} title={toHex(c)} />
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </aside>
    </div>
  );
}
