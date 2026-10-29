"use client";

import { useState } from "react";
import { Scissors } from "lucide-react";
import { useProcessor } from "@/hooks/useProcessor";
import { useAudioFile, useAudioPlayer, useAudioWaveform } from "@/hooks/useAudio";
import { encodePcm } from "@/lib/audio/client";
import { cutOutPcm, fadePcm, pcmFromBuffer, slicePcm } from "@/lib/audio/pcm";
import { formatDuration, parseTimestamp, withExtension } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { Waveform, type Selection } from "@/components/audio/Waveform";
import { AudioMeta, ExportOptions, PlayButton, type ExportSettings } from "@/components/audio/AudioControls";
import { Field, Notice, Segmented, Slider, TextInput } from "@/components/ui/controls";

function TimeInput({ label, value, onCommit }: { label: string; value: number; onCommit: (t: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Field label={label}>
      <TextInput
        value={draft ?? formatDuration(value, true)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) {
            const t = parseTimestamp(draft);
            if (Number.isFinite(t)) onCommit(t);
            setDraft(null);
          }
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className="font-mono"
        aria-label={label}
      />
    </Field>
  );
}

export default function AudioCutter() {
  const [file, setFile] = useState<File | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [mode, setMode] = useState<"keep" | "remove">("keep");
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({ format: "mp3", kbps: 192 });
  const processor = useProcessor();
  const { buffer, error, loading } = useAudioFile(file);
  const peaks = useAudioWaveform(buffer);
  const player = useAudioPlayer(buffer);
  const duration = buffer?.duration ?? 0;

  // Default selection: middle 50% once the audio is decoded.
  const [initFor, setInitFor] = useState<unknown>(null);
  if (buffer && initFor !== buffer) {
    setInitFor(buffer);
    setSelection({ start: duration * 0.25, end: duration * 0.75 });
  }

  const sel = selection ?? { start: 0, end: duration };
  const resultLength = mode === "keep" ? sel.end - sel.start : duration - (sel.end - sel.start);
  // A start typed past the end (or an end before the start) moves the other edge out of the way instead of collapsing the selection.
  const setStart = (t: number) => {
    const start = Math.max(0, Math.min(t, duration - 0.01));
    setSelection({ start, end: start < sel.end ? sel.end : duration });
  };
  const setEnd = (t: number) => {
    const end = Math.min(duration, Math.max(t, 0.01));
    setSelection({ start: end > sel.start ? sel.start : 0, end });
  };

  async function exportCut() {
    if (!buffer || !file) return;
    player.stop();
    await processor.run(async ({ report, signal }) => {
      report(null, "Cutting");
      const pcm = pcmFromBuffer(buffer);
      const result = mode === "keep" ? slicePcm(pcm, sel.start, sel.end) : cutOutPcm(pcm, sel.start, sel.end);
      fadePcm(result, fadeIn, fadeOut);
      const blob = await encodePcm(result, exportSettings.format, exportSettings.kbps, { signal, onProgress: report });
      return [{ name: withExtension(file.name, exportSettings.format, "-cut"), blob, note: formatDuration(resultLength, true) }];
    });
  }

  return (
    <ToolLayout
      slug="audio-cutter"
      fileCount={file ? 1 : 0}
      onFiles={(f) => setFile(f[0])}
      onReset={() => {
        player.stop();
        setFile(null);
        setSelection(null);
      }}
      processor={processor}
      allowAddMore
      action={{ label: `Export ${formatDuration(resultLength, true)}`, icon: <Scissors className="size-5" />, disabled: !buffer || resultLength <= 0.01, onClick: exportCut }}
      options={
        <>
          <Segmented
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "keep", label: "Keep selection" },
              { value: "remove", label: "Remove selection" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <TimeInput label="Start" value={sel.start} onCommit={setStart} />
            <TimeInput label="End" value={sel.end} onCommit={setEnd} />
          </div>
          <Slider label="Fade in" value={fadeIn} onChange={setFadeIn} min={0} max={10} step={0.5} format={(v) => `${v}s`} />
          <Slider label="Fade out" value={fadeOut} onChange={setFadeOut} min={0} max={10} step={0.5} format={(v) => `${v}s`} />
          <ExportOptions value={exportSettings} onChange={setExportSettings} />
        </>
      }
    >
      <Panel
        title={file?.name ?? "Audio"}
        actions={
          buffer && (
            <>
              <AudioMeta buffer={buffer} />
              <PlayButton playing={player.playing} label="Play selection" onPlay={() => player.play(sel.start, sel.end)} onStop={player.stop} />
            </>
          )
        }
      >
        {error && <Notice tone="danger">{error}</Notice>}
        {loading && <p className="py-12 text-center text-sm text-fg-subtle">Decoding audio…</p>}
        {buffer && (
          <>
            <Waveform peaks={peaks} duration={duration} selection={sel} onSelectionChange={setSelection} selectionMode={mode} playhead={player.playing ? player.time : undefined} />
            <p className="mt-3 text-xs text-fg-subtle">
              Drag the handles to adjust, or drag across the waveform to make a new selection. Selected: {formatDuration(sel.start, true)} – {formatDuration(sel.end, true)} ({formatDuration(sel.end - sel.start, true)})
            </p>
          </>
        )}
      </Panel>
    </ToolLayout>
  );
}
