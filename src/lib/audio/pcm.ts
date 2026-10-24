/**
 * Plain PCM audio: one Float32Array per channel. Unlike AudioBuffer it can be
 * transferred to workers and created without an AudioContext.
 */
export interface Pcm {
  channels: Float32Array[];
  sampleRate: number;
}

export function pcmFromBuffer(buffer: AudioBuffer): Pcm {
  return {
    channels: Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c).slice()),
    sampleRate: buffer.sampleRate,
  };
}

export function pcmLength(pcm: Pcm): number {
  return pcm.channels[0]?.length ?? 0;
}

export function pcmDuration(pcm: Pcm): number {
  return pcmLength(pcm) / pcm.sampleRate;
}

export function toAudioBuffer(pcm: Pcm): AudioBuffer {
  const length = Math.max(1, pcmLength(pcm));
  const buf = new AudioBuffer({ length, numberOfChannels: pcm.channels.length, sampleRate: pcm.sampleRate });
  pcm.channels.forEach((ch, c) => buf.copyToChannel(ch as Float32Array<ArrayBuffer>, c));
  return buf;
}

/** Copies the samples between two times (seconds). */
export function slicePcm(pcm: Pcm, start: number, end: number): Pcm {
  const a = Math.max(0, Math.floor(start * pcm.sampleRate));
  const b = Math.min(pcmLength(pcm), Math.ceil(end * pcm.sampleRate));
  return { sampleRate: pcm.sampleRate, channels: pcm.channels.map((ch) => ch.slice(a, b)) };
}

/** Removes the samples between two times (seconds), joining the remainder with a short crossfade. */
export function cutOutPcm(pcm: Pcm, start: number, end: number): Pcm {
  const before = slicePcm(pcm, 0, start);
  const after = slicePcm(pcm, end, pcmDuration(pcm));
  return concatPcm([before, after], 0.01, 0);
}

/** Linear fade in / out, durations in seconds. Mutates and returns the input. */
export function fadePcm(pcm: Pcm, fadeIn: number, fadeOut: number): Pcm {
  const n = pcmLength(pcm);
  const fi = Math.min(n, Math.round(fadeIn * pcm.sampleRate));
  const fo = Math.min(n, Math.round(fadeOut * pcm.sampleRate));
  for (const ch of pcm.channels) {
    for (let i = 0; i < fi; i++) ch[i] *= i / fi;
    for (let i = 0; i < fo; i++) ch[n - 1 - i] *= i / fo;
  }
  return pcm;
}

export function reversePcm(pcm: Pcm): Pcm {
  return { sampleRate: pcm.sampleRate, channels: pcm.channels.map((ch) => ch.slice().reverse()) };
}

/** Matches channel counts (mono → duplicated, extra channels dropped). */
function withChannels(pcm: Pcm, count: number): Float32Array[] {
  return Array.from({ length: count }, (_, c) => pcm.channels[Math.min(c, pcm.channels.length - 1)]);
}

/**
 * Joins clips end to end. A positive `crossfade` (s) overlaps neighbours with an
 * equal-power fade; a positive `gap` (s) inserts silence instead.
 * All clips must share a sample rate.
 */
export function concatPcm(clips: Pcm[], crossfade: number, gap: number): Pcm {
  const sr = clips[0]?.sampleRate ?? 44100;
  const channelCount = Math.min(2, Math.max(1, ...clips.map((c) => c.channels.length)));
  const xf = Math.round(crossfade * sr);
  const gp = Math.round(gap * sr);
  let total = 0;
  clips.forEach((c, i) => {
    total += pcmLength(c);
    if (i > 0) total += gp - Math.min(xf, pcmLength(c), pcmLength(clips[i - 1]));
  });
  const out = Array.from({ length: channelCount }, () => new Float32Array(Math.max(0, total)));
  let pos = 0;
  clips.forEach((clip, i) => {
    const len = pcmLength(clip);
    const overlap = i > 0 ? Math.min(xf, len, pcmLength(clips[i - 1])) : 0;
    if (i > 0) pos += gp - overlap;
    const chans = withChannels(clip, channelCount);
    for (let c = 0; c < channelCount; c++) {
      const src = chans[c];
      const dst = out[c];
      for (let s = 0; s < len; s++) {
        const idx = pos + s;
        if (idx < 0 || idx >= dst.length) continue;
        if (s < overlap) {
          // Equal-power crossfade: fade the tail already in dst down while this clip fades up.
          const t = s / overlap;
          dst[idx] = dst[idx] * Math.cos((t * Math.PI) / 2) + src[s] * Math.sin((t * Math.PI) / 2);
        } else dst[idx] = src[s];
      }
    }
    pos += len;
  });
  return { sampleRate: sr, channels: out };
}

export function peakOf(pcm: Pcm): number {
  let peak = 0;
  for (const ch of pcm.channels) {
    for (let i = 0; i < ch.length; i++) {
      const v = Math.abs(ch[i]);
      if (v > peak) peak = v;
    }
  }
  return peak;
}

export const toDb = (amp: number) => (amp <= 0 ? -Infinity : 20 * Math.log10(amp));
export const fromDb = (db: number) => Math.pow(10, db / 20);

/**
 * Applies gain, then a look-ahead peak limiter so no sample exceeds `ceiling`.
 * Attack ramps down ~5 ms before a peak; release recovers over ~120 ms.
 */
export function gainWithLimiter(pcm: Pcm, gain: number, ceiling: number): Pcm {
  const n = pcmLength(pcm);
  const sr = pcm.sampleRate;
  const g = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let peak = 0;
    for (const ch of pcm.channels) {
      const v = Math.abs(ch[i] * gain);
      if (v > peak) peak = v;
    }
    g[i] = peak > ceiling ? ceiling / peak : 1;
  }
  const attackStep = 1 / Math.max(1, sr * 0.005);
  const releaseStep = 1 / Math.max(1, sr * 0.12);
  for (let i = n - 2; i >= 0; i--) g[i] = Math.min(g[i], g[i + 1] + attackStep);
  for (let i = 1; i < n; i++) g[i] = Math.min(g[i], g[i - 1] + releaseStep);
  return {
    sampleRate: sr,
    channels: pcm.channels.map((ch) => {
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const v = ch[i] * gain * g[i];
        out[i] = v > ceiling ? ceiling : v < -ceiling ? -ceiling : v;
      }
      return out;
    }),
  };
}
