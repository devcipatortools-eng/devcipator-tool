export type AudioFormat = "mp3" | "wav";

/** Operations implemented by audio.worker.ts. */
export type AudioApi = {
  encode(channels: Float32Array[], sampleRate: number, format: AudioFormat, kbps: number): Uint8Array;
  /** Speed change; `keepPitch` uses WSOLA time-stretch, otherwise resampling. */
  speed(channels: Float32Array[], sampleRate: number, rate: number, keepPitch: boolean): Float32Array[];
};
