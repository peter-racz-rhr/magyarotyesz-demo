"use client";

import { createLocalStore } from "./local-store";

export type Lang = "en" | "hu";

export type Settings = {
  lang: Lang;
  /** Add and vote only within NEAR_METRES of the toilet (against fake codes). */
  nearbyCheck: boolean;
  /** Show alerts as phone notifications too. */
  notify: boolean;
};

const store = createLocalStore<Settings>("magyarotyesz:settings", {
  lang: "en",
  nearbyCheck: true,
  notify: false,
});

export const useSettings = store.useValue;
export const getSettings = store.get;
export const updateSettings = (change: Partial<Settings>) => store.set((s) => ({ ...s, ...change }));
