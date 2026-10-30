import { SITE, TOOLS } from "@/config/tools.config";
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from "@/lib/og";

export const alt = `${SITE.name}: free, private PDF, image and audio tools`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return ogImage({
    eyebrow: `${TOOLS.length} free tools`,
    title: "PDF, image & audio tools that run in your browser",
    description: "Merge and sign PDFs, compress images, cut audio and make QR codes. Nothing is uploaded.",
  });
}
