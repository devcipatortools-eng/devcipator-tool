"use client";

import type { CSSProperties } from "react";
import { X } from "lucide-react";
import type { FileItem } from "@/hooks/useFileList";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { formatBytes } from "@/lib/files";
import { cn } from "@/lib/cn";

function Tile({
  item,
  selected,
  onSelect,
  onRemove,
  imageStyle,
  caption,
}: {
  item: FileItem;
  selected: boolean;
  onSelect?: () => void;
  onRemove: () => void;
  imageStyle?: CSSProperties;
  caption?: string;
}) {
  const url = useObjectUrl(item.file);
  return (
    <li className={cn("group relative flex flex-col gap-1.5 rounded-xl border bg-surface p-1.5", selected ? "border-primary ring-2 ring-primary/30" : "border-border")}>
      <button type="button" onClick={onSelect} className="bg-checker flex aspect-square items-center justify-center overflow-hidden rounded-lg cursor-pointer" aria-label={`Preview ${item.file.name}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt="" className="max-h-full max-w-full object-contain" style={imageStyle} />}
      </button>
      <div className="flex items-center gap-1 px-0.5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-fg" title={item.file.name}>
            {item.file.name}
          </p>
          <p className="text-[11px] text-fg-subtle">{caption ?? formatBytes(item.file.size)}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${item.file.name}`}
        className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-surface/90 text-fg-muted shadow-card ring-1 ring-border hover:text-danger cursor-pointer"
      >
        <X className="size-3.5" />
      </button>
    </li>
  );
}

export function ImageGrid({
  items,
  selectedId,
  onSelect,
  onRemove,
  imageStyle,
  captions,
}: {
  items: FileItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onRemove: (id: string) => void;
  imageStyle?: CSSProperties;
  captions?: Record<string, string>;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <Tile
          key={item.id}
          item={item}
          selected={item.id === selectedId}
          onSelect={onSelect ? () => onSelect(item.id) : undefined}
          onRemove={() => onRemove(item.id)}
          imageStyle={imageStyle}
          caption={captions?.[item.id]}
        />
      ))}
    </ul>
  );
}
