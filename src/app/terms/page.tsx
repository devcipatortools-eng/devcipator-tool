import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/Prose";
import { SITE } from "@/config/tools.config";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms for using ${SITE.name}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ProsePage title="Terms of Use">
      <p>
        {SITE.name} provides free file utilities that run in your browser. By using the site you agree to these terms.
      </p>
      <h2>Your content</h2>
      <p>
        You are responsible for the files you process. Only process files you own or have permission to use — in particular, only unlock
        or modify protected documents you are entitled to change.
      </p>
      <h2>No warranty</h2>
      <p>
        The tools are provided “as is”, without warranty of any kind. Always keep a copy of your original files. We are not liable for
        any loss of data or damages arising from the use of the tools.
      </p>
      <h2>Acceptable use</h2>
      <p>Do not use the site to infringe copyright, bypass protections you are not authorized to bypass, or break the law.</p>
    </ProsePage>
  );
}
