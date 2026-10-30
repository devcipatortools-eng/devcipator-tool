# Devcipator Tools

25 free utility tools for PDFs, images, audio and everyday tasks — **100% client-side**.
Files are processed in the browser with Web APIs, Web Workers and WebAssembly and are never uploaded.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4 and Lucide icons.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also copies browser assets, see below)
npm run start      # serve the production build
npm run lint
npm run typecheck
```

`predev` / `prebuild` run `scripts/copy-vendor.mjs`, which copies the PDF.js worker, fonts/CMaps and the
`browser-image-compression` worker library into `public/vendor/` so everything is served from our own origin
(no third-party CDN). `public/vendor/` is git-ignored.

### Environment variables

All optional. `NEXT_PUBLIC_*` values are inlined at build time, so redeploy after changing them.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, e.g. `https://devcipator-tool.vercel.app`. On Vercel it defaults to the production domain. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Google Search Console "HTML tag" code (the `content` value only). |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing Webmaster Tools `msvalidate.01` code. |

## SEO

Titles, meta descriptions, keywords, FAQs and category copy all live in `src/config/tools.config.ts`. Keep tool
and category `seoTitle` at 40 characters or fewer (the layout appends “| Devcipator Tools”) and descriptions at
140–160 characters. Bump `SITE.updated` when copy changes so the sitemap's `lastmod` stays accurate.

## Tools

| Category  | Tools |
| --------- | ----- |
| PDF       | Merge, Split, Organize, Images → PDF, PDF → Images, Sign, Rotate, Add page numbers |
| Image     | Compress, Resize, Convert (JPG/PNG/WebP/BMP), Crop, Rotate & Flip, Watermark, Meme generator |
| Audio     | Cutter, Joiner, Speed changer (pitch lock), Volume booster / normalizer, Reverse |
| Utilities | QR code generator & scanner, Barcode generator, Word counter, Case converter, Colour picker |

Every tool has its own route: `/tools/<slug>` (e.g. `/tools/merge-pdf`).

## Project structure

```
src/
├─ app/                         # Routes (App Router)
│  ├─ page.tsx                  # Home: hero search, category tabs, tool grid, recent/popular
│  ├─ tools/[slug]/page.tsx     # Tool page: header, workspace, how-to, features, FAQ, related, JSON-LD
│  ├─ category/[category]/      # Category listing pages
│  ├─ privacy/, terms/          # Legal pages
│  └─ sitemap.ts, robots.ts
├─ config/tools.config.ts       # Single source of truth: metadata for all 25 tools
├─ tools/                       # One component per tool, grouped by category
│  ├─ registry.tsx              # slug → lazily loaded (code-split, client-only) component
│  ├─ document/  image/  audio/  utility/
├─ components/
│  ├─ tool/                     # ToolLayout, FileDropzone, ResultList, ProgressBar, SortableFileList…
│  ├─ layout/                   # Navbar, Footer, SearchDialog (Ctrl+K), ThemeToggle
│  ├─ home/  pdf/  image/  audio/  ui/
├─ hooks/                       # useProcessor, useFileList, usePdfDocument, usePdfMerge,
│                               # useImageCompressor, useAudioFile/Waveform/Player, useCopy…
├─ lib/
│  ├─ worker-rpc.ts             # Promise-based RPC with progress + cancellation for Web Workers
│  ├─ pdf/                      # pdf-lib worker API, PDF.js helpers, page-range parsing
│  ├─ image/                    # Canvas pipeline (crop/rotate/resize/encode, BMP encoder)
│  ├─ audio/                    # PCM ops, WSOLA time-stretch, WAV/MP3 encoders
│  ├─ text.ts, color.ts         # Word stats, case conversion, median-cut palette
└─ workers/                     # pdf.worker.ts, image.worker.ts, audio.worker.ts
```

### How a tool works

1. `ToolLayout` shows a `FileDropzone` (react-dropzone + type/size validation from `tools.config.ts`).
2. The tool renders a live preview (PDF thumbnails, canvas, waveform…) and a settings panel.
3. The primary action runs through `useProcessor`, which reports progress, supports cancel and collects
   results; `ResultList` offers one-click download (or a ZIP for several files, via JSZip + file-saver).

### Performance and memory

- Heavy work runs off the main thread: pdf-lib in `pdf.worker`, OffscreenCanvas in `image.worker`,
  time-stretching and MP3/WAV encoding in `audio.worker`, PDF parsing in the PDF.js worker, and image
  compression in browser-image-compression's worker. Buffers are *transferred*, not copied.
- Object URLs are revoked on change/unmount, `ImageBitmap`s are closed, PDF.js documents are destroyed,
  large canvases are released after each page, and audio playback stops when the route is hidden.

### Theming

All colours are OKLCH design tokens in `src/app/globals.css` with full light and dark palettes and a
per-category accent (PDF = coral, Image = teal, Audio = amber, Utilities = violet). The UI intentionally
has no animations or transitions.
