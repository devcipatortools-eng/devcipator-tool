"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { useProcessor } from "@/hooks/useProcessor";
import { useAudioFile, useAudioPlayer, useAudioWaveform, type PlayerChain } from "@/hooks/useAudio";
import { encodePcm } from "@/lib/audio/client";
import { fromDb, gainWithLimiter, pcmFromBuffer, peakOf, toDb } from "@/lib/audio/pcm";
import { withExtension } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { Waveform } from "@/components/audio/Waveform";
import { AudioMeta, ExportOptions, PlayButton, type ExportSettings } from "@/components/audio/AudioControls";
import { Notice, Segmented, Slider } from "@/components/ui/controls";

const CEILING = 0.98; // ≈ −0.2 dBFS

const fmtDb = (db: number) => (Number.isFinite(db) ? `${db.toFixed(1)} dB` : "−∞ dB");

export default function VolumeBooster() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"boost" | "normalize">("boost");
  const [percent, setPercent] = useState(150);
  const [targetDb, setTargetDb] = useState(-1);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({ format: "mp3", kbps: 192 });
  const processor = useProcessor();
  const { buffer, error, loading } = useAudioFile(file);
  const peaks = useAudioWaveform(buffer);

  const peak = useMemo(() => (buffer ? peakOf(pcmFromBuffer(buffer)) : 0), [buffer]);
  const gain = mode === "boost" ? percent / 100 : peak > 0 ? fromDb(targetDb) / peak : 1;
  const limited = peak * gain > CEILING;

  // Live preview chain: GainNode → limiter-style DynamicsCompressor.
  const gainNode = useRef<GainNode | null>(null);
  const gainValue = useRef(gain);
  const chain = useMemo<PlayerChain>(
    () => ({
      build: (ctx, destination) => {
        const g = ctx.createGain();
        g.gain.value = gainValue.current;
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -1;
        limiter.knee.value = 0;
        limiter.ratio.value = 20;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.12;
        g.connect(limiter).connect(destination);
        gainNode.current = g;
        return g;
      },
    }),
    [],
  );
  const player = useAudioPlayer(buffer, chain);

  useEffect(() => {
    gainValue.current = gain;
    if (gainNode.current) gainNode.current.gain.value = gain;
  }, [gain]);

  async function process() {
    if (!buffer || !file) return;
    player.stop();
    await processor.run(async ({ report, signal }) => {
      report(null, "Applying gain and limiter");
      const out = gainWithLimiter(pcmFromBuffer(buffer), gain, CEILING);
      const blob = await encodePcm(out, exportSettings.format, exportSettings.kbps, { signal, onProgress: report });
      return [{ name: withExtension(file.name, exportSettings.format, "-louder"), blob, note: `peak ${fmtDb(toDb(peakOf(out)))}` }];
    });
  }

  return (
    <ToolLayout
      slug="volume-booster"
      fileCount={file ? 1 : 0}
      onFiles={(f) => setFile(f[0])}
      onReset={() => {
        player.stop();
        setFile(null);
      }}
      processor={processor}
      allowAddMore
      action={{ label: mode === "boost" ? `Boost to ${percent}%` : `Normalize to ${targetDb} dB`, icon: <Volume2 className="size-5" />, disabled: !buffer, onClick: process }}
      options={
        <>
          <Segmented
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: "boost", label: "Boost" },
              { value: "normalize", label: "Normalize" },
            ]}
          />
          {mode === "boost" ? (
            <Slider label="Volume" value={percent} onChange={setPercent} min={10} max={300} step={5} format={(v) => `${v}%`} />
          ) : (
            <Slider label="Target peak" value={targetDb} onChange={setTargetDb} min={-12} max={-0.1} step={0.1} format={(v) => `${v.toFixed(1)} dB`} hint="−1 dB is a safe standard for most platforms." />
          )}
          {buffer && (
            <dl className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-surface-2 px-2 py-2">
                <dt className="text-[11px] text-fg-subtle">Original peak</dt>
                <dd className="font-mono font-semibold tabular-nums">{fmtDb(toDb(peak))}</dd>
              </div>
              <div className="rounded-lg bg-surface-2 px-2 py-2">
                <dt className="text-[11px] text-fg-subtle">Gain</dt>
                <dd className="font-mono font-semibold tabular-nums">{toDb(gain) >= 0 ? "+" : ""}{fmtDb(toDb(gain))}</dd>
              </div>
              <div className="rounded-lg bg-surface-2 px-2 py-2">
                <dt className="text-[11px] text-fg-subtle">New peak</dt>
                <dd className="font-mono font-semibold tabular-nums">{fmtDb(toDb(Math.min(CEILING, peak * gain)))}</dd>
              </div>
            </dl>
          )}
          {limited && <Notice tone="warning">Peaks would clip at this level — the limiter will catch them. Very high boosts can sound squashed.</Notice>}
          <ExportOptions value={exportSettings} onChange={setExportSettings} />
        </>
      }
    >
      <Panel title={file?.name ?? "Audio"} actions={buffer && (<><AudioMeta buffer={buffer} /><PlayButton playing={player.playing} label="Preview" onPlay={() => player.play(0)} onStop={player.stop} /></>)}>
        {error && <Notice tone="danger">{error}</Notice>}
        {loading && <p className="py-12 text-center text-sm text-fg-subtle">Decoding audio…</p>}
        {buffer && <Waveform peaks={peaks} duration={buffer.duration} playhead={player.playing ? player.time : undefined} onSeek={(t) => player.play(t)} />}
        {buffer && <p className="mt-3 text-xs text-fg-subtle">Preview plays with the current gain; adjust the slider while listening. Click the waveform to jump.</p>}
      </Panel>
    </ToolLayout>
  );
}
