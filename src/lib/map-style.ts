"use client";

import { useEffect, useState } from "react";
import { useSettings } from "./settings";

import { useLook } from "./theme";

export type MapStyleKey = "dark" | "light" | "satellite";
export type MapStyleChoice = MapStyleKey | "auto";

/* Our own styles (public/map-styles, built by scripts/map-styles/build.mjs) on OpenFreeMap tiles. */
const OWN: Record<MapStyleKey, string> = {
  dark: "/map-styles/night.json",
  light: "/map-styles/day.json",
  satellite: "/map-styles/satellite.json",
};

/* If OpenFreeMap can't be reached, the old CARTO maps take over. Satellite keeps working (the imagery comes from EOX). */
const CARTO = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

/** Whether the free map-tile service answers; asked once per visit. */
let verdict: "unknown" | "up" | "down" = "unknown";

function useBasemapDown() {
  const [down, setDown] = useState(verdict === "down");
  useEffect(() => {
    if (verdict !== "unknown") return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 9000);
    fetch("https://tiles.openfreemap.org/planet", { signal: controller.signal, cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("down");
        verdict = "up";
      })
      .catch(() => {
        // No network at all looks the same as a service that is down; the fallback needs the network too, so nothing is lost.
        verdict = "down";
        setDown(true);
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);
  return down;
}

/** The `theme` and `styles` the Map component needs for a chosen look (default: the saved setting). */
export function useMapStyle(override?: MapStyleChoice) {
  const { mapStyle } = useSettings();
  const look = useLook();
  const choice = override ?? mapStyle ?? "auto";
  const key: MapStyleKey = choice === "auto" ? look : choice;
  const down = useBasemapDown();
  const night = down ? CARTO.dark : OWN.dark;
  const day = down ? CARTO.light : OWN.light;
  return {
    key,
    theme: key === "light" ? ("light" as const) : ("dark" as const),
    styles: { dark: key === "satellite" ? OWN.satellite : night, light: day },
  };
}
