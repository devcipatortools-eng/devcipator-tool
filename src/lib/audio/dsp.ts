/** CPU-heavy DSP used inside audio.worker.ts. */

export type Progress = (value: number, label?: string) => void;

/** Changes speed by resampling (pitch follows speed, like a tape machine). */
export function resample(channels: Float32Array[], rate: number): Float32Array[] {
  const n = channels[0]?.length ?? 0;
  const outLen = Math.max(1, Math.floor(n / rate));
  return channels.map((ch) => {
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const pos = i * rate;
      const i0 = Math.floor(pos);
      const i1 = Math.min(n - 1, i0 + 1);
      const t = pos - i0;
      out[i] = ch[i0] * (1 - t) + ch[i1] * t;
    }
    return out;
  });
}

/**
 * WSOLA time-stretch: changes tempo by `rate` (2 = twice as fast) while keeping pitch.
 * Overlap-adds Hann-windowed frames, choosing each frame's input position within a
 * small tolerance so it best continues the previous frame (no phasey artefacts).
 */
export function timeStretch(channels: Float32Array[], sampleRate: number, rate: number, progress?: Progress): Float32Array[] {
  const n = channels[0]?.length ?? 0;
  if (n === 0 || rate === 1) return channels.map((c) => c.slice());

  const W = 2 * Math.round(sampleRate * 0.025); // ~50 ms frames
  const Hs = W / 2; // synthesis hop (50% overlap)
  const Ha = Hs * rate; // analysis hop
  const tol = Math.round(sampleRate * 0.008); // ±8 ms search
  const DEC = 4; // decimation for the coarse search
  const outLen = Math.ceil(n / rate);

  const mono = new Float32Array(n);
  for (const ch of channels) for (let i = 0; i < n; i++) mono[i] += ch[i] / channels.length;

  const win = new Float32Array(W);
  for (let i = 0; i < W; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / W);

  const out = channels.map(() => new Float32Array(outLen + W));
  const corr = (a: number, b: number, len: number, step: number) => {
    let s = 0;
    for (let i = 0; i < len; i += step) s += mono[a + i] * mono[b + i];
    return s;
  };

  let prev = 0;
  const frames = Math.ceil(outLen / Hs);
  for (let k = 0; k * Hs < outLen; k++) {
    const nominal = Math.round(k * Ha);
    let best = Math.min(nominal, n - 1);
    const target = prev + Hs; // where the previous frame "naturally" continues
    if (k > 0 && target + Hs < n) {
      let bestScore = -Infinity;
      const lo = Math.max(0, nominal - tol);
      const hi = Math.min(n - Hs - 1, nominal + tol);
      for (let c = lo; c <= hi; c += DEC) {
        const s = corr(c, target, Hs, DEC);
        if (s > bestScore) {
          bestScore = s;
          best = c;
        }
      }
      // Refine around the coarse winner at full resolution.
      const coarse = best;
      for (let c = Math.max(lo, coarse - DEC); c <= Math.min(hi, coarse + DEC); c++) {
        const s = corr(c, target, Hs, 1);
        if (s > bestScore) {
          bestScore = s;
          best = c;
        }
      }
    }
    const outPos = k * Hs;
    for (let c = 0; c < channels.length; c++) {
      const src = channels[c];
      const dst = out[c];
      for (let i = 0; i < W; i++) {
        const idx = best + i;
        if (idx >= n) break;
        dst[outPos + i] += src[idx] * win[i];
      }
    }
    prev = best;
    if (progress && k % 200 === 0) progress(k / frames, "Time-stretching");
  }
  return out.map((ch) => ch.subarray(0, outLen).slice());
}

/* ------------------------------- Encoders ------------------------------- */

export function encodeWav(channels: Float32Array[], sampleRate: number): Uint8Array {
  const numCh = channels.length;
  const n = channels[0]?.length ?? 0;
  const dataSize = n * numCh * 2;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + dataSize, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, numCh, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * numCh * 2, true);
  v.setUint16(32, numCh * 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, dataSize, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Uint8Array(buf);
}

function toInt16(ch: Float32Array): Int16Array {
  const out = new Int16Array(ch.length);
  for (let i = 0; i < ch.length; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

export async function encodeMp3(channels: Float32Array[], sampleRate: number, kbps: number, progress?: Progress): Promise<Uint8Array> {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  let chans = channels.slice(0, 2);
  let sr = sampleRate;
  // MP3 tops out at 48 kHz.
  if (sr > 48000) {
    chans = resample(chans, sr / 48000);
    sr = 48000;
  }
  const stereo = chans.length === 2;
  const encoder = new Mp3Encoder(stereo ? 2 : 1, sr, kbps);
  const left = toInt16(chans[0]);
  const right = stereo ? toInt16(chans[1]) : undefined;
  const parts: Uint8Array[] = [];
  const block = 1152 * 20;
  for (let i = 0; i < left.length; i += block) {
    const l = left.subarray(i, i + block);
    const chunk = right ? encoder.encodeBuffer(l, right.subarray(i, i + block)) : encoder.encodeBuffer(l);
    if (chunk.length) parts.push(new Uint8Array(chunk));
    if (progress && (i / block) % 20 === 0) progress(i / left.length, "Encoding MP3");
  }
  const end = encoder.flush();
  if (end.length) parts.push(new Uint8Array(end));
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
