"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "devcipator-recent-tools";
const LIMIT = 8;
const EMPTY: string[] = [];

let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (cache) return cache;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function recordToolUse(slug: string) {
  const next = [slug, ...read().filter((s) => s !== slug)].slice(0, LIMIT);
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignore quota / privacy-mode errors; the in-memory cache still updates.
  }
  listeners.forEach((l) => l());
}

/** Slugs of recently opened tools, most recent first. Empty during SSR. */
export function useRecentTools(): [string[], () => void] {
  const recent = useSyncExternalStore(subscribe, read, () => EMPTY);
  const clear = useCallback(() => {
    cache = [];
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    listeners.forEach((l) => l());
  }, []);
  return [recent, clear];
}
