"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { ToolSkeleton } from "@/components/tool/ToolSkeleton";

/** Every tool workspace is code-split and only loaded in the browser. */
export const TOOL_COMPONENTS: Record<string, ComponentType> = {
  // document
  "merge-pdf": dynamic(() => import("./document/MergePdf"), { ssr: false, loading: ToolSkeleton }),
  "split-pdf": dynamic(() => import("./document/SplitPdf"), { ssr: false, loading: ToolSkeleton }),
  "organize-pdf": dynamic(() => import("./document/OrganizePdf"), { ssr: false, loading: ToolSkeleton }),
  "images-to-pdf": dynamic(() => import("./document/ImagesToPdf"), { ssr: false, loading: ToolSkeleton }),
  "pdf-to-images": dynamic(() => import("./document/PdfToImages"), { ssr: false, loading: ToolSkeleton }),
  "sign-pdf": dynamic(() => import("./document/SignPdf"), { ssr: false, loading: ToolSkeleton }),
  "rotate-pdf": dynamic(() => import("./document/RotatePdf"), { ssr: false, loading: ToolSkeleton }),
  "add-page-numbers": dynamic(() => import("./document/AddPageNumbers"), { ssr: false, loading: ToolSkeleton }),
  // image
  "compress-image": dynamic(() => import("./image/CompressImage"), { ssr: false, loading: ToolSkeleton }),
  "resize-image": dynamic(() => import("./image/ResizeImage"), { ssr: false, loading: ToolSkeleton }),
  "image-converter": dynamic(() => import("./image/ImageConverter"), { ssr: false, loading: ToolSkeleton }),
  "crop-image": dynamic(() => import("./image/CropImage"), { ssr: false, loading: ToolSkeleton }),
  "rotate-flip-image": dynamic(() => import("./image/RotateFlipImage"), { ssr: false, loading: ToolSkeleton }),
  "watermark-image": dynamic(() => import("./image/WatermarkImage"), { ssr: false, loading: ToolSkeleton }),
  "meme-generator": dynamic(() => import("./image/MemeGenerator"), { ssr: false, loading: ToolSkeleton }),
  // audio
  "audio-cutter": dynamic(() => import("./audio/AudioCutter"), { ssr: false, loading: ToolSkeleton }),
  "audio-joiner": dynamic(() => import("./audio/AudioJoiner"), { ssr: false, loading: ToolSkeleton }),
  "audio-speed": dynamic(() => import("./audio/AudioSpeed"), { ssr: false, loading: ToolSkeleton }),
  "volume-booster": dynamic(() => import("./audio/VolumeBooster"), { ssr: false, loading: ToolSkeleton }),
  "reverse-audio": dynamic(() => import("./audio/ReverseAudio"), { ssr: false, loading: ToolSkeleton }),
  // utility
  "qr-code": dynamic(() => import("./utility/QrCode"), { ssr: false, loading: ToolSkeleton }),
  "barcode-generator": dynamic(() => import("./utility/BarcodeGenerator"), { ssr: false, loading: ToolSkeleton }),
  "word-counter": dynamic(() => import("./utility/WordCounter"), { ssr: false, loading: ToolSkeleton }),
  "case-converter": dynamic(() => import("./utility/CaseConverter"), { ssr: false, loading: ToolSkeleton }),
  "color-picker": dynamic(() => import("./utility/ColorPicker"), { ssr: false, loading: ToolSkeleton }),
};
