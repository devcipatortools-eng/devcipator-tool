import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/Prose";
import { PAGE_SEO, SITE } from "@/config/tools.config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: PAGE_SEO.terms.title, description: PAGE_SEO.terms.description, path: "/terms", siteImage: true });

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
