export interface OutputFile {
  name: string;
  blob: Blob;
  /** Optional short note shown on the result card (e.g. "-42%"). */
  note?: string;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(seconds: number, withMs = false): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const sec = withMs ? s.toFixed(2).padStart(5, "0") : Math.floor(s).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Parses "90", "1:30", "1:01:30" or "1:30.5" into seconds. Returns NaN on failure. */
export function parseTimestamp(input: string): number {
  const parts = input.trim().split(":");
  if (parts.length === 0 || parts.length > 3 || parts.some((p) => p.trim() === "" || isNaN(Number(p)))) return NaN;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

export function baseName(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(0, i) : name;
}

export function extension(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function withExtension(name: string, ext: string, suffix = ""): string {
  return `${baseName(name)}${suffix}.${ext.replace(/^\./, "")}`;
}

export function matchesAccept(file: File, accept: string[]): boolean {
  if (accept.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.some((rule) => {
    const r = rule.toLowerCase();
    if (r.startsWith(".")) return name.endsWith(r);
    if (r.endsWith("/*")) return type.startsWith(r.slice(0, -1));
    return type === r;
  });
}

export interface ValidationResult {
  accepted: File[];
  errors: string[];
}

export function validateFiles(files: File[], accept: string[], maxSizeMB: number): ValidationResult {
  const accepted: File[] = [];
  const errors: string[] = [];
  const maxBytes = maxSizeMB * 1024 * 1024;
  for (const file of files) {
    if (!matchesAccept(file, accept)) {
      errors.push(`“${file.name}” is not a supported file type.`);
    } else if (file.size > maxBytes) {
      errors.push(`“${file.name}” is ${formatBytes(file.size)}; the limit is ${maxSizeMB} MB.`);
    } else if (file.size === 0) {
      errors.push(`“${file.name}” is empty.`);
    } else {
      accepted.push(file);
    }
  }
  return { accepted, errors };
}

/** One-click download. file-saver handles Safari/iOS quirks and revokes its object URL itself. */
export async function downloadBlob(blob: Blob, name: string): Promise<void> {
  const { saveAs } = await import("file-saver");
  saveAs(blob, name);
}

export async function zipFiles(files: OutputFile[]): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Set<string>();
  for (const f of files) {
    let name = f.name;
    let n = 1;
    while (used.has(name)) name = `${baseName(f.name)} (${n++}).${extension(f.name)}`;
    used.add(name);
    zip.file(name, f.blob);
  }
  return zip.generateAsync({ type: "blob" });
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Something went wrong.";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
