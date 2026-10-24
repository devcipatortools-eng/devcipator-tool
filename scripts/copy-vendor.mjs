// Copies browser runtime assets from node_modules into public/vendor so they are
// served from our own origin instead of a third-party CDN.
import { cpSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  ["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/vendor/pdfjs/pdf.worker.min.mjs"],
  ["node_modules/pdfjs-dist/cmaps", "public/vendor/pdfjs/cmaps"],
  ["node_modules/pdfjs-dist/standard_fonts", "public/vendor/pdfjs/standard_fonts"],
  ["node_modules/pdfjs-dist/wasm", "public/vendor/pdfjs/wasm"],
  ["node_modules/pdfjs-dist/iccs", "public/vendor/pdfjs/iccs"],
  // browser-image-compression's Web Worker loads its own library by URL (libURL).
  [
    "node_modules/browser-image-compression/dist/browser-image-compression.js",
    "public/vendor/browser-image-compression.js",
  ],
];

rmSync(join(root, "public/vendor"), { recursive: true, force: true });
for (const [from, to] of targets) {
  const src = join(root, from);
  if (!existsSync(src)) {
    console.warn(`[copy-vendor] missing ${from}, skipped`);
    continue;
  }
  mkdirSync(dirname(join(root, to)), { recursive: true });
  cpSync(src, join(root, to), { recursive: true });
}
console.log("[copy-vendor] done");
