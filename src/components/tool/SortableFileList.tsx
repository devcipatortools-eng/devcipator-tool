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

/** Panel-header hint; touch screens can't drag rows, so they're pointed at the arrows. */
export function ReorderHint({ drag = "Drag to reorder" }: { drag?: string }) {
  return (
    <span className="text-xs text-fg-subtle">
      <span className="pointer-coarse:hidden">{drag}</span>
      <span className="hidden pointer-coarse:inline">Use the arrows to reorder</span>
    </span>
  );
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
            "flex flex-wrap items-center gap-2 rounded-xl border bg-surface p-2.5 sm:flex-nowrap sm:gap-3",
            overIndex === i && dragIndex !== i ? "border-primary bg-primary-soft" : "border-border",
            dragIndex === i && "opacity-50",
          )}
        >
          {/* Drag-and-drop needs a mouse, so touch screens rely on the arrow buttons instead. */}
          <GripVertical className="size-4 shrink-0 cursor-grab text-fg-subtle pointer-coarse:hidden" aria-hidden />
          <span className="w-5 shrink-0 text-center font-mono text-xs text-fg-subtle tabular-nums sm:w-6">{i + 1}</span>
          {renderLeading?.(item, i)}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg" title={item.file.name}>
              {item.file.name}
            </p>
            {/* Phones stack size and details; wider screens show them on one line. */}
            <p className="flex flex-col text-xs text-fg-muted sm:flex-row sm:gap-x-1.5">
              <span className="whitespace-nowrap">{formatBytes(item.file.size)}</span>
              {renderMeta && (
                <span className="whitespace-nowrap">
                  <span className="hidden sm:inline" aria-hidden>· </span>
                  {renderMeta(item, i)}
                </span>
              )}
            </p>
          </div>
          {/* Phones put the buttons on their own row so the file name keeps the full width. */}
          <div className="-mb-1 -mt-2 flex shrink-0 basis-full items-center justify-end sm:m-0 sm:basis-auto">
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
