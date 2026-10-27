"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { ToolSkeleton } from "@/components/tool/ToolSkeleton";

/** Loading placeholder; pass a height for workspaces much taller than the default one. */
const sized = (minHeight?: string) => function SizedSkeleton() {
  return <ToolSkeleton minHeight={minHeight} />;
};

/** Every tool workspace is code-split and only loaded in the browser. */
export const TOOL_COMPONENTS: Record<string, ComponentType> = {
  // document
  "merge-pdf": dynamic(() => import("./document/MergePdf"), { ssr: false, loading: sized() }),
  "split-pdf": dynamic(() => import("./document/SplitPdf"), { ssr: false, loading: sized() }),
  "organize-pdf": dynamic(() => import("./document/OrganizePdf"), { ssr: false, loading: sized() }),
  "images-to-pdf": dynamic(() => import("./document/ImagesToPdf"), { ssr: false, loading: sized() }),
  "pdf-to-images": dynamic(() => import("./document/PdfToImages"), { ssr: false, loading: sized() }),
  "sign-pdf": dynamic(() => import("./document/SignPdf"), { ssr: false, loading: sized() }),
  "rotate-pdf": dynamic(() => import("./document/RotatePdf"), { ssr: false, loading: sized() }),
  "add-page-numbers": dynamic(() => import("./document/AddPageNumbers"), { ssr: false, loading: sized() }),
  // image
  "compress-image": dynamic(() => import("./image/CompressImage"), { ssr: false, loading: sized() }),
  "resize-image": dynamic(() => import("./image/ResizeImage"), { ssr: false, loading: sized() }),
  "image-converter": dynamic(() => import("./image/ImageConverter"), { ssr: false, loading: sized() }),
  "crop-image": dynamic(() => import("./image/CropImage"), { ssr: false, loading: sized() }),
  "rotate-flip-image": dynamic(() => import("./image/RotateFlipImage"), { ssr: false, loading: sized() }),
  "watermark-image": dynamic(() => import("./image/WatermarkImage"), { ssr: false, loading: sized() }),
  "meme-generator": dynamic(() => import("./image/MemeGenerator"), { ssr: false, loading: sized() }),
  // audio
  "audio-cutter": dynamic(() => import("./audio/AudioCutter"), { ssr: false, loading: sized() }),
  "audio-joiner": dynamic(() => import("./audio/AudioJoiner"), { ssr: false, loading: sized() }),
  "audio-speed": dynamic(() => import("./audio/AudioSpeed"), { ssr: false, loading: sized() }),
  "volume-booster": dynamic(() => import("./audio/VolumeBooster"), { ssr: false, loading: sized() }),
  "reverse-audio": dynamic(() => import("./audio/ReverseAudio"), { ssr: false, loading: sized() }),
  // utility
  "qr-code": dynamic(() => import("./utility/QrCode"), { ssr: false, loading: sized("min-h-[1500px] md:min-h-[780px]") }),
  "barcode-generator": dynamic(() => import("./utility/BarcodeGenerator"), { ssr: false, loading: sized("min-h-[995px] md:min-h-[604px] lg:min-h-[508px]") }),
  "word-counter": dynamic(() => import("./utility/WordCounter"), { ssr: false, loading: sized("min-h-[1120px] md:min-h-[568px]") }),
  "case-converter": dynamic(() => import("./utility/CaseConverter"), { ssr: false, loading: sized("min-h-[845px] md:min-h-[715px] lg:min-h-[637px]") }),
  "color-picker": dynamic(() => import("./utility/ColorPicker"), { ssr: false, loading: sized() }),
};
