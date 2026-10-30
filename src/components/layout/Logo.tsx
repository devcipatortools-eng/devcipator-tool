import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import { SITE } from "@/config/tools.config";
import { cn } from "@/lib/cn";
import logo from "../../../public/devcipator-logo.png";

// The wordmark in the logo image is set in Inter Bold; "Tools" matches it.
const wordmark = Inter({ weight: "700", subsets: ["latin"] });

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-[0.4rem] pointer-coarse:min-h-11" aria-label={`${SITE.name} home`}>
      <Image src={logo} alt="" priority className="h-7 w-auto" />
      {/* 16.5px puts the cap height level with the logo's letters at h-7; the gradient continues the logo's. */}
      <span
        className={cn(
          wordmark.className,
          "bg-gradient-to-r from-[#ff6c48] to-[#ff7d5e] bg-clip-text text-[16.5px] leading-none uppercase text-transparent",
        )}
      >
        Tools
      </span>
    </Link>
  );
}
