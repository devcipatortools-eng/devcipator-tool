import Link from "next/link";
import { SITE } from "@/config/tools.config";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold text-fg pointer-coarse:min-h-11" aria-label={`${SITE.name} home`}>
      <span className="grid size-8 grid-cols-2 gap-0.5 rounded-lg bg-surface-3 p-1.5" aria-hidden>
        <span className="rounded-[3px] bg-doc" />
        <span className="rounded-[3px] bg-img" />
        <span className="rounded-[3px] bg-aud" />
        <span className="rounded-[3px] bg-utl" />
      </span>
      <span className="text-[15px] tracking-tight">
        Devcipator<span className="text-fg-subtle font-normal"> Tools</span>
      </span>
    </Link>
  );
}
