"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ListMusic } from "lucide-react";
import { useFileList } from "@/hooks/useFileList";
import { useProcessor, throwIfAborted } from "@/hooks/useProcessor";
import { decodeAudioFile, encodePcm } from "@/lib/audio/client";
import { concatPcm, pcmDuration, pcmFromBuffer, type Pcm } from "@/lib/audio/pcm";
import { formatDuration, outputName } from "@/lib/files";
import { Panel, ToolLayout } from "@/components/tool/ToolLayout";
import { ReorderHint, SortableFileList } from "@/components/tool/SortableFileList";
import { ExportOptions, type ExportSettings } from "@/components/audio/AudioControls";
import { Field, Segmented, Slider, TextInput } from "@/components/ui/controls";

type Transition = "none" | "gap" | "crossfade";

/** Track durations, decoded lazily for the list (buffers are not kept). */
function useDurations(files: File[]) {
  const [durations, setDurations] = useState(new Map<File, number | "error">());
  const requested = useRef(new WeakSet<File>());
  useEffect(() => {
    for (const f of files) {
      if (requested.current.has(f)) continue;
      requested.current.add(f);
      decodeAudioFile(f).then(
        (b) => setDurations((m) => new Map(m).set(f, b.duration)),
        () => setDurations((m) => new Map(m).set(f, "error")),
      );
    }
  }, [files]);
  return durations;
}

export default function AudioJoiner() {
  const list = useFileList(true);
  const processor = useProcessor();
  const [transition, setTransition] = useState<Transition>("none");
  const [seconds, setSeconds] = useState(2);
  const [name, setName] = useState("joined");
  const [exportSettings, setExportSettings] = useState<ExportSettings>({ format: "mp3", kbps: 192 });
  const files = useMemo(() => list.items.map((i) => i.file), [list.items]);
  const durations = useDurations(files);
  const broken = files.filter((f) => durations.get(f) === "error");
  const total = files.reduce((s, f) => {
    const d = durations.get(f);
    return typeof d === "number" ? s + d : s;
  }, 0);
  const adjust = files.length > 1 ? (transition === "gap" ? seconds : transition === "crossfade" ? -seconds : 0) * (files.length - 1) : 0;

  async function join() {
    await processor.run(async ({ report, signal }) => {
      const clips: Pcm[] = [];
      for (let i = 0; i < files.length; i++) {
        throwIfAborted(signal);
        report((i / files.length) * 0.5, `Decoding ${files[i].name}`);
        // decodeAudioData resamples everything to the context rate, so clips line up.
        clips.push(pcmFromBuffer(await decodeAudioFile(files[i])));
      }
      report(0.55, "Joining tracks");
      const joined = concatPcm(clips, transition === "crossfade" ? seconds : 0, transition === "gap" ? seconds : 0);
      clips.length = 0; // release the decoded inputs before encoding
      const blob = await encodePcm(joined, exportSettings.format, exportSettings.kbps, {
        signal,
        onProgress: (v, l) => report(0.6 + (v ?? 0) * 0.4, l),
      });
      return [{ name: outputName(name, "joined", exportSettings.format), blob, note: formatDuration(pcmDuration(joined)) }];
    });
  }

  return (
    <ToolLayout
      slug="audio-joiner"
      fileCount={files.length}
      onFiles={list.add}
      onReset={list.clear}
      processor={processor}
      action={{
        label: files.length === 1 ? "Join tracks" : `Join ${files.length} tracks`,
        icon: <ListMusic className="size-5" />,
        disabled: files.length < 2 || broken.length > 0,
        hint: broken.length ? "Remove files your browser cannot decode." : "Add at least two tracks.",
        onClick: join,
      }}
      options={
        <>
          <Segmented
            label="Between tracks"
            value={transition}
            onChange={setTransition}
            options={[
              { value: "none", label: "Nothing" },
              { value: "gap", label: "Silence" },
              { value: "crossfade", label: "Crossfade" },
            ]}
          />
          {transition !== "none" && <Slider label={transition === "gap" ? "Silence length" : "Crossfade length"} value={seconds} onChange={setSeconds} min={0.5} max={10} step={0.5} format={(v) => `${v}s`} />}
          <ExportOptions value={exportSettings} onChange={setExportSettings} />
          <Field label="File name">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} aria-label="File name" />
          </Field>
          <p className="text-sm text-fg-muted">Total length: {formatDuration(Math.max(0, total + adjust))}</p>
        </>
      }
    >
      <Panel title="Tracks in order" actions={<ReorderHint />}>
        <SortableFileList
          items={list.items}
          onMove={list.move}
          onRemove={list.remove}
          renderMeta={(item) => {
            const d = durations.get(item.file);
            if (d === undefined) return "reading…";
            if (d === "error") return <span className="text-danger">cannot decode</span>;
            return formatDuration(d);
          }}
        />
      </Panel>
    </ToolLayout>
  );
}
