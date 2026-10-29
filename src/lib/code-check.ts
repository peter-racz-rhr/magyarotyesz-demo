"use client";

import { createLocalStore } from "./local-store";

/** The last code you looked at, so the app can ask a few minutes later whether it worked. */
export type PendingCheck = { id: string; name: string; at: number };

const store = createLocalStore<PendingCheck | null>("magyarotyesz:check", null);
export const usePendingCheck = store.useValue;

export function rememberReveal(id: string, name: string) {
  if (store.get()?.id === id) return;
  store.set({ id, name, at: Date.now() });
}
export const clearCheck = () => store.set(null);
