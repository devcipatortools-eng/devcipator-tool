"use client";

import { useEffect, useRef, useState } from "react";
import { Gauge } from "lucide-react";
import { useProcessor } from "@/hooks/useProcessor";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { useAudioFile, useAudioWaveform } from "@/hooks/useAudio";
import { audioWorker, encodePcm } from "@/lib/audio/client";
import { pcmFromBuffer } from "@/lib/audio/pcm";
import { formatDuration, withExtension } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { Waveform } from "@/components/audio/Waveform";
import { AudioMeta, ExportOptions, type ExportSettings } from "@/components/audio/AudioControls";
import { Notice, Slider, Toggle } from "@/components/ui/controls";
import { cn } from "@/lib/cn";

const PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function AudioSpeed() {
  const [file, setFile] = useState<File | null>(null);
  const [rate, setRate] = useState(1.25);
  const [keepPitch, setKeepPitch] = useState(true);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({ format: "mp3", kbps: 192 });
  const processor = useProcessor();
  const { buffer, error, loading } = useAudioFile(file);
  const peaks = useAudioWaveform(buffer);
  const url = useObjectUrl(file);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Live preview: the browser's own pitch-preserving playback.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = rate;
    el.preservesPitch = keepPitch;
  }, [rate, keepPitch, url]);

  async function process() {
    if (!buffer || !file) return;
    audioRef.current?.pause();
    await processor.run(async ({ report, signal }) => {
      const pcm = pcmFromBuffer(buffer);
      const channels = await audioWorker().call("speed", [pcm.channels, pcm.sampleRate, rate, keepPitch], {
        signal,
        onProgress: (v, l) => report((v ?? 0) * 0.6, l),
        transfer: pcm.channels.map((c) => c.buffer),
      });
      const blob = await encodePcm({ channels, sampleRate: pcm.sampleRate }, exportSettings.format, exportSettings.kbps, {
        signal,
        onProgress: (v, l) => report(0.6 + (v ?? 0) * 0.4, l),
      });
      return [{ name: withExtension(file.name, exportSettings.format, `-${rate}x`), blob, note: formatDuration(buffer.duration / rate) }];
    });
  }

  return (
    <ToolLayout
      slug="audio-speed"
      fileCount={file ? 1 : 0}
      onFiles={(f) => setFile(f[0])}
      onReset={() => setFile(null)}
      processor={processor}
      allowAddMore
      action={{ label: `Apply ${rate}× speed`, icon: <Gauge className="size-5" />, disabled: !buffer || rate === 1, hint: "Pick a speed other than 1×.", onClick: process }}
      options={
        <>
          <Slider label="Speed" value={rate} onChange={setRate} min={0.5} max={2} step={0.05} format={(v) => `${v.toFixed(2)}×`} />
          <div className="grid grid-cols-6 gap-1">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setRate(p)}
                className={cn("rounded-md border py-1 text-xs font-medium tabular-nums cursor-pointer pointer-coarse:min-h-11", rate === p ? "border-primary bg-primary-soft text-primary-strong" : "border-border text-fg-muted hover:text-fg")}
              >
                {p}×
              </button>
            ))}
          </div>
          <Toggle label="Keep original pitch" hint="Time-stretch so voices don't sound higher or lower." checked={keepPitch} onChange={setKeepPitch} />
          {buffer && (
            <p className="text-sm text-fg-muted">
              Length: {formatDuration(buffer.duration)} → <span className="font-medium text-fg">{formatDuration(buffer.duration / rate)}</span>
            </p>
          )}
          <ExportOptions value={exportSettings} onChange={setExportSettings} />
        </>
      }
    >
      <Panel title={file?.name ?? "Audio"} actions={buffer && <AudioMeta buffer={buffer} />}>
        {error && <Notice tone="danger">{error}</Notice>}
        {loading && <p className="py-12 text-center text-sm text-fg-subtle">Decoding audio…</p>}
        {buffer && <Waveform peaks={peaks} duration={buffer.duration} height={120} />}
        {url && (
          <div className="mt-4 flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg-subtle">Preview at {rate}×{keepPitch ? " (pitch kept)" : ""}</span>
            <audio ref={audioRef} src={url} controls className="w-full" preload="metadata" />
          </div>
        )}
      </Panel>
    </ToolLayout>
  );
}
