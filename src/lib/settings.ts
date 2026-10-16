"use client";

import { createLocalStore } from "./local-store";

export type Lang = "en" | "hu";

export type Settings = {
  lang: Lang;
  /** Add and vote only within NEAR_METRES of the toilet (against fake codes). */
  nearbyCheck: boolean;
  /** Show alerts as phone notifications too. */
  notify: boolean;
  /** Let the app read this phone's position (your dot, nearest toilets, adding and checking codes). */
  location: boolean;
  /** Draw the buildings on the map as 3D blocks and tilt the map. */
  buildings3d: boolean;
  /** Show a place's code as soon as its card opens, without tapping. */
  showCodes: boolean;
  /** A short vibration on taps and when a toilet is added (Android). */
  haptics: boolean;
  /** The little celebration when a toilet is added. */
  animations: boolean;
  /** What you'd like to be called; kept on this phone and on your id at the server. */
  name: string;
  /** Which colour your profile circle has (0-7). */
  avatar: number;
  /** Your profile photo as a small picture (a data address); stays on this phone. Empty: none. */
  photo: string;
};


const store = createLocalStore<Settings>("magyarotyesz:settings", {
  lang: "en",
  nearbyCheck: true,
  notify: false,
  location: true,
  buildings3d: true,
  showCodes: false,
  haptics: true,
  animations: true,
  name: "",
  avatar: 0,
  photo: "",
});

export const useSettings = store.useValue;
export const getSettings = store.get;
export const updateSettings = (change: Partial<Settings>) => store.set((s) => ({ ...s, ...change }));
