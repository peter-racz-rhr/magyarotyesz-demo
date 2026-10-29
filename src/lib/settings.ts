"use client";

import { createLocalStore } from "./local-store";
import type { PaletteId } from "./palettes";

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
  /** The app's look: follow the phone, or always dark or light. */
  theme: "system" | "dark" | "light";
  /** The app's colours: surfaces, text and accent. Green, amber and red keep their meaning in all of them. */
  palette: PaletteId;
  /** How you move between Map, List and Profile: the bottom bar, or one round button that opens the pages. */
  navStyle: "bar" | "orb";
  /** The material of the bars and buttons: liquid glass, or one flat pastel colour with no effects. */
  glass: "liquid" | "solid";
  /** The pastel the solid look uses. */
  solidColor: "mint" | "sky" | "lavender" | "peach" | "rose";
  /** The colours of the navigation in the dark look. "classic" is how it used to look. */
  darkBar: "classic" | "graphite" | "ink" | "mint";
  /** Which base map: "auto" follows the app's look; or night, day or satellite. */
  mapStyle: "auto" | "dark" | "light" | "satellite";
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
  theme: "system",
  palette: "classic",
  navStyle: "bar",
  darkBar: "graphite",
  glass: "liquid",
  solidColor: "mint",
  mapStyle: "auto",
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
