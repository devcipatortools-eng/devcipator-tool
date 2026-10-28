"use client";

import { useMemo, useState } from "react";
import { Rewind } from "lucide-react";
import { useProcessor } from "@/hooks/useProcessor";
import { useAudioFile, useAudioPlayer, useAudioWaveform } from "@/hooks/useAudio";
import { encodePcm } from "@/lib/audio/client";
import { pcmFromBuffer, reversePcm, toAudioBuffer } from "@/lib/audio/pcm";
import { formatDuration, withExtension } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { Waveform } from "@/components/audio/Waveform";
import { AudioMeta, ExportOptions, PlayButton, type ExportSettings } from "@/components/audio/AudioControls";
import { Notice } from "@/components/ui/controls";

export default function ReverseAudio() {
  const [file, setFile] = useState<File | null>(null);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({ format: "mp3", kbps: 192 });
  const processor = useProcessor();
  const { buffer, error, loading } = useAudioFile(file);
  const reversed = useMemo(() => (buffer ? reversePcm(pcmFromBuffer(buffer)) : null), [buffer]);
  const reversedBuffer = useMemo(() => (reversed ? toAudioBuffer(reversed) : null), [reversed]);
  const peaks = useAudioWaveform(reversedBuffer);
  const player = useAudioPlayer(reversedBuffer);

  async function exportReversed() {
    if (!reversed || !file) return;
    player.stop();
    await processor.run(async ({ report, signal }) => {
      const blob = await encodePcm(reversed, exportSettings.format, exportSettings.kbps, { signal, onProgress: report });
      return [{ name: withExtension(file.name, exportSettings.format, "-reversed"), blob, note: formatDuration(reversedBuffer?.duration ?? 0) }];
    });
  }

  return (
    <ToolLayout
      slug="reverse-audio"
      fileCount={file ? 1 : 0}
      onFiles={(f) => setFile(f[0])}
      onReset={() => {
        player.stop();
        setFile(null);
      }}
      processor={processor}
      allowAddMore
      action={{ label: "Export reversed audio", icon: <Rewind className="size-5" />, disabled: !reversed, onClick: exportReversed }}
      options={<ExportOptions value={exportSettings} onChange={setExportSettings} />}
    >
      <Panel
        title={file ? `${file.name} — reversed` : "Audio"}
        actions={buffer && (<><AudioMeta buffer={buffer} /><PlayButton playing={player.playing} label="Play reversed" onPlay={() => player.play(0)} onStop={player.stop} /></>)}
      >
        {error && <Notice tone="danger">{error}</Notice>}
        {loading && <p className="py-12 text-center text-sm text-fg-subtle">Decoding audio…</p>}
        {reversedBuffer && <Waveform peaks={peaks} duration={reversedBuffer.duration} playhead={player.playing ? player.time : undefined} onSeek={(t) => player.play(t)} />}
      </Panel>
    </ToolLayout>
  );
}
