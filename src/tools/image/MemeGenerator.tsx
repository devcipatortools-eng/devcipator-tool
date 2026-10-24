"use client";

import { useEffect, useMemo, useState } from "react";
import { Anton } from "next/font/google";
import { Laugh } from "lucide-react";
import { useProcessor } from "@/hooks/useProcessor";
import { useDecodedImage } from "@/hooks/useDecodedImage";
import { canvasToBlob } from "@/lib/image/decode";
import { withExtension } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { CanvasView } from "@/components/image/CanvasView";
import { ColorInput, Field, Segmented, Slider, TextInput, Toggle } from "@/components/ui/controls";

const anton = Anton({ weight: "400", subsets: ["latin"], preload: false, display: "block" });

interface Style {
  size: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  upper: boolean;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    lines.push(line);
  }
  return lines.filter((l, i, a) => l || a.length === 1);
}

function drawMeme(ctx: CanvasRenderingContext2D, w: number, h: number, top: string, bottom: string, st: Style, family: string) {
  const fontSize = (st.size / 100) * w;
  ctx.font = `${fontSize}px ${family}`;
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.fillStyle = st.fill;
  ctx.strokeStyle = st.stroke;
  ctx.lineWidth = fontSize * (st.strokeWidth / 100);
  const pad = w * 0.03;
  const lh = fontSize * 1.08;
  const draw = (raw: string, fromTop: boolean) => {
    const text = st.upper ? raw.toUpperCase() : raw;
    if (!text.trim()) return;
    const lines = wrap(ctx, text, w - pad * 2);
    ctx.textBaseline = fromTop ? "top" : "bottom";
    lines.forEach((line, i) => {
      const y = fromTop ? pad + i * lh : h - pad - (lines.length - 1 - i) * lh;
      if (ctx.lineWidth > 0) ctx.strokeText(line, w / 2, y);
      ctx.fillText(line, w / 2, y);
    });
  };
  draw(top, true);
  draw(bottom, false);
}

export default function MemeGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [top, setTop] = useState("When the code works");
  const [bottom, setBottom] = useState("on the first try");
  const [style, setStyle] = useState<Style>({ size: 10, fill: "#ffffff", stroke: "#000000", strokeWidth: 16, upper: true });
  const [format, setFormat] = useState<"png" | "jpg">("jpg");
  const [fontReady, setFontReady] = useState(false);
  const processor = useProcessor();
  const { image } = useDecodedImage(file, 1200);
  // Classic meme look: Impact where installed, Anton (self-hosted by next/font) everywhere else.
  const family = `Impact, ${anton.style.fontFamily}`;
  const set = (patch: Partial<Style>) => setStyle((s) => ({ ...s, ...patch }));

  useEffect(() => {
    document.fonts.load(`48px ${anton.style.fontFamily}`).finally(() => setFontReady(true));
  }, []);

  const preview = useMemo(() => {
    if (!image || !fontReady) return null;
    const c = document.createElement("canvas");
    c.width = image.preview.width;
    c.height = image.preview.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(image.preview, 0, 0);
    drawMeme(ctx, c.width, c.height, top, bottom, style, family);
    return c;
  }, [image, fontReady, top, bottom, style, family]);

  async function exportMeme() {
    if (!image || !file) return;
    await processor.run(async () => {
      const c = document.createElement("canvas");
      c.width = image.width;
      c.height = image.height;
      const ctx = c.getContext("2d")!;
      if (format === "jpg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, c.width, c.height);
      }
      ctx.drawImage(image.source, 0, 0);
      drawMeme(ctx, c.width, c.height, top, bottom, style, family);
      const blob = await canvasToBlob(c, format === "png" ? "image/png" : "image/jpeg", 0.92);
      return [{ name: withExtension(file.name, format, "-meme"), blob }];
    });
  }

  return (
    <ToolLayout
      slug="meme-generator"
      fileCount={file ? 1 : 0}
      onFiles={(f) => setFile(f[0])}
      onReset={() => setFile(null)}
      processor={processor}
      allowAddMore
      action={{ label: "Create meme", icon: <Laugh className="size-5" />, disabled: !preview, onClick: exportMeme }}
      options={
        <>
          <Field label="Top text">
            <TextInput value={top} onChange={(e) => setTop(e.target.value)} aria-label="Top text" />
          </Field>
          <Field label="Bottom text">
            <TextInput value={bottom} onChange={(e) => setBottom(e.target.value)} aria-label="Bottom text" />
          </Field>
          <Slider label="Font size" value={style.size} onChange={(size) => set({ size })} min={4} max={20} format={(v) => `${v}%`} />
          <div className="grid grid-cols-2 gap-3">
            <ColorInput label="Fill" value={style.fill} onChange={(fill) => set({ fill })} />
            <ColorInput label="Outline" value={style.stroke} onChange={(stroke) => set({ stroke })} />
          </div>
          <Slider label="Outline width" value={style.strokeWidth} onChange={(strokeWidth) => set({ strokeWidth })} min={0} max={30} format={(v) => `${v}%`} />
          <Toggle label="UPPERCASE" checked={style.upper} onChange={(upper) => set({ upper })} />
          <Segmented
            label="Format"
            value={format}
            onChange={setFormat}
            options={[
              { value: "jpg", label: "JPG" },
              { value: "png", label: "PNG" },
            ]}
          />
        </>
      }
    >
      <Panel title="Meme preview">
        <CanvasView canvas={preview} />
      </Panel>
    </ToolLayout>
  );
}
