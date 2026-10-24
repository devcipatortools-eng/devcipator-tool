"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { decodeAudioFile, getAudioContext } from "@/lib/audio/client";
import { errorMessage } from "@/lib/files";

/** Decodes an audio file into an AudioBuffer; drops the reference when the file changes. */
export function useAudioFile(file: File | null) {
  const [state, setState] = useState<{ file: File; buffer: AudioBuffer | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    decodeAudioFile(file).then(
      (buffer) => !cancelled && setState({ file, buffer, error: null }),
      (err) => !cancelled && setState({ file, buffer: null, error: errorMessage(err) }),
    );
    return () => {
      cancelled = true;
    };
  }, [file]);

  // Results are tied to the file they came from, so a new file never shows the old buffer.
  const current = file && state?.file === file ? state : null;
  return { buffer: current?.buffer ?? null, error: current?.error ?? null, loading: !!file && !current };
}

export interface Peaks {
  min: Float32Array;
  max: Float32Array;
}

/** Min/max peaks per bucket across all channels, for drawing a waveform. */
export function useAudioWaveform(buffer: AudioBuffer | null, buckets = 2000): Peaks | null {
  return useMemo(() => {
    if (!buffer) return null;
    const n = buffer.length;
    const size = Math.max(1, Math.floor(n / buckets));
    const count = Math.ceil(n / size);
    const min = new Float32Array(count);
    const max = new Float32Array(count);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let b = 0; b < count; b++) {
        let lo = min[b];
        let hi = max[b];
        const end = Math.min(n, (b + 1) * size);
        for (let i = b * size; i < end; i++) {
          const v = data[i];
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
        min[b] = lo;
        max[b] = hi;
      }
    }
    return { min, max };
  }, [buffer, buckets]);
}

export interface PlayerChain {
  /** Builds the processing graph between the source and the destination; returns the input node. */
  build: (ctx: AudioContext, destination: AudioNode) => AudioNode;
}

/**
 * Plays an AudioBuffer through the shared AudioContext, optionally limited to
 * a range and routed through an effect chain. Stops on unmount (or when the
 * route is hidden), so audio never keeps playing in the background.
 */
export function useAudioPlayer(buffer: AudioBuffer | null, chain?: PlayerChain) {
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startedAt = useRef(0);
  const offsetRef = useRef(0);
  const endRef = useRef<number | null>(null);
  const raf = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  const stop = useCallback(() => {
    cancelAnimationFrame(raf.current);
    if (sourceRef.current) {
      sourceRef.current.onended = null;
      try {
        sourceRef.current.stop();
      } catch {
        // Already stopped.
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    setPlaying(false);
  }, []);

  const play = useCallback(
    (from = 0, to?: number) => {
      if (!buffer) return;
      stop();
      const ctx = getAudioContext();
      void ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const input = chain ? chain.build(ctx, ctx.destination) : ctx.destination;
      src.connect(input);
      const start = Math.max(0, Math.min(from, buffer.duration));
      const end = to !== undefined ? Math.min(to, buffer.duration) : buffer.duration;
      src.start(0, start, Math.max(0, end - start));
      src.onended = () => {
        cancelAnimationFrame(raf.current);
        sourceRef.current = null;
        setPlaying(false);
        setTime(end);
      };
      sourceRef.current = src;
      startedAt.current = ctx.currentTime;
      offsetRef.current = start;
      endRef.current = end;
      setPlaying(true);
      const tick = () => {
        setTime(Math.min(end, offsetRef.current + (ctx.currentTime - startedAt.current)));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    },
    [buffer, chain, stop],
  );

  // Stop when the buffer changes or the component goes away (or its route is hidden).
  useEffect(() => stop, [buffer, stop]);

  return { playing, time, play, stop, setTime };
}
