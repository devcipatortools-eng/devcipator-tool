"use client";

import { useState, type ReactNode } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, Plus } from "lucide-react";
import type { ToolConfig } from "@/config/tools.config";
import { validateFiles } from "@/lib/files";
import { CATEGORY_STYLE } from "@/lib/category-style";
import { cn } from "@/lib/cn";
import { Notice } from "@/components/ui/controls";

export interface FileDropzoneProps {
  tool: Pick<ToolConfig, "accept" | "acceptLabel" | "maxSizeMB" | "multiple" | "category">;
  onFiles: (files: File[]) => void;
  variant?: "hero" | "compact";
  label?: ReactNode;
  /** Overrides tool.multiple (e.g. a single logo picker inside a batch tool). */
  multiple?: boolean;
  /** Overrides tool.accept. */
  accept?: string[];
}

/**
 * Drag-and-drop + click-to-browse file picker (react-dropzone) with our own
 * type/size validation so error messages are consistent across tools.
 */
export function FileDropzone({ tool, onFiles, variant = "hero", label, multiple, accept }: FileDropzoneProps) {
  const [errors, setErrors] = useState<string[]>([]);
  const allowMany = multiple ?? tool.multiple;
  const acceptList = accept ?? tool.accept;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: allowMany,
    // Validation is done in onDrop so unsupported files get a readable message.
    onDrop: (files) => {
      if (files.length === 0) return;
      const { accepted, errors } = validateFiles(allowMany ? files : files.slice(0, 1), acceptList, tool.maxSizeMB);
      setErrors(errors);
      if (accepted.length) onFiles(accepted);
    },
  });

  const errorNotice = errors.length > 0 && <Notice tone="danger">{errors.join(" ")}</Notice>;
  const input = <input {...getInputProps()} accept={acceptList.join(",")} />;

  if (variant === "compact") {
    return (
      <div className="flex flex-col gap-2">
        <div
          {...getRootProps()}
          className={cn(
            "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-medium",
            isDragActive ? "border-primary bg-primary-soft text-primary-strong" : "border-border-strong text-fg-muted hover:border-primary hover:text-fg",
          )}
        >
          {input}
          <Plus className="size-4" aria-hidden />
          {label ?? (allowMany ? "Add more files" : "Replace file")}
        </div>
        {errorNotice}
      </div>
    );
  }

  const style = CATEGORY_STYLE[tool.category];
  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={cn(
          "flex min-h-72 cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-12 text-center",
          isDragActive ? "border-primary bg-primary-soft" : "border-border-strong bg-surface hover:border-primary hover:bg-surface-2",
        )}
      >
        {input}
        <span className={cn("flex size-16 items-center justify-center rounded-2xl", style.soft, style.text)}>
          <CloudUpload className="size-8" aria-hidden strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-lg font-semibold text-fg">
            {isDragActive ? "Drop to add" : (label ?? `Drop ${allowMany ? "files" : "a file"} here or click to browse`)}
          </p>
          <p className="text-sm text-fg-muted">
            {tool.acceptLabel} · up to {tool.maxSizeMB} MB{allowMany ? " each" : ""}
          </p>
        </div>
        <span className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-fg">
          Select {allowMany ? "files" : "file"}
        </span>
      </div>
      {errorNotice}
    </div>
  );
}
