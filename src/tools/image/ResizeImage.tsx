"use client";

import { useMemo, useState } from "react";
import { Link2, Link2Off, Scaling } from "lucide-react";
import { useFileList } from "@/hooks/useFileList";
import { useProcessor, throwIfAborted } from "@/hooks/useProcessor";
import { useImageDimensions } from "@/hooks/useImageDimensions";
import { transformImage } from "@/lib/image/client";
import { EXT, formatFor } from "@/lib/image/ops";
import { withExtension, type OutputFile } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { ImageGrid } from "@/components/image/ImageGrid";
import { IconButton } from "@/components/ui/Button";
import { Field, NumberInput, Segmented, Select, Slider } from "@/components/ui/controls";

type Mode = "pixels" | "percent";

const PRESETS = [
  { value: "", label: "Custom size" },
  { value: "1080x1080", label: "Instagram post — 1080×1080" },
  { value: "1080x1920", label: "Story / Reel — 1080×1920" },
  { value: "1200x630", label: "Facebook / OG image — 1200×630" },
  { value: "1500x500", label: "X header — 1500×500" },
  { value: "1280x720", label: "YouTube thumbnail — 1280×720" },
  { value: "1920x1080", label: "Full HD — 1920×1080" },
  { value: "3840x2160", label: "4K UHD — 3840×2160" },
];

export default function ResizeImage() {
  const list = useFileList(true);
  const processor = useProcessor();
  const files = useMemo(() => list.items.map((i) => i.file), [list.items]);
  const dims = useImageDimensions(files);
  const [mode, setMode] = useState<Mode>("percent");
  const [percent, setPercent] = useState(50);
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [lock, setLock] = useState(true);
  const [preset, setPreset] = useState("");

  const first = files[0] ? dims.get(files[0]) : undefined;
  const ratio = first ? first.width / first.height : 16 / 9;

  function targetFor(file: File): { width: number; height: number } | null {
    const d = dims.get(file);
    if (!d) return null;
    if (mode === "percent") return { width: Math.max(1, Math.round((d.width * percent) / 100)), height: Math.max(1, Math.round((d.height * percent) / 100)) };
    if (!lock) return { width, height };
    // Keep each image's own aspect ratio, fitting the requested width.
    return { width, height: Math.max(1, Math.round(width / (d.width / d.height))) };
  }

  const captions = Object.fromEntries(
    list.items.map((i) => {
      const d = dims.get(i.file);
      const t = targetFor(i.file);
      return [i.id, d && t ? `${d.width}×${d.height} → ${t.width}×${t.height}` : "…"];
    }),
  );

  async function resize() {
    const items = list.items;
    await processor.run(async ({ report, signal }) => {
      const out: OutputFile[] = [];
      for (let i = 0; i < items.length; i++) {
        throwIfAborted(signal);
        const file = items[i].file;
        report(i / items.length, `Resizing ${file.name}`);
        const size = targetFor(file);
        if (!size) throw new Error(`Could not read ${file.name}.`);
        const format = formatFor(file.type);
        const res = await transformImage(file, { resize: size, format, quality: 0.92 }, { signal });
        out.push({ name: withExtension(file.name, EXT[format], `-${res.width}x${res.height}`), blob: res.blob, note: `${res.width}×${res.height}` });
      }
      return out;
    });
  }

  return (
    <ToolLayout
      slug="resize-image"
      fileCount={files.length}
      onFiles={list.add}
      onReset={list.clear}
      processor={processor}
      zipName="resized-images.zip"
      action={{
        label: `Resize ${files.length > 1 ? `${files.length} images` : "image"}`,
        icon: <Scaling className="size-5" />,
        disabled: mode === "pixels" ? !(width > 0 && height > 0) : !(percent > 0),
        onClick: resize,
      }}
      options={
        <>
          <Segmented
            label="Resize by"
            value={mode}
            onChange={setMode}
            options={[
              { value: "percent", label: "Percentage" },
              { value: "pixels", label: "Pixels" },
            ]}
          />
          {mode === "percent" ? (
            <Slider label="Scale" value={percent} onChange={setPercent} min={1} max={400} format={(v) => `${v}%`} />
          ) : (
            <>
              <Select
                label="Preset"
                value={preset}
                onChange={(v) => {
                  setPreset(v);
                  if (v) {
                    const [w, h] = v.split("x").map(Number);
                    setWidth(w);
                    setHeight(h);
                    setLock(false);
                  }
                }}
                options={PRESETS}
              />
              <div className="flex items-end gap-2">
                <Field label="Width" className="flex-1">
                  <NumberInput
                    value={width}
                    min={1}
                    suffix="px"
                    label="Width"
                    onChange={(v) => {
                      setPreset("");
                      setWidth(v);
                      if (lock && v > 0) setHeight(Math.round(v / ratio));
                    }}
                  />
                </Field>
                <IconButton label={lock ? "Unlock aspect ratio" : "Lock aspect ratio"} active={lock} onClick={() => setLock((l) => !l)} size="lg" className="mb-0.5 pointer-coarse:size-11">
                  {lock ? <Link2 className="size-4" /> : <Link2Off className="size-4" />}
                </IconButton>
                <Field label="Height" className="flex-1">
                  <NumberInput
                    value={height}
                    min={1}
                    suffix="px"
                    label="Height"
                    onChange={(v) => {
                      setPreset("");
                      setHeight(v);
                      if (lock && v > 0) setWidth(Math.round(v * ratio));
                    }}
                  />
                </Field>
              </div>
              <p className="text-xs text-fg-subtle">
                {lock ? "Aspect ratio locked: each image keeps its proportions at the given width." : "Images are stretched to exactly this size."}
              </p>
            </>
          )}
        </>
      }
    >
      <Panel title={`${files.length} image${files.length === 1 ? "" : "s"}`}>
        <ImageGrid items={list.items} onRemove={list.remove} captions={captions} />
      </Panel>
    </ToolLayout>
  );
}
