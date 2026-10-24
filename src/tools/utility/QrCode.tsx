"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Download, ExternalLink, QrCode as QrIcon, ScanLine } from "lucide-react";
import { useCopy } from "@/hooks/useCopy";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { decodeImage, imageSize } from "@/lib/image/decode";
import { downloadBlob, errorMessage } from "@/lib/files";
import { getTool } from "@/config/tools.config";
import { Panel } from "@/components/tool/ToolLayout";
import { FileDropzone } from "@/components/tool/FileDropzone";
import { Button } from "@/components/ui/Button";
import { ColorInput, Field, Notice, Segmented, Select, Slider, TextInput, Toggle } from "@/components/ui/controls";

type Kind = "url" | "text" | "wifi" | "email" | "phone";
type Level = "L" | "M" | "Q" | "H";

/** Escapes Wi-Fi QR special characters (\ ; , : "). */
const wifiEscape = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");

function buildPayload(kind: Kind, f: Record<string, string>, hidden: boolean): string {
  switch (kind) {
    case "url": {
      const u = f.url.trim();
      return u && !/^[a-z][a-z0-9+.-]*:/i.test(u) ? `https://${u}` : u;
    }
    case "wifi":
      return `WIFI:T:${f.security};S:${wifiEscape(f.ssid)};${f.security === "nopass" ? "" : `P:${wifiEscape(f.password)};`}${hidden ? "H:true;" : ""};`;
    case "email": {
      const params = new URLSearchParams();
      if (f.subject) params.set("subject", f.subject);
      if (f.body) params.set("body", f.body);
      const q = params.toString().replace(/\+/g, "%20");
      return `mailto:${f.email.trim()}${q ? `?${q}` : ""}`;
    }
    case "phone":
      return `tel:${f.phone.replace(/[^\d+]/g, "")}`;
    default:
      return f.text;
  }
}

function Generator() {
  const [kind, setKind] = useState<Kind>("url");
  const [fields, setFields] = useState<Record<string, string>>({ url: "https://example.com", text: "", ssid: "", password: "", security: "WPA", email: "", subject: "", body: "", phone: "" });
  const [hidden, setHidden] = useState(false);
  const [dark, setDark] = useState("#111827");
  const [light, setLight] = useState("#ffffff");
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(2);
  const [level, setLevel] = useState<Level>("M");
  // Errors depend only on the data and error-correction level, so they are keyed by both.
  const [errState, setErrState] = useState<{ key: string; message: string | null } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const set = (k: string, v: string) => setFields((f) => ({ ...f, [k]: v }));
  const payload = buildPayload(kind, fields, hidden);
  const options = { errorCorrectionLevel: level, margin, width: size, color: { dark, light } };
  const empty = !payload || ["https://", "tel:", "mailto:"].includes(payload);
  const errKey = `${level}|${payload}`;
  const error = !empty && errState?.key === errKey ? errState.message : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (empty) {
      canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    let cancelled = false;
    import("qrcode")
      .then((QR) => QR.toCanvas(canvas, payload, options))
      .then(() => !cancelled && setErrState({ key: errKey, message: null }))
      .catch(
        (err) =>
          !cancelled &&
          setErrState({
            key: errKey,
            message: /too big|amount of data/i.test(errorMessage(err)) ? "Too much data for a QR code. Shorten the text or lower error correction." : errorMessage(err),
          }),
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, dark, light, size, margin, level]);

  async function downloadPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (blob) await downloadBlob(blob, "qr-code.png");
  }

  async function downloadSvg() {
    const QR = await import("qrcode");
    const svg = await QR.toString(payload, { ...options, type: "svg" });
    await downloadBlob(new Blob([svg], { type: "image/svg+xml" }), "qr-code.svg");
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Panel title="Content">
        <div className="flex flex-col gap-4">
          <Segmented
            value={kind}
            onChange={setKind}
            options={[
              { value: "url", label: "Link" },
              { value: "text", label: "Text" },
              { value: "wifi", label: "Wi-Fi" },
              { value: "email", label: "Email" },
              { value: "phone", label: "Phone" },
            ]}
          />
          {kind === "url" && (
            <Field label="Website URL">
              <TextInput value={fields.url} onChange={(e) => set("url", e.target.value)} placeholder="https://…" inputMode="url" aria-label="Website URL" />
            </Field>
          )}
          {kind === "text" && (
            <Field label="Text">
              <textarea
                value={fields.text}
                onChange={(e) => set("text", e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-primary focus:outline-none"
                aria-label="Text"
              />
            </Field>
          )}
          {kind === "wifi" && (
            <>
              <Field label="Network name (SSID)">
                <TextInput value={fields.ssid} onChange={(e) => set("ssid", e.target.value)} aria-label="Network name" />
              </Field>
              <Select
                label="Security"
                value={fields.security}
                onChange={(v) => set("security", v)}
                options={[
                  { value: "WPA", label: "WPA / WPA2 / WPA3" },
                  { value: "WEP", label: "WEP" },
                  { value: "nopass", label: "None (open network)" },
                ]}
              />
              {fields.security !== "nopass" && (
                <Field label="Password">
                  <TextInput value={fields.password} onChange={(e) => set("password", e.target.value)} aria-label="Wi-Fi password" />
                </Field>
              )}
              <Toggle label="Hidden network" checked={hidden} onChange={setHidden} />
            </>
          )}
          {kind === "email" && (
            <>
              <Field label="Email address">
                <TextInput type="email" value={fields.email} onChange={(e) => set("email", e.target.value)} aria-label="Email address" />
              </Field>
              <Field label="Subject (optional)">
                <TextInput value={fields.subject} onChange={(e) => set("subject", e.target.value)} aria-label="Subject" />
              </Field>
              <Field label="Message (optional)">
                <TextInput value={fields.body} onChange={(e) => set("body", e.target.value)} aria-label="Message" />
              </Field>
            </>
          )}
          {kind === "phone" && (
            <Field label="Phone number">
              <TextInput type="tel" value={fields.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 555 123 4567" aria-label="Phone number" />
            </Field>
          )}
          <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <ColorInput label="Foreground" value={dark} onChange={setDark} />
            <ColorInput label="Background" value={light} onChange={setLight} />
            <Slider label="Size" value={size} onChange={setSize} min={128} max={1024} step={32} format={(v) => `${v}px`} />
            <Slider label="Quiet zone" value={margin} onChange={setMargin} min={0} max={8} />
          </div>
          <Segmented
            label="Error correction"
            value={level}
            onChange={setLevel}
            hint="Higher levels survive damage or a logo overlay, but make the code denser."
            options={[
              { value: "L", label: "Low 7%" },
              { value: "M", label: "Medium 15%" },
              { value: "Q", label: "High 25%" },
              { value: "H", label: "Max 30%" },
            ]}
          />
        </div>
      </Panel>
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
        <Panel title="Preview">
          <div className="bg-checker flex aspect-square items-center justify-center rounded-xl p-4">
            <canvas ref={canvasRef} className={empty || error ? "hidden" : "block h-auto max-w-full rounded-md"} />
            {empty && <p className="text-sm text-fg-subtle">Enter content to generate a code.</p>}
          </div>
          {error && <Notice tone="danger" className="mt-3">{error}</Notice>}
          {!empty && !error && <p className="mt-3 break-all font-mono text-xs text-fg-subtle">{payload}</p>}
        </Panel>
        <div className="grid grid-cols-2 gap-2">
          <Button size="lg" icon={<Download className="size-5" />} onClick={downloadPng} disabled={empty || !!error}>
            PNG
          </Button>
          <Button size="lg" variant="secondary" icon={<Download className="size-5" />} onClick={downloadSvg} disabled={empty || !!error}>
            SVG
          </Button>
        </div>
      </aside>
    </div>
  );
}

function Scanner() {
  const [file, setFile] = useState<File | null>(null);
  const [scan, setScan] = useState<{ file: File; result: string | null; error: string | null } | null>(null);
  const url = useObjectUrl(file);
  const { copied, copy } = useCopy();
  const tool = getTool("qr-code")!;

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      const img = await decodeImage(file);
      const { width, height } = imageSize(img);
      // Very large photos are downscaled; QR codes stay readable and it is much faster.
      const s = Math.min(1, 1600 / Math.max(width, height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * s);
      canvas.height = Math.round(height * s);
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      if ("close" in img) img.close();
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { default: jsQR } = await import("jsqr");
      const code = jsQR(data.data, data.width, data.height, { inversionAttempts: "attemptBoth" });
      canvas.width = canvas.height = 0;
      if (cancelled) return;
      if (code?.data) setScan({ file, result: code.data, error: null });
      else setScan({ file, result: null, error: "No QR code found. Try a sharper, well-lit image where the code fills more of the frame." });
    })().catch((err) => !cancelled && setScan({ file, result: null, error: errorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [file]);

  const current = file && scan?.file === file ? scan : null;
  const result = current?.result ?? null;
  const error = current?.error ?? null;
  const isUrl = result !== null && /^https?:\/\//i.test(result);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <FileDropzone tool={tool} onFiles={(f) => setFile(f[0])} variant={file ? "compact" : "hero"} label={file ? "Scan another image" : "Drop an image containing a QR code"} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {url && <img src={url} alt="Uploaded" className="bg-checker max-h-96 rounded-xl border border-border object-contain" />}
      </div>
      <Panel title="Result">
        {!file && <p className="text-sm text-fg-subtle">Upload an image to read its QR code. Nothing is uploaded — decoding happens on your device.</p>}
        {error && <Notice tone="warning">{error}</Notice>}
        {result !== null && (
          <div className="flex flex-col gap-3">
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-surface-2 p-3 font-mono text-sm text-fg">{result}</pre>
            <div className="flex gap-2">
              <Button variant="secondary" icon={<Copy className="size-4" />} onClick={() => copy(result, "result")}>
                {copied === "result" ? "Copied" : "Copy"}
              </Button>
              {isUrl && (
                <a href={result} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-fg hover:bg-surface-2">
                  <ExternalLink className="size-4" /> Open link
                </a>
              )}
            </div>
            {isUrl && <p className="text-xs text-fg-subtle">Check the address before opening links from unknown QR codes.</p>}
          </div>
        )}
      </Panel>
    </div>
  );
}

export default function QrCode() {
  const [mode, setMode] = useState<"generate" | "scan">("generate");
  return (
    <div className="flex flex-col gap-6">
      <Segmented
        className="max-w-sm"
        value={mode}
        onChange={setMode}
        options={[
          { value: "generate", label: <><QrIcon className="size-4" /> Generate</> },
          { value: "scan", label: <><ScanLine className="size-4" /> Scan</> },
        ]}
      />
      {mode === "generate" ? <Generator /> : <Scanner />}
    </div>
  );
}
