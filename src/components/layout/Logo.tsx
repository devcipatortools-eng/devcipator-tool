import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/config/tools.config";
import logo from "../../../public/devcipator-logo.png";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold text-fg pointer-coarse:min-h-11" aria-label={`${SITE.name} home`}>
      <Image src={logo} alt="" priority className="h-7 w-auto" />
      <span className="text-[15px] font-normal tracking-tight text-fg-subtle">Tools</span>
    </Link>
  );
}
