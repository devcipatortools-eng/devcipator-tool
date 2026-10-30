import type { Metadata } from "next";
import { ProsePage } from "@/components/layout/Prose";
import { PAGE_SEO, SITE } from "@/config/tools.config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: PAGE_SEO.privacy.title, description: PAGE_SEO.privacy.description, path: "/privacy", siteImage: true });

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy Policy">
      <p>
        {SITE.name} is built so that <strong>your files never leave your device</strong>. Every tool runs inside your browser using
        standard Web APIs and WebAssembly.
      </p>
      <h2>Files</h2>
      <p>
        Files you select are read into your browser&apos;s memory, processed locally and offered back to you as downloads. They are not
        uploaded, stored or logged by us. Closing the tab discards them.
      </p>
      <h2>Downloaded engines and models</h2>
      <p>
        Some tools download processing engines on first use — for example the FFmpeg audio engine or on-device image segmentation models.
        These are served from this website and cached by your browser. They contain no information about you.
      </p>
      <h2>Local storage</h2>
      <p>
        We store your theme preference and the list of tools you recently used in your browser&apos;s local storage so the site can show
        them to you. This data stays on your device and you can clear it at any time.
      </p>
      <h2>Contact</h2>
      <p>Questions about privacy can be raised through the project&apos;s repository.</p>
    </ProsePage>
  );
}
