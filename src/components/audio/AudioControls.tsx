"use client";

import { Pause, Play } from "lucide-react";
import type { AudioFormat } from "@/lib/audio/api";
import { formatDuration } from "@/lib/files";
import { Button } from "@/components/ui/Button";
import { Segmented, Select } from "@/components/ui/controls";

export interface ExportSettings {
  format: AudioFormat;
  kbps: number;
}

export function ExportOptions({ value, onChange }: { value: ExportSettings; onChange: (v: ExportSettings) => void }) {
  return (
    <>
      <Segmented
        label="Export format"
        value={value.format}
        onChange={(format) => onChange({ ...value, format })}
        options={[
          { value: "mp3", label: "MP3" },
          { value: "wav", label: "WAV (lossless)" },
        ]}
      />
      {value.format === "mp3" && (
        <Select
          label="MP3 quality"
          value={String(value.kbps)}
          onChange={(v) => onChange({ ...value, kbps: Number(v) })}
          options={[
            { value: "128", label: "128 kbps — small" },
            { value: "192", label: "192 kbps — recommended" },
            { value: "256", label: "256 kbps — high" },
            { value: "320", label: "320 kbps — maximum" },
          ]}
        />
      )}
    </>
  );
}

export function PlayButton({ playing, onPlay, onStop, label = "Play", disabled }: { playing: boolean; onPlay: () => void; onStop: () => void; label?: string; disabled?: boolean }) {
  return (
    <Button variant="secondary" size="sm" icon={playing ? <Pause className="size-4" /> : <Play className="size-4" />} onClick={playing ? onStop : onPlay} disabled={disabled}>
      {playing ? "Stop" : label}
    </Button>
  );
}

export function AudioMeta({ buffer }: { buffer: AudioBuffer }) {
  return (
    <span className="whitespace-nowrap font-mono text-xs text-fg-muted tabular-nums">
      {formatDuration(buffer.duration, true)} · {buffer.numberOfChannels === 1 ? "mono" : `${buffer.numberOfChannels} ch`}
    </span>
  );
}
