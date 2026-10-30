"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny persisted store: state lives in localStorage on this device and
 * every component using it re-renders when it changes.
 * Swap for Supabase tables once accounts are real.
 */
export function createLocalStore<T>(key: string, initial: T, { lazy = false }: { lazy?: boolean } = {}) {
  let cache: T | null = null;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (cache !== null) return cache;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as T) : initial;
      // Settings added in a newer version start with their default instead of being missing.
      cache =
        parsed && initial && typeof parsed === "object" && typeof initial === "object" && !Array.isArray(initial)
          ? ({ ...initial, ...parsed } as T)
          : parsed;
    } catch {
      cache = initial;
    }
    return cache;
  };

  const persist = () => {
    try {
      window.localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      // Storage full or blocked: keep the in-memory value for this visit.
    }
  };
  let pending = 0;
  const schedulePersist = () => {
    if (pending) return;
    const run = () => {
      pending = 0;
      persist();
    };
    pending = window.setTimeout(() => ("requestIdleCallback" in window ? window.requestIdleCallback(run, { timeout: 3000 }) : run()), 1500);
    // Leaving the app (or switching away from it) saves right away.
    window.addEventListener("pagehide", flushOnHide, { once: true });
    document.addEventListener("visibilitychange", flushOnHide, { once: true });
  };
  const flushOnHide = () => {
    if (!pending) return;
    window.clearTimeout(pending);
    pending = 0;
    persist();
  };

  const set = (update: T | ((prev: T) => T)) => {
    const next =
      typeof update === "function"
        ? (update as (prev: T) => T)(read())
        : update;
    cache = next;
    // A big value (the whole map) is saved a moment later, once, instead of on every change: turning a few MB
    // into text blocks the phone for a while, and changes often come in bursts.
    if (lazy) schedulePersist();
    else persist();
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useValue = () =>
    useSyncExternalStore(subscribe, read, () => initial);

  return { get: read, set, subscribe, useValue };
}
