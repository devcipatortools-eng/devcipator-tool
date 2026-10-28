"use client";

import { useState } from "react";
import { Crop } from "lucide-react";
import { useProcessor } from "@/hooks/useProcessor";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { useImageDimensions } from "@/hooks/useImageDimensions";
import { transformImage } from "@/lib/image/client";
import { EXT, formatFor, type OutputFormat } from "@/lib/image/ops";
import { withExtension, clamp } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { CropBox, type Rect } from "@/components/image/CropBox";
import { Field, NumberInput, Select } from "@/components/ui/controls";
import { cn } from "@/lib/cn";

const ASPECTS: Array<{ label: string; value: number | null }> = [
  { label: "Free", value: null },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
  { label: "9:16", value: 9 / 16 },
  { label: "4:5", value: 4 / 5 },
];

function fitAspect(W: number, H: number, aspect: number | null): Rect {
  if (!aspect) return { x: Math.round(W * 0.1), y: Math.round(H * 0.1), width: Math.round(W * 0.8), height: Math.round(H * 0.8) };
  let w = W * 0.9;
  let h = w / aspect;
  if (h > H * 0.9) {
    h = H * 0.9;
    w = h * aspect;
  }
  return { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), width: Math.round(w), height: Math.round(h) };
}

export default function CropImage() {
  const [file, setFile] = useState<File | null>(null);
  const [aspectLabel, setAspectLabel] = useState("Free");
  const [rect, setRect] = useState<Rect | null>(null);
  const [output, setOutput] = useState<"same" | OutputFormat>("same");
  const processor = useProcessor();
  const url = useObjectUrl(file);
  const dims = useImageDimensions(file ? [file] : []);
  const size = file ? dims.get(file) : undefined;
  const aspect = ASPECTS.find((a) => a.label === aspectLabel)?.value ?? null;

  // Initialise the crop box when a new image's size becomes known.
  const [initFor, setInitFor] = useState<unknown>(null);
  if (size && initFor !== size) {
    setInitFor(size);
    setRect(fitAspect(size.width, size.height, aspect));
  }

  function setNumeric(key: keyof Rect, v: number) {
    if (!rect || !size || !Number.isFinite(v)) return;
    const next = { ...rect, [key]: Math.round(v) };
    next.width = clamp(next.width, 1, size.width);
    next.height = clamp(next.height, 1, size.height);
    if (aspect && key === "width") next.height = Math.round(next.width / aspect);
    if (aspect && key === "height") next.width = Math.round(next.height * aspect);
    next.x = clamp(next.x, 0, size.width - next.width);
    next.y = clamp(next.y, 0, size.height - next.height);
    setRect(next);
  }

  async function crop() {
    if (!file || !rect) return;
    const format = output === "same" ? formatFor(file.type) : output;
    await processor.run(async ({ signal }) => {
      const res = await transformImage(file, { crop: rect, format, quality: 0.95 }, { signal });
      return [{ name: withExtension(file.name, EXT[format], "-cropped"), blob: res.blob, note: `${res.width}×${res.height}` }];
    });
  }

  return (
    <ToolLayout
      slug="crop-image"
      fileCount={file ? 1 : 0}
      onFiles={(f) => setFile(f[0])}
      onReset={() => {
        setFile(null);
        setRect(null);
      }}
      processor={processor}
      allowAddMore
      action={{ label: "Crop image", icon: <Crop className="size-5" />, disabled: !rect, onClick: crop }}
      options={
        <>
          <Field label="Aspect ratio">
            <div className="grid grid-cols-4 gap-1.5">
              {ASPECTS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    setAspectLabel(a.label);
                    if (size) setRect(fitAspect(size.width, size.height, a.value));
                  }}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-sm font-medium cursor-pointer pointer-coarse:min-h-11",
                    aspectLabel === a.label ? "border-primary bg-primary-soft text-primary-strong" : "border-border text-fg-muted hover:text-fg",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </Field>
          {rect && (
            <div className="grid grid-cols-2 gap-2">
              {(["x", "y", "width", "height"] as const).map((k) => (
                <Field key={k} label={k === "x" ? "X" : k === "y" ? "Y" : k[0].toUpperCase() + k.slice(1)}>
                  <NumberInput value={rect[k]} onChange={(v) => setNumeric(k, v)} min={0} suffix="px" label={k} />
                </Field>
              ))}
            </div>
          )}
          <Select
            label="Output format"
            value={output}
            onChange={setOutput}
            options={[
              { value: "same", label: "Same as input" },
              { value: "image/png", label: "PNG" },
              { value: "image/jpeg", label: "JPG" },
              { value: "image/webp", label: "WebP" },
            ]}
          />
        </>
      }
    >
      <Panel title={size ? `${size.width} × ${size.height} px` : "Image"} actions={rect && <span className="text-xs text-fg-muted tabular-nums">Crop: {rect.width} × {rect.height}</span>}>
        <div className="flex justify-center">
          {url && size && rect && <CropBox src={url} naturalWidth={size.width} naturalHeight={size.height} rect={rect} onChange={setRect} aspect={aspect} />}
        </div>
      </Panel>
    </ToolLayout>
  );
}
