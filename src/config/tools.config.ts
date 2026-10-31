import type { LucideIcon } from "lucide-react";
import {
  AudioLines,
  Barcode,
  CaseSensitive,
  Combine,
  Crop,
  FileImage,
  FlipHorizontal,
  Gauge,
  Hash,
  ImageDown,
  Images,
  LayoutGrid,
  Laugh,
  ListMusic,
  Pipette,
  QrCode,
  RefreshCw,
  Rewind,
  RotateCw,
  Scaling,
  Scissors,
  Signature,
  Stamp,
  TextCursorInput,
  Volume2,
} from "lucide-react";

export type ToolCategory = "document" | "image" | "audio" | "utility";
export type ToolBadge = "Popular" | "New" | "Batch" | "Live";

export interface ToolFaq {
  q: string;
  a: string;
}

export interface ToolConfig {
  slug: string;
  /** Page H1 and card title; leads with the tool's main search phrase. */
  title: string;
  category: ToolCategory;
  icon: LucideIcon;
  badges: ToolBadge[];
  /** One-liner shown on cards. */
  description: string;
  /** Intro paragraph under the H1. Mentions that files stay on the device. */
  intro: string;
  /** <title> without the site name, which the root layout's template appends. At most 40 characters. */
  seoTitle: string;
  /** Meta and Open Graph description, 140–160 characters. */
  metaDescription: string;
  /** MIME types and/or extensions accepted by the dropzone. Empty for text-only tools. */
  accept: string[];
  /** Human readable list of accepted formats. */
  acceptLabel: string;
  maxSizeMB: number;
  multiple: boolean;
  /** Phrases people search for; also feeds the on-site search. */
  keywords: string[];
  steps: string[];
  features: string[];
  /** Tool-specific questions; the shared privacy and pricing ones are added by `toolFaqs`. */
  faqs: ToolFaq[];
  /** Listed first under "Related tools"; may point to other categories. */
  related: string[];
}

export interface CategoryConfig {
  id: ToolCategory;
  label: string;
  /** Section heading, e.g. "PDF tools" ("Utility tools", not "Utilities tools"). */
  title: string;
  tagline: string;
  /** <title> without the site name. At most 40 characters. */
  seoTitle: string;
  /** 140–160 characters. */
  metaDescription: string;
  /** schema.org applicationCategory for the category's tools. */
  applicationCategory: string;
  aboutTitle: string;
  /** 150–250 words of copy shown under the tool grid. */
  about: string[];
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "document",
    label: "PDF",
    title: "PDF tools",
    tagline: "Merge, split, sign, organize and convert PDFs.",
    seoTitle: "Free PDF Tools – Merge, Split, Sign",
    metaDescription: "Free online PDF tools to merge, split, sign, rotate, organize and number PDFs, or convert them to and from images. No upload: files stay on your device.",
    applicationCategory: "BusinessApplication",
    aboutTitle: "Edit PDFs without uploading them",
    about: [
      "Most online PDF tools send your document to a server, process it there and send it back. These don't. Merging, splitting, signing and converting all happen inside your browser using pdf-lib and Mozilla's PDF.js, so contracts, invoices and ID scans never leave your device. There is no account to create and no watermark on the result.",
      "Use Merge PDF to combine several files into one, and Split PDF or Organize PDF to pull out, reorder or delete pages. Rotate PDF fixes sideways scans, Add Page Numbers stamps “Page 1 of 10” style numbers, and Sign PDF lets you draw or upload a signature and place it on any page.",
      "To move between formats, Images to PDF turns JPG and PNG photos into a paginated document, and PDF to Images exports pages as PNG or JPG at up to 300 DPI. Page operations copy the original content rather than re-rendering it, so text stays sharp and searchable.",
    ],
  },
  {
    id: "image",
    label: "Image",
    title: "Image tools",
    tagline: "Compress, resize, crop, convert and edit images.",
    seoTitle: "Free Image Tools – Compress & Resize",
    metaDescription: "Compress, resize, crop, convert, rotate and watermark images online for free, or make a meme. JPG, PNG and WebP are processed on your device, never uploaded.",
    applicationCategory: "MultimediaApplication",
    aboutTitle: "Edit images privately in your browser",
    about: [
      "Photos often show more than you mean to share: faces, documents, the inside of your home. These image tools work on your device using the browser's Canvas API and background Web Workers, so nothing is uploaded and large batches don't freeze the page.",
      "Compress Image shrinks JPG, PNG and WebP files to a target size with a before-and-after slider, which is handy for email attachments and upload forms with a size limit. Resize Image sets exact pixel dimensions or a percentage, Crop Image trims to presets like 1:1 or 16:9, and Rotate & Flip Image fixes sideways or mirrored shots.",
      "Image Converter switches between JPG, PNG, WebP and BMP, a whole batch at a time. Watermark Image adds a text or logo watermark to protect your work, and Meme Generator puts classic bold captions on any picture. Everything is free, with no sign-up and no branding of ours added to your images.",
    ],
  },
  {
    id: "audio",
    label: "Audio",
    title: "Audio tools",
    tagline: "Cut, join, speed up, boost and reverse audio.",
    seoTitle: "Free Audio Tools – Cut, Join & Boost MP3",
    metaDescription: "Cut, join, speed up, slow down, reverse and boost MP3, WAV and other audio files for free. Audio is processed in your browser and never uploaded anywhere.",
    applicationCategory: "MultimediaApplication",
    aboutTitle: "Edit audio without installing anything",
    about: [
      "These audio tools decode your file with the browser's Web Audio API, edit it on your device and encode the result as MP3 or WAV. There's no software to install and no upload queue, and recordings such as voice memos, interviews or lectures stay private.",
      "Audio Cutter trims a song or recording on a visual waveform with fade in and fade out, which also makes it a quick ringtone maker. Audio Joiner combines several tracks into one with an optional gap or crossfade, even when they use different formats or sample rates.",
      "Audio Speed Changer speeds up or slows down audio between 0.5x and 2x, with pitch lock so voices keep their natural tone. Volume Booster makes quiet recordings louder with a limiter that prevents clipping, or normalizes the peak level. Reverse Audio plays any file backwards for sound design and effects. All five tools are free, need no sign-up and add no watermark or jingle to your audio.",
    ],
  },
  {
    id: "utility",
    label: "Utilities",
    title: "Utility tools",
    tagline: "QR codes, barcodes, text and colour tools.",
    seoTitle: "Free QR, Barcode & Text Tools Online",
    metaDescription: "Free QR code generator and scanner, barcode maker, word counter, case converter and colour picker. Everything runs in your browser, with no sign-up needed.",
    applicationCategory: "UtilitiesApplication",
    aboutTitle: "Everyday tools that respect your privacy",
    about: [
      "Small jobs deserve fast tools. These utilities open instantly, need no account and handle everything in your browser, so the links, Wi-Fi passwords and text you enter are never sent to a server.",
      "The QR Code Generator creates codes for links, plain text, Wi-Fi networks, email and phone numbers, with custom colours and PNG or SVG download. The codes contain your data directly, so they never expire, and the same tool can scan a QR code from a screenshot or photo. The Barcode Generator makes Code128, EAN-13, UPC-A and other retail and shipping barcodes ready to print.",
      "For writing, the Word & Character Counter tracks words, characters, sentences and reading time as you type, and the Case Converter switches text between UPPERCASE, Title Case, camelCase, snake_case and more. The Color Picker from Image finds the exact HEX, RGB or HSL value of any pixel and builds a palette from your picture.",
    ],
  },
];

const PDF = ["application/pdf", ".pdf"];
const IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/avif", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif"];
const AUDIO = ["audio/*", ".mp3", ".wav", ".ogg", ".oga", ".flac", ".aac", ".m4a", ".opus", ".webm"];
const IMAGE_LABEL = "JPG, PNG, WebP, GIF, BMP, AVIF";
const AUDIO_LABEL = "MP3, WAV, OGG, FLAC, AAC, M4A";

export const TOOLS: ToolConfig[] = [
  // ───────────────────────────── PDF ─────────────────────────────
  {
    slug: "merge-pdf",
    title: "Merge PDF",
    category: "document",
    icon: Combine,
    badges: ["Popular", "Batch"],
    description: "Combine multiple PDFs into a single file in any order.",
    intro: "Combine PDF files into one document in seconds. Drag them into the order you want, and every page keeps its original quality. Merging happens in your browser, so your PDFs are never uploaded.",
    seoTitle: "Merge PDF Files Online Free – No Upload",
    metaDescription: "Combine multiple PDF files into one in seconds. Drag to reorder and merge for free, with no sign-up and no watermark. Your PDFs never leave your device.",
    accept: PDF,
    acceptLabel: "PDF",
    maxSizeMB: 200,
    multiple: true,
    keywords: ["merge pdf", "merge pdf free", "combine pdf files", "combine pdf", "join pdf files", "pdf merger", "combine multiple pdfs into one", "merge pdf without uploading"],
    steps: ["Add two or more PDFs.", "Drag the files into the order you want.", "Merge and download the combined PDF."],
    features: ["Unlimited number of files", "Drag-and-drop ordering", "Lossless: pages are copied, not re-rendered", "Live page count per file"],
    faqs: [
      { q: "How do I combine multiple PDF files into one?", a: "Add your PDFs, drag them into the order you want, then press Merge. The combined file downloads straight away, with every page copied exactly as it was." },
      { q: "Is there a limit on how many PDFs I can merge?", a: "There is no set number of files. Each PDF can be up to 200 MB; beyond that, the limit is your device's memory, since the merge runs in your browser." },
      { q: "Can I merge password-protected PDFs?", a: "No. Encrypted PDFs are flagged in the list; remove the password in your PDF reader first." },
    ],
    related: ["split-pdf", "organize-pdf", "images-to-pdf"],
  },
  {
    slug: "split-pdf",
    title: "Split PDF",
    category: "document",
    icon: Scissors,
    badges: [],
    description: "Extract page ranges or split every page into its own file.",
    intro: "Split a PDF by custom page ranges such as “1-3, 5”, into fixed-size chunks, or into single pages, with live thumbnails of what goes where. The file is split on your device and never uploaded.",
    seoTitle: "Split PDF – Extract Pages Online Free",
    metaDescription: "Split a PDF by page ranges, into equal chunks or into single pages, with live thumbnails. Free, no sign-up, and your file is processed on your own device.",
    accept: PDF,
    acceptLabel: "PDF",
    maxSizeMB: 200,
    multiple: false,
    keywords: ["split pdf", "split pdf free", "extract pages from pdf", "separate pdf pages", "split pdf into multiple files", "pdf splitter", "extract one page from pdf"],
    steps: ["Drop a PDF to see its page thumbnails.", "Type page ranges (e.g. 1-3, 5), or choose every N pages or all pages.", "Split and download the parts or a ZIP."],
    features: ["Thumbnail preview of every part", "Custom range syntax", "Fixed chunk size", "ZIP download for many parts"],
    faqs: [
      { q: "How do I write page ranges?", a: "Separate ranges with commas. Each range becomes one file: “1-3, 5, 7-9” produces three PDFs. “8-” means page 8 to the end." },
      { q: "How do I extract a single page from a PDF?", a: "Type the page number in the ranges box, for example “4”, and split. You get a new PDF containing just that page." },
      { q: "Can I split a PDF into individual pages?", a: "Yes. Choose all pages to save every page as its own PDF; when there are many parts they are bundled into one ZIP download." },
    ],
    related: ["merge-pdf", "organize-pdf", "pdf-to-images"],
  },
  {
    slug: "organize-pdf",
    title: "Organize PDF",
    category: "document",
    icon: LayoutGrid,
    badges: [],
    description: "Reorder or delete PDF pages on a thumbnail grid.",
    intro: "See every page of your PDF as a thumbnail. Drag to reorder, delete the pages you do not need and save a new PDF. Everything runs locally, so the document never leaves your device.",
    seoTitle: "Reorder & Delete PDF Pages Online Free",
    metaDescription: "Rearrange PDF pages by drag and drop and delete the ones you don't need, on a live thumbnail grid. Free and lossless, with no upload: files stay on your device.",
    accept: PDF,
    acceptLabel: "PDF",
    maxSizeMB: 200,
    multiple: false,
    keywords: ["organize pdf", "reorder pdf pages", "rearrange pdf pages", "delete pages from pdf", "remove pages from pdf", "change page order in pdf", "pdf page organizer"],
    steps: ["Drop a PDF to load page thumbnails.", "Drag pages to reorder and delete the ones you don’t need.", "Save and download the reorganized PDF."],
    features: ["Live page thumbnails", "Drag-and-drop or arrow reordering", "Delete and restore pages", "Lossless page copying"],
    faqs: [
      { q: "How do I rearrange pages in a PDF?", a: "Drop the PDF, then drag the page thumbnails into the new order or use the arrow buttons. Save, and the PDF downloads with its pages in that order." },
      { q: "How do I delete pages from a PDF?", a: "Click the delete button on each page you want to remove. Deleted pages can be restored until you save." },
      { q: "Is quality reduced?", a: "No. Pages are copied as-is into the new file; nothing is re-rendered." },
    ],
    related: ["rotate-pdf", "split-pdf", "merge-pdf"],
  },
  {
    slug: "images-to-pdf",
    title: "Images to PDF",
    category: "document",
    icon: Images,
    badges: ["Popular", "Batch"],
    description: "Combine JPG and PNG images into one PDF.",
    intro: "Turn photos, scans and screenshots into a single, properly paginated PDF. Reorder pages and choose page size, orientation and margins. Images are converted in your browser and never uploaded.",
    seoTitle: "JPG to PDF – Convert Images to PDF Free",
    metaDescription: "Convert JPG, PNG and other images to one PDF. Reorder pages and pick A4, Letter or fit-to-image size and margins. Free, no upload: images stay on your device.",
    accept: IMAGES,
    acceptLabel: IMAGE_LABEL,
    maxSizeMB: 50,
    multiple: true,
    keywords: ["jpg to pdf", "image to pdf", "png to pdf", "convert jpg to pdf free", "photos to pdf", "combine images into one pdf", "convert pictures to pdf", "multiple images to pdf"],
    steps: ["Add your images.", "Drag to reorder; choose page size, orientation and margins.", "Create the PDF and download it."],
    features: ["Fit-to-image, A4 or Letter pages", "Portrait, landscape or automatic orientation", "JPG and PNG embedded without re-encoding", "EXIF rotation respected"],
    faqs: [
      { q: "How do I convert multiple JPGs into one PDF?", a: "Add all the images at once, drag them into order and create the PDF. Each image becomes one page of the same document." },
      { q: "Is image quality reduced?", a: "No. JPG and PNG files are embedded as-is; other formats are converted losslessly to PNG." },
      { q: "Which page size should I choose?", a: "Fit to image keeps each page the exact shape of its photo. Choose A4 or Letter when the PDF will be printed or submitted as a document." },
    ],
    related: ["pdf-to-images", "merge-pdf", "image-converter", "compress-image"],
  },
  {
    slug: "pdf-to-images",
    title: "PDF to Images",
    category: "document",
    icon: FileImage,
    badges: ["New"],
    description: "Export every PDF page as a high-resolution PNG or JPG.",
    intro: "Render each page of a PDF at up to 300 DPI and download the pages as PNG or JPG images, bundled into a ZIP. The PDF is rendered on your device, so it is never uploaded.",
    seoTitle: "PDF to JPG – Convert PDF to Images Free",
    metaDescription: "Convert PDF pages to high-quality JPG or PNG images at up to 300 DPI, for all pages or a range, downloaded as a ZIP. Free, and your PDF is never uploaded.",
    accept: PDF,
    acceptLabel: "PDF",
    maxSizeMB: 200,
    multiple: false,
    keywords: ["pdf to jpg", "pdf to png", "pdf to image", "convert pdf to jpg free", "pdf to jpg high quality", "save pdf page as image", "pdf to image converter"],
    steps: ["Drop a PDF.", "Pick the format, resolution and which pages to export.", "Convert and download a ZIP of images."],
    features: ["72–300 DPI output", "PNG or JPG with quality control", "Export all pages or a range", "ZIP download"],
    faqs: [
      { q: "Which DPI should I use?", a: "150 DPI is good for screens, 300 DPI for printing. Higher DPI means larger files." },
      { q: "Can I convert only one page of a PDF to JPG?", a: "Yes. Enter a page range such as “3” or “2-5” and only those pages are exported." },
      { q: "Should I choose PNG or JPG?", a: "JPG gives smaller files and suits photos and scans. PNG is lossless and keeps text and line art crisp, at a larger file size." },
    ],
    related: ["images-to-pdf", "split-pdf", "compress-image", "image-converter"],
  },
  {
    slug: "sign-pdf",
    title: "Sign PDF",
    category: "document",
    icon: Signature,
    badges: ["Popular"],
    description: "Draw or upload a signature and place it on any page.",
    intro: "Draw your signature with a mouse, trackpad or finger — or upload an image of it — then drag and resize it onto any page and save a signed PDF. The document and your signature stay on your device.",
    seoTitle: "Sign PDF Online Free – Add a Signature",
    metaDescription: "Draw or upload your signature and place it anywhere on a PDF. Sign documents for free with no account and no watermark, and without uploading the file.",
    accept: PDF,
    acceptLabel: "PDF",
    maxSizeMB: 100,
    multiple: false,
    keywords: ["sign pdf", "sign pdf online free", "add signature to pdf", "electronic signature pdf", "e-sign pdf", "sign a pdf without printing", "draw signature on pdf"],
    steps: ["Drop the PDF to sign.", "Draw or upload your signature, then drag and resize it on the page.", "Apply and download the signed PDF."],
    features: ["Smooth signature pad with pen colours", "Upload a signature image (transparent PNG works best)", "Drag to position, handle to resize", "Place on several pages"],
    faqs: [
      { q: "How do I sign a PDF without printing it?", a: "Drop the PDF here, draw your signature with a mouse, trackpad or finger, then drag it into place and download the signed file. No printer or scanner needed." },
      { q: "Can I sign more than one page?", a: "Yes. Place the signature on as many pages as you need before applying." },
      { q: "Is this a legally binding digital signature?", a: "It adds a visual signature image. It does not add a cryptographic certificate-based signature, so check what the recipient requires for formal contracts." },
    ],
    related: ["add-page-numbers", "organize-pdf", "merge-pdf"],
  },
  {
    slug: "rotate-pdf",
    title: "Rotate PDF",
    category: "document",
    icon: RotateCw,
    badges: [],
    description: "Rotate individual pages or all pages by 90°, 180° or 270°.",
    intro: "Fix sideways or upside-down pages. Rotate pages one by one from the thumbnail grid or all at once. Your PDF is processed in the browser and never leaves your device.",
    seoTitle: "Rotate PDF Pages Online Free",
    metaDescription: "Rotate one PDF page or all of them by 90°, 180° or 270° and save the result permanently. Free and lossless, with no upload: your PDF stays on your device.",
    accept: PDF,
    acceptLabel: "PDF",
    maxSizeMB: 200,
    multiple: false,
    keywords: ["rotate pdf", "rotate pdf pages", "rotate pdf and save", "rotate pdf free", "turn pdf sideways", "fix upside down pdf", "rotate one page in pdf"],
    steps: ["Drop a PDF.", "Rotate single pages or all pages by 90°, 180° or 270°.", "Save and download."],
    features: ["Per-page rotation", "Rotate all pages at once", "Live thumbnails", "Lossless — rotation is a page attribute"],
    faqs: [
      { q: "Will the rotation be saved permanently?", a: "Yes. The downloaded PDF stores the new orientation, so it opens the right way up in any viewer." },
      { q: "Can I rotate just one page?", a: "Yes. Use the rotate buttons on a single thumbnail, or rotate every page at once." },
      { q: "Does rotating reduce quality?", a: "No. Rotation is stored as a page attribute; the content is not re-rendered." },
    ],
    related: ["organize-pdf", "split-pdf", "add-page-numbers"],
  },
  {
    slug: "add-page-numbers",
    title: "Add Page Numbers",
    category: "document",
    icon: Hash,
    badges: [],
    description: "Stamp “Page X of Y” style numbers onto a PDF.",
    intro: "Number the pages of a PDF with a custom format, font size, position and starting number. The numbers are stamped in your browser, so the file is never uploaded.",
    seoTitle: "Add Page Numbers to PDF Online Free",
    metaDescription: "Number PDF pages with formats like “Page 1 of 10”, in six positions, any font size and a custom starting number. Free, with no upload: processed on your device.",
    accept: PDF,
    acceptLabel: "PDF",
    maxSizeMB: 200,
    multiple: false,
    keywords: ["add page numbers to pdf", "number pdf pages", "insert page numbers in pdf", "pdf page numbering", "page x of y pdf", "add page numbers to pdf free"],
    steps: ["Drop a PDF.", "Choose the format, position, size and first page.", "Apply and download the numbered PDF."],
    features: ["Formats like “Page {n} of {total}” or “{n}”", "Six positions (top/bottom × left/centre/right)", "Font size, colour and margin", "Skip the first page(s)"],
    faqs: [
      { q: "Can I use the “Page 1 of 10” format?", a: "Yes. Use the format “Page {n} of {total}”, or just “{n}” for plain numbers." },
      { q: "Can I skip the cover page?", a: "Yes. Choose which page to start stamping from, and the pages before it are left unnumbered." },
      { q: "Can I start numbering at a different number?", a: "Yes. Set the starting number and choose which page to start stamping from." },
    ],
    related: ["sign-pdf", "merge-pdf", "rotate-pdf"],
  },

  // ───────────────────────────── Image ─────────────────────────────
  {
    slug: "compress-image",
    title: "Compress Image",
    category: "image",
    icon: ImageDown,
    badges: ["Popular", "Batch"],
    description: "Shrink JPG, PNG and WebP with a live before/after preview.",
    intro: "Reduce image file size with a target size and quality slider, and compare the result against the original before downloading. Compression runs on your device, so your photos are never uploaded.",
    seoTitle: "Compress Image Online – JPG, PNG, WebP",
    metaDescription: "Reduce image file size without visible quality loss. Set a target size in KB, compare before and after, and batch-compress JPG, PNG and WebP with no upload.",
    accept: IMAGES,
    acceptLabel: IMAGE_LABEL,
    maxSizeMB: 50,
    multiple: true,
    keywords: ["compress image", "compress jpg", "compress png", "reduce image size", "compress image to 100kb", "compress jpg online without losing quality", "image size reducer", "reduce photo file size", "image compressor"],
    steps: ["Add one or more images.", "Set the maximum file size, quality and output format.", "Compare before/after and download."],
    features: ["Target maximum size in KB/MB", "Quality slider with live preview", "Draggable before/after comparison", "Runs in a Web Worker"],
    faqs: [
      { q: "How do I compress an image to 100 KB?", a: "Set the maximum size to 100 KB and compress. The quality is lowered step by step until the file fits under the limit." },
      { q: "Will compression reduce image quality?", a: "Lossy formats trade a little detail for size, but at 75–85% quality the difference is hard to see. Use the before/after slider to check before you download." },
      { q: "Which format compresses best?", a: "WebP is usually 25–35% smaller than JPG at the same visual quality. PNG is best for graphics with flat colours." },
    ],
    related: ["resize-image", "image-converter", "crop-image", "images-to-pdf"],
  },
  {
    slug: "resize-image",
    title: "Resize Image",
    category: "image",
    icon: Scaling,
    badges: ["Batch"],
    description: "Scale images by exact pixels or percentage.",
    intro: "Resize one or many images to exact pixel dimensions or by percentage, with an aspect-ratio lock and high-quality resampling. Images are resized in your browser and stay on your device.",
    seoTitle: "Resize Image Online – Change Pixel Size",
    metaDescription: "Resize images to exact pixels or by percentage, with aspect-ratio lock and social media presets. Batch resize JPG, PNG and WebP for free, with no upload.",
    accept: IMAGES,
    acceptLabel: IMAGE_LABEL,
    maxSizeMB: 50,
    multiple: true,
    keywords: ["resize image", "resize image online", "change image size", "resize image to specific pixels", "resize photo", "image resizer", "resize image for instagram", "batch resize images"],
    steps: ["Add your images.", "Set width and height in pixels or a percentage.", "Resize and download."],
    features: ["Pixel or percentage mode", "Aspect ratio lock", "Social media size presets", "High-quality multi-step downscaling"],
    faqs: [
      { q: "How do I resize an image without distorting it?", a: "Keep the aspect-ratio lock on: when you change the width, the height follows automatically so nothing gets stretched." },
      { q: "Can I resize many images at once?", a: "Yes. Add several images and the same width, height or percentage is applied to each one." },
      { q: "Will enlarging make images sharper?", a: "No. Upscaling cannot add detail that is not in the original; it will look softer." },
    ],
    related: ["crop-image", "compress-image", "image-converter"],
  },
  {
    slug: "image-converter",
    title: "Image Converter",
    category: "image",
    icon: RefreshCw,
    badges: ["Batch"],
    description: "Convert images between JPG, PNG, WebP and BMP.",
    intro: "Convert any browser-readable image to JPG, PNG, WebP or BMP in bulk, with quality control and a background fill for transparent images. Conversion happens locally, with no upload.",
    seoTitle: "Image Converter – PNG, JPG, WebP Free",
    metaDescription: "Convert images between JPG, PNG, WebP and BMP in bulk: PNG to JPG, WebP to JPG, SVG to PNG and more. Free, with quality control and no upload to a server.",
    accept: [...IMAGES, "image/svg+xml", ".svg"],
    acceptLabel: `${IMAGE_LABEL}, SVG`,
    maxSizeMB: 50,
    multiple: true,
    keywords: ["image converter", "png to jpg", "webp to jpg", "webp to png", "jpg to png", "svg to png", "convert image to jpg", "image format converter"],
    steps: ["Add images in any common format.", "Pick JPG, PNG, WebP or BMP and the quality.", "Convert and download one by one or as a ZIP."],
    features: ["JPG, PNG, WebP and BMP output", "Quality control for lossy formats", "Background colour for transparency", "ZIP download for batches"],
    faqs: [
      { q: "How do I convert WebP to JPG?", a: "Add the WebP files, choose JPG as the output format, set the quality and convert. Download each file or all of them as a ZIP." },
      { q: "Which format should I choose?", a: "JPG for photos you want to share, PNG for screenshots, graphics and anything with transparency, and WebP for the smallest files on the web." },
      { q: "What happens to transparency when converting to JPG or BMP?", a: "Those formats are saved without transparency, so transparent pixels are filled with the background colour you choose." },
    ],
    related: ["compress-image", "resize-image", "images-to-pdf"],
  },
  {
    slug: "crop-image",
    title: "Crop Image",
    category: "image",
    icon: Crop,
    badges: [],
    description: "Crop with an interactive box and aspect presets.",
    intro: "Drag a bounding box to crop your image, or lock it to aspect ratios like 1:1, 16:9 and 4:3. The image is cropped on your device and never uploaded.",
    seoTitle: "Crop Image Online Free – Aspect Presets",
    metaDescription: "Crop photos with a draggable box or exact pixel values, and lock to 1:1, 4:3, 16:9 or 9:16. Free, at full resolution, and your image never leaves your device.",
    accept: IMAGES,
    acceptLabel: IMAGE_LABEL,
    maxSizeMB: 50,
    multiple: false,
    keywords: ["crop image", "crop image online", "crop photo", "image cropper", "crop image to square", "crop picture", "crop image 16:9"],
    steps: ["Drop an image.", "Drag the crop box or pick an aspect preset.", "Crop and download."],
    features: ["Draggable, resizable crop box", "1:1, 4:3, 16:9, 9:16 and free presets", "Exact pixel inputs", "Rule-of-thirds guides"],
    faqs: [
      { q: "How do I crop an image to a square?", a: "Pick the 1:1 preset, drag the box over the part you want to keep, then crop and download." },
      { q: "Can I crop to exact pixel dimensions?", a: "Yes. Type the position, width and height in pixels and the crop box follows." },
      { q: "Is the crop applied at full resolution?", a: "Yes. The preview is scaled down, but the crop is applied to the original pixels." },
    ],
    related: ["resize-image", "rotate-flip-image", "meme-generator"],
  },
  {
    slug: "rotate-flip-image",
    title: "Rotate & Flip Image",
    category: "image",
    icon: FlipHorizontal,
    badges: ["Batch"],
    description: "Rotate 90° either way and flip horizontally or vertically.",
    intro: "Fix sideways photos and mirror images. Rotate in 90° steps and flip horizontally or vertically, for one image or a batch. Your photos are processed in the browser and stay on your device.",
    seoTitle: "Rotate & Flip Image Online Free",
    metaDescription: "Rotate images 90° left or right and flip or mirror them horizontally or vertically. Works on one photo or a whole batch, free and with no upload to any server.",
    accept: IMAGES,
    acceptLabel: IMAGE_LABEL,
    maxSizeMB: 50,
    multiple: true,
    keywords: ["rotate image", "flip image", "mirror image", "rotate photo", "flip image horizontally", "mirror image online", "rotate image 90 degrees"],
    steps: ["Add images.", "Rotate and flip using the controls.", "Apply and download."],
    features: ["Rotate clockwise or counter-clockwise", "Horizontal and vertical flip", "Applies to every image in a batch", "Lossless with PNG output"],
    faqs: [
      { q: "How do I mirror an image?", a: "Flip it horizontally to mirror it left to right, or vertically to turn it upside down, then download." },
      { q: "Can I rotate several photos at once?", a: "Yes. The rotation and flip you choose are applied to every image you add." },
      { q: "Does rotating JPG lose quality?", a: "The image is re-encoded at high quality (95%). Choose PNG output for a fully lossless result." },
    ],
    related: ["crop-image", "resize-image", "image-converter", "rotate-pdf"],
  },
  {
    slug: "watermark-image",
    title: "Watermark Image",
    category: "image",
    icon: Stamp,
    badges: ["Batch"],
    description: "Add text or logo watermarks with opacity and position.",
    intro: "Protect your images with a text or logo watermark. Control opacity, size, rotation and position, or tile it across the whole image. Watermarks are applied on your device, so originals are never uploaded.",
    seoTitle: "Add Watermark to Photos Online Free",
    metaDescription: "Add a text or logo watermark to photos with control over opacity, size, rotation and position, or tile it. Batch watermark images for free, with no upload.",
    accept: IMAGES,
    acceptLabel: IMAGE_LABEL,
    maxSizeMB: 50,
    multiple: true,
    keywords: ["watermark image", "add watermark to photo", "add logo to photo", "watermark photos free", "batch watermark images", "text watermark", "transparent watermark"],
    steps: ["Add the images to watermark.", "Type text or upload a logo, then set position, opacity and size.", "Apply and download."],
    features: ["Text or image watermarks", "9-point placement or tiled pattern", "Opacity, size and rotation controls", "Applied to every image in the batch"],
    faqs: [
      { q: "How do I add my logo as a watermark?", a: "Switch to an image watermark and upload your logo (a transparent PNG gives the cleanest result), then set its size, opacity and position." },
      { q: "Does the watermark scale with image size?", a: "Yes. Size is relative to each image's width, so it looks consistent across a batch." },
      { q: "Do you add your own watermark too?", a: "No. Only the watermark you design is added; we never stamp our own branding on your images." },
    ],
    related: ["meme-generator", "compress-image", "resize-image", "sign-pdf"],
  },
  {
    slug: "meme-generator",
    title: "Meme Generator",
    category: "image",
    icon: Laugh,
    badges: [],
    description: "Add classic top and bottom Impact captions to any image.",
    intro: "Create memes with bold Impact captions and a black outline at the top and bottom of any image. Your picture is never uploaded: the meme is drawn right in your browser.",
    seoTitle: "Meme Generator – Make a Meme Free",
    metaDescription: "Make a meme from any image with classic bold top and bottom captions. Free, with no watermark and no sign-up, and your picture is never uploaded to a server.",
    accept: IMAGES,
    acceptLabel: IMAGE_LABEL,
    maxSizeMB: 20,
    multiple: false,
    keywords: ["meme generator", "meme maker", "make a meme", "meme generator no watermark", "add text to image", "caption image", "impact font meme"],
    steps: ["Drop an image.", "Type the top and bottom text and style it.", "Download your meme."],
    features: ["Impact font with black outline", "Automatic line wrapping", "Font size, fill and outline colour", "Uppercase toggle"],
    faqs: [
      { q: "What font do memes use?", a: "The classic meme font is Impact in white with a black outline. The generator uses Impact where it's installed and a matching bold font elsewhere." },
      { q: "Can I use my own picture?", a: "Yes. Drop any photo or screenshot in JPG, PNG, WebP, GIF, BMP or AVIF format and add your captions on top." },
      { q: "Is there a watermark on my meme?", a: "No. Nothing is added beyond your text." },
    ],
    related: ["watermark-image", "crop-image", "resize-image"],
  },

  // ───────────────────────────── Audio ─────────────────────────────
  {
    slug: "audio-cutter",
    title: "Audio Cutter",
    category: "audio",
    icon: AudioLines,
    badges: ["Popular"],
    description: "Trim audio on a waveform with draggable handles.",
    intro: "Cut a section out of any song or recording. Drag the start and end handles on the waveform, preview the selection and export it as WAV or MP3. The audio is edited on your device and never uploaded.",
    seoTitle: "Audio Cutter – Cut MP3 Online Free",
    metaDescription: "Cut MP3 and other audio files on a waveform, add a fade in and fade out, and export as MP3 or WAV. Make ringtones for free; your audio is never uploaded.",
    accept: AUDIO,
    acceptLabel: AUDIO_LABEL,
    maxSizeMB: 200,
    multiple: false,
    keywords: ["audio cutter", "mp3 cutter", "cut mp3 online", "trim audio", "cut audio online", "ringtone maker", "mp3 trimmer", "cut a song"],
    steps: ["Drop an audio file.", "Drag the handles or type exact times, then preview.", "Export the selection as MP3 or WAV."],
    features: ["Waveform with dual handles", "Keep or remove the selection", "Fade in and fade out", "MP3 or WAV export"],
    faqs: [
      { q: "How do I cut part of a song?", a: "Drop the file, drag the start and end handles around the part you want (or type exact times), preview it and export." },
      { q: "Can I make a ringtone?", a: "Yes. Select up to 30 seconds, add a short fade and export as MP3." },
      { q: "Which formats can I cut?", a: "MP3, WAV, OGG, FLAC, AAC, M4A and other formats your browser can play. The result is saved as MP3 or WAV." },
    ],
    related: ["audio-joiner", "volume-booster", "reverse-audio"],
  },
  {
    slug: "audio-joiner",
    title: "Audio Joiner",
    category: "audio",
    icon: ListMusic,
    badges: ["Batch"],
    description: "Join multiple tracks into one, in any order.",
    intro: "Combine several audio files into a single track in any order, with an optional gap or crossfade between them. Tracks are joined in your browser, so they stay on your device.",
    seoTitle: "Audio Joiner – Merge MP3 Files Online",
    metaDescription: "Join MP3, WAV and other audio files into one track in any order, with a gap or crossfade between songs. Free and without sign-up, processed on your device.",
    accept: AUDIO,
    acceptLabel: AUDIO_LABEL,
    maxSizeMB: 200,
    multiple: true,
    keywords: ["audio joiner", "merge mp3", "join mp3 files", "combine audio files", "merge audio online", "mp3 merger", "combine songs into one"],
    steps: ["Add two or more audio files.", "Reorder them and set a gap or crossfade.", "Join and download."],
    features: ["Drag-and-drop track order", "Gap or crossfade between tracks", "Mixed formats and sample rates", "MP3 or WAV export"],
    faqs: [
      { q: "How do I combine songs into one file?", a: "Add the tracks, drag them into order, choose a gap or crossfade, then join and download a single MP3 or WAV." },
      { q: "Can I add a crossfade between tracks?", a: "Yes. Set a crossfade so each track blends into the next, or a gap for silence between them." },
      { q: "Can I join files with different formats?", a: "Yes. Every file is decoded to the same sample rate before joining." },
    ],
    related: ["audio-cutter", "volume-booster", "audio-speed", "merge-pdf"],
  },
  {
    slug: "audio-speed",
    title: "Audio Speed Changer",
    category: "audio",
    icon: Gauge,
    badges: [],
    description: "Change speed from 0.5x to 2x without changing pitch.",
    intro: "Speed up or slow down audio between 0.5x and 2.0x. Pitch lock keeps voices and instruments in their original key. Processing happens on your device, with no upload.",
    seoTitle: "Change Audio Speed Online – Keep Pitch",
    metaDescription: "Speed up or slow down audio from 0.5x to 2x with optional pitch lock, so voices don't sound like chipmunks. Free MP3 or WAV export, with no upload needed.",
    accept: AUDIO,
    acceptLabel: AUDIO_LABEL,
    maxSizeMB: 200,
    multiple: false,
    keywords: ["change audio speed", "speed up audio", "slow down audio", "slow down mp3", "speed up mp3", "change tempo without changing pitch", "audio speed changer"],
    steps: ["Drop an audio file.", "Set the speed and choose whether to keep the pitch.", "Process and download."],
    features: ["0.5x – 2.0x in 0.05 steps", "Pitch lock (time-stretch) in a Web Worker", "Instant preview of the setting", "MP3 or WAV export"],
    faqs: [
      { q: "How do I slow down a song without changing the pitch?", a: "Set the speed below 1.0x and keep pitch lock on. The tempo slows while the key stays the same." },
      { q: "Can I speed up a podcast or lecture?", a: "Yes. Speeds of 1.25x–1.5x with pitch lock keep speech clear while saving time." },
      { q: "What is pitch lock?", a: "With pitch lock the tempo changes but the key stays the same. Without it, faster audio also sounds higher, like a tape machine." },
    ],
    related: ["audio-cutter", "volume-booster", "reverse-audio"],
  },
  {
    slug: "volume-booster",
    title: "Volume Booster",
    category: "audio",
    icon: Volume2,
    badges: [],
    description: "Boost gain up to 300% or normalize, with a peak limiter.",
    intro: "Make quiet recordings louder. Boost volume up to 300% with a limiter that prevents clipping, or normalize the peak level. Your recording is processed locally and never uploaded.",
    seoTitle: "Volume Booster – Make Audio Louder Free",
    metaDescription: "Increase the volume of MP3 and other audio up to 300% with a limiter that prevents clipping, or normalize the peak level. Free and private, with no upload.",
    accept: AUDIO,
    acceptLabel: AUDIO_LABEL,
    maxSizeMB: 200,
    multiple: false,
    keywords: ["volume booster", "increase audio volume", "make mp3 louder", "boost mp3 volume", "normalize audio", "audio amplifier online", "increase volume of audio file"],
    steps: ["Drop an audio file.", "Choose Boost (percentage) or Normalize (target peak).", "Preview, process and download."],
    features: ["Up to 300% gain", "Peak normalization to a target dB", "Peak limiter to avoid clipping", "Live preview through a GainNode"],
    faqs: [
      { q: "How do I make a quiet recording louder?", a: "Choose Boost, raise the percentage until it sounds right in the preview, then process and download." },
      { q: "Will boosting cause distortion?", a: "The peak limiter stops the waveform from clipping. Very large boosts can still sound squashed, so preview before you download." },
      { q: "Boost or normalize?", a: "Normalize raises the loudest peak to the target — safe and predictable. Boost pushes further and relies on the limiter." },
    ],
    related: ["audio-cutter", "audio-speed", "audio-joiner"],
  },
  {
    slug: "reverse-audio",
    title: "Reverse Audio",
    category: "audio",
    icon: Rewind,
    badges: [],
    description: "Play any audio backwards for creative effects.",
    intro: "Reverse an audio file so it plays backwards — for sound design, hidden messages or creative effects. The file is reversed in your browser and stays on your device.",
    seoTitle: "Reverse Audio – Play Songs Backwards",
    metaDescription: "Reverse any audio file so it plays backwards, preview it instantly and download it as MP3 or WAV. Free, works with most audio formats and nothing is uploaded.",
    accept: AUDIO,
    acceptLabel: AUDIO_LABEL,
    maxSizeMB: 200,
    multiple: false,
    keywords: ["reverse audio", "reverse song", "play audio backwards", "reverse mp3", "reverse sound", "backwards audio", "reverse voice recording"],
    steps: ["Drop an audio file.", "Preview the reversed audio.", "Download as MP3 or WAV."],
    features: ["Sample-accurate reversal", "Instant preview", "Works with any browser-decodable format", "MP3 or WAV export"],
    faqs: [
      { q: "How do I reverse a song?", a: "Drop the audio file, listen to the reversed preview, then download it as MP3 or WAV." },
      { q: "Does reversing change audio quality?", a: "No. The samples are reversed exactly. Export as WAV for a lossless file, or MP3 for a smaller one." },
      { q: "Can I reverse only part of a file?", a: "Trim the part first with the Audio Cutter, then reverse it here." },
    ],
    related: ["audio-cutter", "audio-speed", "volume-booster"],
  },

  // ───────────────────────────── Utilities ─────────────────────────────
  {
    slug: "qr-code",
    title: "QR Code Generator & Scanner",
    category: "utility",
    icon: QrCode,
    badges: ["Popular"],
    description: "Create styled QR codes for links, text or Wi-Fi — and scan them.",
    intro: "Generate QR codes for URLs, text, Wi-Fi networks, email and phone numbers with custom colours and error correction — or read a QR code from an image. Codes are made and scanned in your browser, so nothing is sent to a server.",
    seoTitle: "Free QR Code Generator & Scanner",
    metaDescription: "Create free QR codes for links, text, Wi-Fi, email and phone with custom colours, and download them as PNG or SVG. Scan QR codes from images too, no sign-up.",
    accept: IMAGES,
    acceptLabel: IMAGE_LABEL,
    maxSizeMB: 20,
    multiple: false,
    keywords: ["qr code generator", "free qr code generator", "qr code generator no expiration", "wifi qr code", "qr code scanner from image", "create qr code for link", "read qr code from image", "qr code svg"],
    steps: ["Choose a type (link, text, Wi-Fi…) and enter the details.", "Pick colours, size and error correction.", "Download PNG or SVG — or switch to Scan and drop an image."],
    features: ["Link, text, Wi-Fi, email and phone", "Custom colours, margin and size", "PNG and SVG download", "Scan QR codes from images"],
    faqs: [
      { q: "How do I make a QR code for my Wi-Fi?", a: "Choose Wi-Fi, enter the network name, password and security type, and download the code. Phones that scan it can join without typing the password." },
      { q: "Can I scan a QR code from a screenshot?", a: "Yes. Switch to Scan and drop the image or screenshot; the code is decoded right in your browser." },
      { q: "Do these QR codes expire?", a: "No. They encode your content directly; there is no redirect service involved." },
    ],
    related: ["barcode-generator", "color-picker", "word-counter"],
  },
  {
    slug: "barcode-generator",
    title: "Barcode Generator",
    category: "utility",
    icon: Barcode,
    badges: [],
    description: "Create Code128, EAN-13, UPC and more as SVG or PNG.",
    intro: "Generate printable barcodes in Code128, EAN-13, EAN-8, UPC-A, Code39 and ITF-14 formats, and download them as SVG or PNG. Barcodes are drawn in your browser, with nothing sent to a server.",
    seoTitle: "Barcode Generator – EAN-13, UPC, Code128",
    metaDescription: "Generate printable barcodes in Code128, EAN-13, EAN-8, UPC-A, Code39 and ITF-14 with live validation, and download them as SVG or PNG. Free, no sign-up.",
    accept: [],
    acceptLabel: "",
    maxSizeMB: 0,
    multiple: false,
    keywords: ["barcode generator", "free barcode generator", "ean 13 barcode generator", "upc barcode generator", "code 128 barcode", "barcode maker", "create barcode online", "barcode svg"],
    steps: ["Choose a barcode format.", "Enter the value and adjust size and colours.", "Download as SVG or PNG."],
    features: ["Code128, EAN-13, EAN-8, UPC-A, Code39, ITF-14", "Live validation of the value", "Bar width, height and text options", "SVG (vector) and PNG download"],
    faqs: [
      { q: "Which barcode type should I use?", a: "EAN-13 (or UPC-A in North America) for retail products, Code128 for shipping labels and inventory, and ITF-14 for outer cartons." },
      { q: "Can I print the barcodes?", a: "Yes. Download SVG for sharp printing at any size, or PNG for documents and labels." },
      { q: "Why is my EAN-13 value rejected?", a: "EAN-13 needs 12 or 13 digits. If you enter 13 digits, the last one must be a valid check digit." },
    ],
    related: ["qr-code", "color-picker", "case-converter"],
  },
  {
    slug: "word-counter",
    title: "Word & Character Counter",
    category: "utility",
    icon: TextCursorInput,
    badges: ["Live"],
    description: "Live word, character, sentence and reading-time stats.",
    intro: "Paste or type text to instantly count words, characters (with and without spaces), sentences, paragraphs, and estimate reading and speaking time. Your text stays in this browser tab and is never sent anywhere.",
    seoTitle: "Word Counter – Count Words & Characters",
    metaDescription: "Count words, characters with and without spaces, sentences and paragraphs as you type, plus reading time and top keywords. Free, and text stays in your tab.",
    accept: [],
    acceptLabel: "",
    maxSizeMB: 0,
    multiple: false,
    keywords: ["word counter", "character counter", "word count", "count characters online", "character count with spaces", "reading time calculator", "keyword density checker", "sentence counter"],
    steps: ["Paste or type your text.", "See the counts update as you type.", "Check keyword density and reading time."],
    features: ["Words, characters, sentences, paragraphs", "Reading and speaking time", "Top keywords", "Text is kept only in this tab"],
    faqs: [
      { q: "Does the character count include spaces?", a: "Both are shown: characters with spaces and characters without spaces." },
      { q: "How is reading time calculated?", a: "At 238 words per minute (average adult silent reading speed). Speaking time uses 150 words per minute." },
      { q: "Can I check keyword density?", a: "Yes. The most frequent words in your text are listed with their counts, so you can spot repetition." },
    ],
    related: ["case-converter", "qr-code", "barcode-generator"],
  },
  {
    slug: "case-converter",
    title: "Case Converter",
    category: "utility",
    icon: CaseSensitive,
    badges: ["Live"],
    description: "UPPERCASE, lowercase, Title Case, camelCase, snake_case and more.",
    intro: "Convert text between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case and CONSTANT_CASE in one click. Text is converted in your browser and never leaves your device.",
    seoTitle: "Case Converter – Change Text Case Online",
    metaDescription: "Convert text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case and more in one click. Free, instant and fully private.",
    accept: [],
    acceptLabel: "",
    maxSizeMB: 0,
    multiple: false,
    keywords: ["case converter", "uppercase to lowercase", "lowercase to uppercase", "title case converter", "sentence case", "camelcase converter", "snake case converter", "change text case"],
    steps: ["Paste your text.", "Click the case you want.", "Copy the result."],
    features: ["9 case styles", "Handles existing camelCase and snake_case input", "One-click copy", "Undo back to the original"],
    faqs: [
      { q: "How do I change all caps to lowercase?", a: "Paste the text and choose lowercase, or Sentence case to keep a capital at the start of each sentence." },
      { q: "Can I convert to camelCase or snake_case for code?", a: "Yes. camelCase, PascalCase, snake_case, kebab-case and CONSTANT_CASE are one click each, and existing camelCase input is split correctly." },
      { q: "Does Title Case keep small words lowercase?", a: "Yes. Articles and short prepositions (a, of, the, in…) stay lowercase unless they start the title." },
    ],
    related: ["word-counter", "barcode-generator", "qr-code"],
  },
  {
    slug: "color-picker",
    title: "Color Picker from Image",
    category: "utility",
    icon: Pipette,
    badges: ["New"],
    description: "Pick any pixel's colour and extract an image palette.",
    intro: "Upload an image and click any pixel to get its HEX, RGB and HSL values, with a magnifier for precision and an automatically extracted colour palette. The image is read on your device and never uploaded.",
    seoTitle: "Color Picker from Image – Get HEX Codes",
    metaDescription: "Open an image and click any pixel to get its HEX, RGB and HSL colour code, with a magnifier and an automatic colour palette. Free; the image is never uploaded.",
    accept: IMAGES,
    acceptLabel: IMAGE_LABEL,
    maxSizeMB: 30,
    multiple: false,
    keywords: ["color picker from image", "image color picker", "get color from image", "hex color from image", "eyedropper online", "color palette from image", "rgb from image"],
    steps: ["Drop an image.", "Hover to magnify and click to pick a colour.", "Copy HEX, RGB or HSL — or use the extracted palette."],
    features: ["Pixel-precise eyedropper with magnifier", "HEX, RGB and HSL with one-click copy", "Dominant colour palette", "History of picked colours"],
    faqs: [
      { q: "How do I find the HEX code of a colour in a picture?", a: "Drop the image, hover to magnify and click the pixel. The HEX, RGB and HSL values appear with a copy button." },
      { q: "Can I pick colours from a screenshot?", a: "Yes. Drop any screenshot or photo in JPG, PNG, WebP, GIF, BMP or AVIF format." },
      { q: "How is the palette chosen?", a: "Pixels are grouped with a median-cut algorithm and the most common colour groups are shown." },
    ],
    related: ["image-converter", "crop-image", "qr-code"],
  },
];

export const TOOL_MAP: Record<string, ToolConfig> = Object.fromEntries(TOOLS.map((t) => [t.slug, t]));

export function getTool(slug: string): ToolConfig | undefined {
  return TOOL_MAP[slug];
}

export function getCategory(id: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function toolsInCategory(category: ToolCategory): ToolConfig[] {
  return TOOLS.filter((t) => t.category === category);
}

export function relatedTools(tool: ToolConfig, limit = 6): ToolConfig[] {
  const explicit = tool.related.map(getTool).filter((t): t is ToolConfig => Boolean(t));
  const sameCategory = toolsInCategory(tool.category).filter((t) => t.slug !== tool.slug && !tool.related.includes(t.slug));
  return [...explicit, ...sameCategory].slice(0, limit);
}

export const POPULAR_TOOLS = ["merge-pdf", "sign-pdf", "compress-image", "audio-cutter", "qr-code", "images-to-pdf"];

export const SITE = {
  name: "Devcipator Tools",
  shortName: "Devcipator",
  /** Publisher name used in structured data. */
  organization: "Devcipator",
  organizationUrl: "https://devcipator.com/",
  logo: "/devcipator-logo.png",
  description: "Free, private, in-browser tools for PDFs, images, audio and everyday tasks. Files never leave your device.",
  /** Meta keywords for pages without their own (home, privacy, terms). */
  keywords: [
    "free online tools",
    "online pdf tools",
    "image tools online",
    "audio tools online",
    "merge pdf",
    "compress image",
    "audio cutter",
    "qr code generator",
    "no upload file tools",
    "private browser tools",
  ],
  // VERCEL_PROJECT_PRODUCTION_URL is set by Vercel at build time (host only, no scheme).
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  /** Sitemap lastModified dates. Bump `content` when tool or category copy changes, `legal` when privacy or terms change. */
  updated: { content: "2026-10-30", legal: "2026-10-24" },
};

/** <title> and description for the fixed pages. Titles of pages other than home get the layout's “| Devcipator Tools” suffix. */
export const PAGE_SEO = {
  home: {
    title: "Free PDF, Image & Audio Tools – No Upload | Devcipator Tools",
    description: "25 free online tools to merge and sign PDFs, compress images, cut audio and make QR codes. Everything runs in your browser, so files never leave your device.",
  },
  privacy: {
    title: "Privacy Policy",
    description: "How Devcipator Tools protects your privacy: files are processed in your browser and never uploaded, stored or logged. Only theme and recent tools are saved.",
  },
  terms: {
    title: "Terms of Use",
    description: "The terms for using Devcipator Tools, the free in-browser PDF, image, audio and utility tools: your content, acceptable use, and the no-warranty clause.",
  },
};

/** A tool's own FAQs followed by the questions every tool page answers. */
export function toolFaqs(tool: ToolConfig): ToolFaq[] {
  const handlesFiles = tool.accept.length > 0 && tool.slug !== "qr-code";
  return [
    ...tool.faqs,
    handlesFiles
      ? {
          q: "Are my files uploaded to a server?",
          a: `No. ${tool.title} runs entirely in your browser, so your files stay on your device. Nothing is uploaded, stored or seen by anyone else.`,
        }
      : {
          q: "Is anything I enter sent to a server?",
          a: `No. ${tool.title} runs entirely in your browser, so the text and details you enter never leave your device.`,
        },
    { q: `Is ${tool.title} free?`, a: "Yes. It is completely free, with no sign-up and no watermarks." },
  ];
}
