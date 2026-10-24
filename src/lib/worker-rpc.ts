/**
 * Minimal promise-based RPC over postMessage.
 *
 * Main thread:  const client = createWorkerClient<PdfApi>(() => new Worker(...));
 *               await client.call("merge", [buffers], { onProgress, signal });
 * Worker:       exposeWorker<PdfApi>({ merge: async (buffers, ctx) => ... });
 *
 * Cancelling a call terminates the worker; a fresh one is created on the next call.
 */

export interface WorkerContext {
  progress: (value: number | null, label?: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WorkerApi = Record<string, (...args: any[]) => any>;

/** Handler signatures as implemented in the worker: original args + a trailing context. */
export type WorkerHandlers<API extends WorkerApi> = {
  [K in keyof API]: (...args: [...Parameters<API[K]>, WorkerContext]) => ReturnType<API[K]> | Promise<Awaited<ReturnType<API[K]>>>;
};

type Request = { id: number; method: string; args: unknown[] };
type Response =
  | { id: number; type: "progress"; value: number | null; label?: string }
  | { id: number; type: "result"; result: unknown }
  | { id: number; type: "error"; message: string };

export interface CallOptions {
  onProgress?: (value: number | null, label?: string) => void;
  signal?: AbortSignal;
  transfer?: Transferable[];
}

export function createWorkerClient<API extends WorkerApi>(factory: () => Worker) {
  let worker: Worker | null = null;
  let seq = 0;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void; onProgress?: CallOptions["onProgress"] }>();

  function ensure(): Worker {
    if (worker) return worker;
    const w = factory();
    w.onmessage = (e: MessageEvent<Response>) => {
      const msg = e.data;
      const entry = pending.get(msg.id);
      if (!entry) return;
      if (msg.type === "progress") entry.onProgress?.(msg.value, msg.label);
      else {
        pending.delete(msg.id);
        if (msg.type === "result") entry.resolve(msg.result);
        else entry.reject(new Error(msg.message));
      }
    };
    w.onerror = (e) => {
      const err = new Error(e.message || "Worker crashed");
      pending.forEach((p) => p.reject(err));
      pending.clear();
      w.terminate();
      if (worker === w) worker = null;
    };
    worker = w;
    return w;
  }

  function terminate() {
    worker?.terminate();
    worker = null;
    const err = new DOMException("Cancelled", "AbortError");
    pending.forEach((p) => p.reject(err));
    pending.clear();
  }

  function call<K extends keyof API & string>(method: K, args: Parameters<API[K]>, opts: CallOptions = {}): Promise<Awaited<ReturnType<API[K]>>> {
    if (opts.signal?.aborted) return Promise.reject(new DOMException("Cancelled", "AbortError"));
    const id = ++seq;
    const w = ensure();
    return new Promise((resolve, reject) => {
      const cleanup = () => opts.signal?.removeEventListener("abort", terminate);
      pending.set(id, {
        resolve: (v) => {
          cleanup();
          resolve(v as Awaited<ReturnType<API[K]>>);
        },
        reject: (e) => {
          cleanup();
          reject(e);
        },
        onProgress: opts.onProgress,
      });
      opts.signal?.addEventListener("abort", terminate, { once: true });
      w.postMessage({ id, method, args } satisfies Request, opts.transfer ?? []);
    });
  }

  return { call, terminate };
}

/** Collects ArrayBuffers inside a result so they can be transferred instead of copied. */
function collectTransferables(value: unknown, out: Set<ArrayBuffer> = new Set(), depth = 0): Set<ArrayBuffer> {
  if (depth > 4 || value == null) return out;
  if (value instanceof ArrayBuffer) out.add(value);
  else if (ArrayBuffer.isView(value)) {
    if (value.buffer instanceof ArrayBuffer && value.byteOffset === 0 && value.byteLength === value.buffer.byteLength) out.add(value.buffer);
  } else if (Array.isArray(value)) value.forEach((v) => collectTransferables(v, out, depth + 1));
  else if (typeof value === "object") Object.values(value).forEach((v) => collectTransferables(v, out, depth + 1));
  return out;
}

export function exposeWorker<API extends WorkerApi>(handlers: WorkerHandlers<API>) {
  const scope = self as unknown as DedicatedWorkerGlobalScope;
  scope.onmessage = async (e: MessageEvent<Request>) => {
    const { id, method, args } = e.data;
    const ctx: WorkerContext = {
      progress: (value, label) => scope.postMessage({ id, type: "progress", value, label } satisfies Response),
    };
    try {
      const fn = (handlers as Record<string, (...a: unknown[]) => unknown>)[method];
      if (!fn) throw new Error(`Unknown worker method: ${method}`);
      const result = await fn(...args, ctx);
      scope.postMessage({ id, type: "result", result } satisfies Response, [...collectTransferables(result)]);
    } catch (err) {
      scope.postMessage({ id, type: "error", message: err instanceof Error ? err.message : String(err) } satisfies Response);
    }
  };
}
