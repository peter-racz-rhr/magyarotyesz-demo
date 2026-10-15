"use client";

import { createLocalStore } from "./local-store";

export type Lang = "en" | "hu";

export type Settings = {
  lang: Lang;
  /** Add and vote only within NEAR_METRES of the toilet (against fake codes). */
  nearbyCheck: boolean;
  /** Show alerts as phone notifications too. */
  notify: boolean;
  /** How dark the glass bars (dock, search) are, 0 to 0.7 (for the tinted styles). */
  glassDim: number;
  /** The look of the glass bars. */
  glassStyle: GlassStyle;
};

export const GLASS_STYLES = ["classic", "tinted", "balanced", "frosted"] as const;
export type GlassStyle = (typeof GLASS_STYLES)[number];

export const DEFAULT_GLASS_DIM = 0.3;
export const MAX_GLASS_DIM = 0.7;
export const DEFAULT_GLASS_STYLE: GlassStyle = "balanced";

const store = createLocalStore<Settings>("magyarotyesz:settings", {
  lang: "en",
  nearbyCheck: true,
  notify: false,
  glassDim: DEFAULT_GLASS_DIM,
  glassStyle: DEFAULT_GLASS_STYLE,
});

export const useSettings = store.useValue;
export const getSettings = store.get;
export const updateSettings = (change: Partial<Settings>) => store.set((s) => ({ ...s, ...change }));
