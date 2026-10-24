"use client";

import { useState } from "react";
import { FlipHorizontal, FlipVertical, RotateCcw, RotateCw } from "lucide-react";
import { useFileList } from "@/hooks/useFileList";
import { useProcessor, throwIfAborted } from "@/hooks/useProcessor";
import { transformImage } from "@/lib/image/client";
import { EXT, formatFor, type OutputFormat } from "@/lib/image/ops";
import { withExtension, type OutputFile } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { ImageGrid } from "@/components/image/ImageGrid";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/controls";

type Rotation = 0 | 90 | 180 | 270;

export default function RotateFlipImage() {
  const list = useFileList(true);
  const processor = useProcessor();
  const [rotate, setRotate] = useState<Rotation>(90);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [output, setOutput] = useState<"same" | OutputFormat>("same");

  const turn = (delta: number) => setRotate((r) => (((r + delta) % 360) + 360) % 360 as Rotation);
  const noop = rotate === 0 && !flipH && !flipV;

  async function apply() {
    const items = list.items;
    await processor.run(async ({ report, signal }) => {
      const out: OutputFile[] = [];
      for (let i = 0; i < items.length; i++) {
        throwIfAborted(signal);
        const file = items[i].file;
        report(i / items.length, `Processing ${file.name}`);
        const format = output === "same" ? formatFor(file.type) : output;
        const res = await transformImage(file, { rotate, flipH, flipV, format, quality: 0.95 }, { signal });
        out.push({ name: withExtension(file.name, EXT[format], "-rotated"), blob: res.blob, note: `${res.width}×${res.height}` });
      }
      return out;
    });
  }

  // Same transform order as the export pipeline (flip the image, then rotate it).
  const previewStyle = { transform: `rotate(${rotate}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})` };

  return (
    <ToolLayout
      slug="rotate-flip-image"
      fileCount={list.items.length}
      onFiles={list.add}
      onReset={list.clear}
      processor={processor}
      zipName="rotated-images.zip"
      action={{ label: `Apply to ${list.items.length} image${list.items.length === 1 ? "" : "s"}`, icon: <RotateCw className="size-5" />, disabled: noop, hint: "Choose a rotation or flip.", onClick: apply }}
      options={
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Rotate</span>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" icon={<RotateCcw className="size-4" />} onClick={() => turn(-90)}>
                Left
              </Button>
              <Button variant="secondary" icon={<RotateCw className="size-4" />} onClick={() => turn(90)}>
                Right
              </Button>
            </div>
            <p className="text-xs text-fg-muted">Current: {rotate}° clockwise</p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Flip</span>
            <div className="grid grid-cols-2 gap-2">
              <Button variant={flipH ? "primary" : "secondary"} icon={<FlipHorizontal className="size-4" />} onClick={() => setFlipH((v) => !v)} aria-pressed={flipH}>
                Horizontal
              </Button>
              <Button variant={flipV ? "primary" : "secondary"} icon={<FlipVertical className="size-4" />} onClick={() => setFlipV((v) => !v)} aria-pressed={flipV}>
                Vertical
              </Button>
            </div>
          </div>
          <Select
            label="Output format"
            value={output}
            onChange={setOutput}
            options={[
              { value: "same", label: "Same as input" },
              { value: "image/png", label: "PNG (lossless)" },
              { value: "image/jpeg", label: "JPG" },
              { value: "image/webp", label: "WebP" },
            ]}
          />
          <Button variant="ghost" onClick={() => { setRotate(0); setFlipH(false); setFlipV(false); }} disabled={noop}>
            Reset
          </Button>
        </>
      }
    >
      <Panel title="Preview">
        <ImageGrid items={list.items} onRemove={list.remove} imageStyle={previewStyle} />
      </Panel>
    </ToolLayout>
  );
}
