import { createWorkerClient, type CallOptions } from "@/lib/worker-rpc";
import type { AudioApi, AudioFormat } from "./api";
import type { Pcm } from "./pcm";

let client: ReturnType<typeof createWorkerClient<AudioApi>> | null = null;
let context: AudioContext | null = null;

export function audioWorker() {
  if (!client) {
    client = createWorkerClient<AudioApi>(
      () => new Worker(new URL("../../workers/audio.worker.ts", import.meta.url), { type: "module", name: "audio" }),
    );
  }
  return client;
}

/** One shared AudioContext for decoding and playback (browsers limit how many can exist). */
export function getAudioContext(): AudioContext {
  if (!context || context.state === "closed") context = new AudioContext();
  return context;
}

export async function decodeAudioFile(file: Blob): Promise<AudioBuffer> {
  const data = await file.arrayBuffer();
  try {
    return await getAudioContext().decodeAudioData(data);
  } catch {
    throw new Error("Your browser cannot decode this audio file. Try MP3, WAV, OGG or M4A.");
  }
}

export const MIME: Record<AudioFormat, string> = { mp3: "audio/mpeg", wav: "audio/wav" };

/** Encodes PCM in the audio worker. The channel buffers are copied, so the caller's PCM stays usable. */
export async function encodePcm(pcm: Pcm, format: AudioFormat, kbps: number, opts?: CallOptions): Promise<Blob> {
  const channels = pcm.channels.map((c) => c.slice());
  const bytes = await audioWorker().call("encode", [channels, pcm.sampleRate, format, kbps], {
    ...opts,
    transfer: channels.map((c) => c.buffer),
  });
  return new Blob([bytes as BlobPart], { type: MIME[format] });
}
