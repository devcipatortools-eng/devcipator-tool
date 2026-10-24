"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { downloadBlob } from "@/lib/files";
import { Panel } from "@/components/tool/ToolLayout";
import { Button } from "@/components/ui/Button";
import { ColorInput, Field, Notice, Select, Slider, TextInput, Toggle } from "@/components/ui/controls";

type Format = "CODE128" | "EAN13" | "EAN8" | "UPC" | "CODE39" | "ITF14";

const FORMATS: Array<{ value: Format; label: string; example: string; hint: string }> = [
  { value: "CODE128", label: "Code 128", example: "DEV-2024-001", hint: "Any ASCII text. The most versatile general-purpose barcode." },
  { value: "EAN13", label: "EAN-13", example: "590123412345", hint: "12 digits (check digit added) or 13 digits with a valid check digit. Retail products." },
  { value: "EAN8", label: "EAN-8", example: "9638507", hint: "7 digits (check digit added) or 8 digits. Small retail packages." },
  { value: "UPC", label: "UPC-A", example: "03600029145", hint: "11 digits (check digit added) or 12 digits. North American retail." },
  { value: "CODE39", label: "Code 39", example: "CODE39", hint: "Uppercase letters, digits, space and - . $ / + %." },
  { value: "ITF14", label: "ITF-14", example: "1540014128876", hint: "13 digits (check digit added) or 14 digits. Shipping cartons." },
];

export default function BarcodeGenerator() {
  const [format, setFormat] = useState<Format>("CODE128");
  const [value, setValue] = useState(FORMATS[0].example);
  const [barWidth, setBarWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [showText, setShowText] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [lineColor, setLineColor] = useState("#000000");
  const [background, setBackground] = useState("#ffffff");
  const [valid, setValid] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const meta = FORMATS.find((f) => f.value === format)!;

  const options = { format, width: barWidth, height, displayValue: showText, fontSize, lineColor, background, margin: 12, font: "monospace" };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    let cancelled = false;
    import("jsbarcode").then(({ default: JsBarcode }) => {
      if (cancelled) return;
      let ok = true;
      try {
        JsBarcode(svg, value, { ...options, valid: (v: boolean) => (ok = v) });
      } catch {
        ok = false;
      }
      setValid(ok && value.length > 0);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, format, barWidth, height, showText, fontSize, lineColor, background]);

  async function downloadSvg() {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    await downloadBlob(new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], { type: "image/svg+xml" }), `barcode-${format.toLowerCase()}.svg`);
  }

  async function downloadPng() {
    const { default: JsBarcode } = await import("jsbarcode");
    const canvas = document.createElement("canvas");
    // Render at 3× for crisp printing.
    JsBarcode(canvas, value, { ...options, width: barWidth * 3, height: height * 3, fontSize: fontSize * 3, margin: 36 });
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
    if (blob) await downloadBlob(blob, `barcode-${format.toLowerCase()}.png`);
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-4">
        <Panel title="Preview">
          <div className="flex min-h-56 items-center justify-center overflow-x-auto rounded-xl bg-surface-2 p-6">
            <svg ref={svgRef} className={valid ? "max-w-full" : "hidden"} role="img" aria-label={`${meta.label} barcode for ${value}`} />
            {!valid && <p className="text-sm text-fg-subtle">Enter a valid {meta.label} value to see the barcode.</p>}
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
          <Button size="lg" icon={<Download className="size-5" />} onClick={downloadSvg} disabled={!valid}>
            SVG
          </Button>
          <Button size="lg" variant="secondary" icon={<Download className="size-5" />} onClick={downloadPng} disabled={!valid}>
            PNG
          </Button>
        </div>
      </div>
      <aside className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-card lg:sticky lg:top-20" aria-label="Settings">
        <Select
          label="Format"
          value={format}
          onChange={(f) => {
            setFormat(f);
            setValue(FORMATS.find((x) => x.value === f)!.example);
          }}
          options={FORMATS.map((f) => ({ value: f.value, label: f.label }))}
        />
        <Field label="Value" hint={meta.hint}>
          <TextInput value={value} onChange={(e) => setValue(e.target.value)} className="font-mono" aria-label="Barcode value" />
        </Field>
        {!valid && value.length > 0 && <Notice tone="danger">This value is not valid for {meta.label}.</Notice>}
        <Slider label="Bar width" value={barWidth} onChange={setBarWidth} min={1} max={4} step={0.5} format={(v) => `${v}px`} />
        <Slider label="Height" value={height} onChange={setHeight} min={30} max={200} format={(v) => `${v}px`} />
        <Toggle label="Show text under bars" checked={showText} onChange={setShowText} />
        {showText && <Slider label="Text size" value={fontSize} onChange={setFontSize} min={10} max={32} format={(v) => `${v}px`} />}
        <div className="grid grid-cols-2 gap-3">
          <ColorInput label="Bars" value={lineColor} onChange={setLineColor} />
          <ColorInput label="Background" value={background} onChange={setBackground} />
        </div>
      </aside>
    </div>
  );
}
