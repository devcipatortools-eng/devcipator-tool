"use client";

import { useMemo, useState } from "react";
import { ImageOff, Images } from "lucide-react";
import { useFileList } from "@/hooks/useFileList";
import { useImageDimensions } from "@/hooks/useImageDimensions";
import { useProcessor, throwIfAborted } from "@/hooks/useProcessor";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { pdfBlob, pdfWorker } from "@/lib/pdf/client";
import type { RasterPage } from "@/lib/pdf/api";
import { imageToEmbeddable } from "@/lib/image/decode";
import { outputName } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { ReorderHint, SortableFileList } from "@/components/tool/SortableFileList";
import { Field, Segmented, Select, TextInput } from "@/components/ui/controls";

type Size = "fit" | "a4" | "letter";
type Orientation = "auto" | "portrait" | "landscape";
type Margin = "none" | "small" | "medium" | "large";

const PAPER = { a4: { width: 595.28, height: 841.89 }, letter: { width: 612, height: 792 } };
const MARGINS: Record<Margin, number> = { none: 0, small: 18, medium: 36, large: 72 };

function Thumb({ file, broken }: { file: File; broken: boolean }) {
  const url = useObjectUrl(file);
  if (broken) {
    return (
      <span title="Can't read this image" className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-danger/30 bg-danger-soft text-danger">
        <ImageOff className="size-5" aria-label="Can't read this image" />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" className="bg-checker size-12 shrink-0 rounded-lg border border-border object-cover" /> : null;
}

export default function ImagesToPdf() {
  const list = useFileList(true);
  const processor = useProcessor();
  const [size, setSize] = useState<Size>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState<Margin>("small");
  const [name, setName] = useState("images");
  const files = useMemo(() => list.items.map((i) => i.file), [list.items]);
  const dims = useImageDimensions(files);
  const unreadable = files.filter((f) => dims.get(f) === null);

  async function build() {
    await processor.run(async ({ report, signal }) => {
      const pages: RasterPage[] = [];
      for (let i = 0; i < files.length; i++) {
        throwIfAborted(signal);
        report((i / files.length) * 0.7, `Preparing ${files[i].name}`);
        const img = await imageToEmbeddable(files[i]).catch(() => {
          throw new Error(`“${files[i].name}” isn't a readable image. Remove it and try again.`);
        });
        const m = MARGINS[margin];
        let pageWidth: number;
        let pageHeight: number;
        if (size === "fit") {
          // Page matches the image (pixels at 96 DPI → points) plus margins.
          pageWidth = img.width * 0.75 + m * 2;
          pageHeight = img.height * 0.75 + m * 2;
        } else {
          const landscape = orientation === "landscape" || (orientation === "auto" && img.width > img.height);
          const p = PAPER[size];
          [pageWidth, pageHeight] = landscape ? [p.height, p.width] : [p.width, p.height];
        }
        pages.push({ bytes: img.bytes, format: img.format, pixelWidth: img.width, pixelHeight: img.height, pageWidth, pageHeight, margin: m });
      }
      const bytes = await pdfWorker().call("images", [pages, name], {
        signal,
        onProgress: (v, l) => report(0.7 + (v ?? 0) * 0.3, l),
      });
      return [{ name: outputName(name, "images", "pdf"), blob: pdfBlob(bytes), note: `${files.length} page${files.length === 1 ? "" : "s"}` }];
    });
  }

  return (
    <ToolLayout
      slug="images-to-pdf"
      fileCount={files.length}
      onFiles={list.add}
      onReset={list.clear}
      processor={processor}
      action={{
        label: "Create PDF",
        icon: <Images className="size-5" />,
        disabled: unreadable.length > 0,
        hint: `Remove the unreadable image${unreadable.length === 1 ? "" : "s"} first: ${unreadable.map((f) => f.name).join(", ")}.`,
        onClick: build,
      }}
      options={
        <>
          <Segmented
            label="Page size"
            value={size}
            onChange={setSize}
            options={[
              { value: "fit", label: "Fit image" },
              { value: "a4", label: "A4" },
              { value: "letter", label: "Letter" },
            ]}
          />
          {size !== "fit" && (
            <Segmented
              label="Orientation"
              value={orientation}
              onChange={setOrientation}
              hint="Auto picks landscape for wide images."
              options={[
                { value: "auto", label: "Auto" },
                { value: "portrait", label: "Portrait" },
                { value: "landscape", label: "Landscape" },
              ]}
            />
          )}
          <Select
            label="Margin"
            value={margin}
            onChange={setMargin}
            options={[
              { value: "none", label: "No margin" },
              { value: "small", label: "Small" },
              { value: "medium", label: "Medium" },
              { value: "large", label: "Large" },
            ]}
          />
          <Field label="File name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} aria-label="File name" />
          </Field>
        </>
      }
    >
      <Panel title="Pages in order" actions={<ReorderHint />}>
        <SortableFileList items={list.items} onMove={list.move} onRemove={list.remove} renderLeading={(item) => <Thumb file={item.file} broken={dims.get(item.file) === null} />} />
      </Panel>
    </ToolLayout>
  );
}
