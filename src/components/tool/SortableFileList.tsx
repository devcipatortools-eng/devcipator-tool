"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, GripVertical, Trash2 } from "lucide-react";
import type { FileItem } from "@/hooks/useFileList";
import { formatBytes } from "@/lib/files";
import { cn } from "@/lib/cn";
import { IconButton } from "@/components/ui/Button";

interface SortableFileListProps {
  items: FileItem[];
  onMove: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  /** Optional thumbnail / extra info for each row. */
  renderLeading?: (item: FileItem, index: number) => ReactNode;
  renderMeta?: (item: FileItem, index: number) => ReactNode;
}

/** Reorderable list via drag and drop (pointer) or arrow buttons (keyboard). */
export function SortableFileList({ items, onMove, onRemove, renderLeading, renderMeta }: SortableFileListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li
          key={item.id}
          draggable
          onDragStart={(e) => {
            setDragIndex(i);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(i));
          }}
          onDragOver={(e) => {
            if (dragIndex === null) return;
            e.preventDefault();
            setOverIndex(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex !== null) onMove(dragIndex, i);
            setDragIndex(null);
            setOverIndex(null);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          className={cn(
            "flex items-center gap-3 rounded-xl border bg-surface p-2.5",
            overIndex === i && dragIndex !== i ? "border-primary bg-primary-soft" : "border-border",
            dragIndex === i && "opacity-50",
          )}
        >
          <GripVertical className="size-4 shrink-0 cursor-grab text-fg-subtle" aria-hidden />
          <span className="w-6 shrink-0 text-center font-mono text-xs text-fg-subtle tabular-nums">{i + 1}</span>
          {renderLeading?.(item, i)}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg" title={item.file.name}>
              {item.file.name}
            </p>
            <p className="text-xs text-fg-muted">
              {formatBytes(item.file.size)}
              {renderMeta && <span className="ml-1.5">{renderMeta(item, i)}</span>}
            </p>
          </div>
          <div className="flex shrink-0 items-center">
            <IconButton label="Move up" onClick={() => onMove(i, i - 1)} disabled={i === 0}>
              <ArrowUp className="size-4" />
            </IconButton>
            <IconButton label="Move down" onClick={() => onMove(i, i + 1)} disabled={i === items.length - 1}>
              <ArrowDown className="size-4" />
            </IconButton>
            <IconButton label={`Remove ${item.file.name}`} onClick={() => onRemove(item.id)} className="hover:!text-danger">
              <Trash2 className="size-4" />
            </IconButton>
          </div>
        </li>
      ))}
    </ol>
  );
}
