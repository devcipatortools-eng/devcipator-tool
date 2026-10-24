/// <reference lib="webworker" />
import { exposeWorker } from "@/lib/worker-rpc";
import { encodeMp3, encodeWav, resample, timeStretch } from "@/lib/audio/dsp";
import type { AudioApi } from "@/lib/audio/api";

exposeWorker<AudioApi>({
  async encode(channels, sampleRate, format, kbps, ctx) {
    if (format === "wav") {
      ctx.progress(null, "Encoding WAV");
      return encodeWav(channels, sampleRate);
    }
    return encodeMp3(channels, sampleRate, kbps, (v, l) => ctx.progress(v, l));
  },

  speed(channels, sampleRate, rate, keepPitch, ctx) {
    if (!keepPitch) {
      ctx.progress(null, "Resampling");
      return resample(channels, rate);
    }
    return timeStretch(channels, sampleRate, rate, (v, l) => ctx.progress(v, l));
  },
});
