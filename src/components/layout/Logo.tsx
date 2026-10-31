import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { SITE } from "@/config/tools.config";
import { cn } from "@/lib/cn";
import mark from "../../../public/devcipator-mark.png";

// The Devcipator wordmark is set in Inter Bold; "Tools" matches it.
const wordmark = Inter({ weight: "700", subsets: ["latin"] });

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 pointer-coarse:min-h-11" aria-label={`${SITE.name} home`}>
      {/* Rendered at h-8; the explicit size keeps the srcset at 1x/2x of that instead of the 512px source. */}
      <Image src={mark} alt="" width={32} height={32} priority className="size-8" />
      {/* The gradient continues the mark's. */}
      <span
        className={cn(
          wordmark.className,
          "bg-gradient-to-r from-[#ff6c48] to-[#ff7d5e] bg-clip-text text-xl leading-none uppercase text-transparent",
        )}
      >
        Tools
      </span>
    </Link>
  );
}
