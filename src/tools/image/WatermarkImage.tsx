"use client";

import { useEffect, useMemo, useState } from "react";
import { Stamp } from "lucide-react";
import { useFileList } from "@/hooks/useFileList";
import { useProcessor, throwIfAborted } from "@/hooks/useProcessor";
import { useDecodedImage } from "@/hooks/useDecodedImage";
import { canvasToBlob, decodeImage, imageSize } from "@/lib/image/decode";
import { EXT, formatFor } from "@/lib/image/ops";
import { withExtension, type OutputFile } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { CanvasView } from "@/components/image/CanvasView";
import { ImageGrid } from "@/components/image/ImageGrid";
import { FileDropzone } from "@/components/tool/FileDropzone";
import { ColorInput, Field, Segmented, Slider, TextInput, Toggle } from "@/components/ui/controls";
import { cn } from "@/lib/cn";

type Kind = "text" | "logo";
type Pos = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

interface Settings {
  kind: Kind;
  text: string;
  color: string;
  bold: boolean;
  shadow: boolean;
  opacity: number;
  /** Watermark width as % of the image width (logo) or font size as % (text). */
  size: number;
  rotation: number;
  position: Pos;
  tile: boolean;
  gap: number;
}

const POSITIONS: Pos[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];

function drawWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, s: Settings, logo: ImageBitmap | HTMLImageElement | null) {
  ctx.save();
  ctx.globalAlpha = s.opacity / 100;
  let mw: number;
  let mh: number;
  let paint: (x: number, y: number) => void;

  if (s.kind === "text") {
    const fontSize = Math.max(6, (s.size / 100) * w * 0.5);
    ctx.font = `${s.bold ? 700 : 500} ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    mw = ctx.measureText(s.text || " ").width;
    mh = fontSize;
    paint = (x, y) => {
      if (s.shadow) {
        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = fontSize * 0.15;
        ctx.shadowOffsetY = fontSize * 0.04;
      }
      ctx.fillStyle = s.color;
      ctx.fillText(s.text, x, y);
    };
  } else {
    if (!logo) {
      ctx.restore();
      return;
    }
    const ls = imageSize(logo);
    mw = (s.size / 100) * w;
    mh = (mw / ls.width) * ls.height;
    paint = (x, y) => ctx.drawImage(logo, x - mw / 2, y - mh / 2, mw, mh);
  }

  const place = (x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((s.rotation * Math.PI) / 180);
    paint(0, 0);
    ctx.restore();
  };

  if (s.tile) {
    const stepX = mw + (s.gap / 100) * w;
    const stepY = mh + (s.gap / 100) * w;
    const diag = Math.hypot(w, h);
    let row = 0;
    for (let y = -diag / 2; y < h + diag / 2; y += stepY, row++) {
      for (let x = -diag / 2 + (row % 2 ? stepX / 2 : 0); x < w + diag / 2; x += stepX) place(x, y);
    }
  } else {
    const margin = Math.max(mw, mh) * 0.1 + w * 0.03;
    const col = s.position[1];
    const rowKey = s.position[0];
    const x = col === "l" ? margin + mw / 2 : col === "r" ? w - margin - mw / 2 : w / 2;
    const y = rowKey === "t" ? margin + mh / 2 : rowKey === "b" ? h - margin - mh / 2 : h / 2;
    place(x, y);
  }
  ctx.restore();
}

export default function WatermarkImage() {
  const list = useFileList(true);
  const processor = useProcessor();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logo, setLogo] = useState<ImageBitmap | HTMLImageElement | null>(null);
  const [s, setS] = useState<Settings>({
    kind: "text",
    text: "© Your Name",
    color: "#ffffff",
    bold: true,
    shadow: true,
    opacity: 60,
    size: 10,
    rotation: 0,
    position: "br",
    tile: false,
    gap: 12,
  });
  const set = (patch: Partial<Settings>) => setS((p) => ({ ...p, ...patch }));
  const selected = list.items.find((i) => i.id === selectedId) ?? list.items[0];
  const { image } = useDecodedImage(selected?.file ?? null, 1100);

  useEffect(() => {
    if (!logoFile) return;
    let cancelled = false;
    decodeImage(logoFile).then((img) => !cancelled && setLogo(img));
    return () => {
      cancelled = true;
    };
  }, [logoFile]);

  const preview = useMemo(() => {
    if (!image) return null;
    const c = document.createElement("canvas");
    c.width = image.preview.width;
    c.height = image.preview.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(image.preview, 0, 0);
    drawWatermark(ctx, c.width, c.height, s, logo);
    return c;
  }, [image, s, logo]);

  async function apply() {
    const items = list.items;
    await processor.run(async ({ report, signal }) => {
      const out: OutputFile[] = [];
      for (let i = 0; i < items.length; i++) {
        throwIfAborted(signal);
        const file = items[i].file;
        report(i / items.length, `Watermarking ${file.name}`);
        const img = await decodeImage(file);
        const { width, height } = imageSize(img);
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        drawWatermark(ctx, width, height, s, logo);
        if ("close" in img) img.close();
        const format = formatFor(file.type);
        out.push({ name: withExtension(file.name, EXT[format], "-watermarked"), blob: await canvasToBlob(c, format, 0.92) });
        c.width = c.height = 0;
      }
      return out;
    });
  }

  const ready = s.kind === "text" ? s.text.trim().length > 0 : !!logo;

  return (
    <ToolLayout
      slug="watermark-image"
      fileCount={list.items.length}
      onFiles={list.add}
      onReset={list.clear}
      processor={processor}
      zipName="watermarked-images.zip"
      action={{
        label: `Watermark ${list.items.length > 1 ? `${list.items.length} images` : "image"}`,
        icon: <Stamp className="size-5" />,
        disabled: !ready,
        hint: s.kind === "text" ? "Enter watermark text." : "Upload a logo image.",
        onClick: apply,
      }}
      options={
        <>
          <Segmented
            label="Watermark"
            value={s.kind}
            onChange={(kind) => set({ kind, size: kind === "logo" ? 20 : 10 })}
            options={[
              { value: "text", label: "Text" },
              { value: "logo", label: "Logo image" },
            ]}
          />
          {s.kind === "text" ? (
            <>
              <Field label="Text">
                <TextInput value={s.text} onChange={(e) => set({ text: e.target.value })} aria-label="Watermark text" />
              </Field>
              <ColorInput label="Colour" value={s.color} onChange={(color) => set({ color })} />
              <div className="flex gap-4">
                <Toggle label="Bold" checked={s.bold} onChange={(bold) => set({ bold })} />
                <Toggle label="Shadow" checked={s.shadow} onChange={(shadow) => set({ shadow })} />
              </div>
            </>
          ) : (
            <FileDropzone
              tool={{ accept: ["image/png", "image/svg+xml", "image/webp", "image/jpeg", ".png", ".svg", ".webp", ".jpg", ".jpeg"], acceptLabel: "PNG, SVG, WebP, JPG", maxSizeMB: 10, multiple: false, category: "image" }}
              variant="compact"
              multiple={false}
              label={logoFile ? `Logo: ${logoFile.name}` : "Choose logo (transparent PNG works best)"}
              onFiles={(f) => setLogoFile(f[0])}
            />
          )}
          <Slider label="Opacity" value={s.opacity} onChange={(opacity) => set({ opacity })} min={5} max={100} format={(v) => `${v}%`} />
          <Slider label="Size" value={s.size} onChange={(size) => set({ size })} min={2} max={80} format={(v) => `${v}%`} />
          <Slider label="Rotation" value={s.rotation} onChange={(rotation) => set({ rotation })} min={-90} max={90} format={(v) => `${v}°`} />
          <Toggle label="Tile across image" checked={s.tile} onChange={(tile) => set({ tile, rotation: tile && s.rotation === 0 ? -30 : s.rotation })} />
          {s.tile ? (
            <Slider label="Spacing" value={s.gap} onChange={(gap) => set({ gap })} min={0} max={50} format={(v) => `${v}%`} />
          ) : (
            <Field label="Position">
              <div className="grid w-28 grid-cols-3 gap-1">
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-label={`Position ${p}`}
                    onClick={() => set({ position: p })}
                    className={cn("aspect-square rounded border cursor-pointer", s.position === p ? "border-primary bg-primary" : "border-border bg-surface-2 hover:border-border-strong")}
                  />
                ))}
              </div>
            </Field>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Panel title="Preview">
          <CanvasView canvas={preview} />
        </Panel>
        {list.items.length > 1 && (
          <Panel title={`Applies to all ${list.items.length} images`}>
            <ImageGrid items={list.items} selectedId={selected?.id} onSelect={setSelectedId} onRemove={list.remove} />
          </Panel>
        )}
      </div>
    </ToolLayout>
  );
}
