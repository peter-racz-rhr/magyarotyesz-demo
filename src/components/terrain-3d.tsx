"use client";

import type * as MapLibreGL from "maplibre-gl";
import { useEffect } from "react";
import { useMap } from "@/components/ui/map";

/*
  Real relief: the ground rises with the land's height (free elevation tiles, Mapzen's "terrarium" set on AWS),
  a little exaggerated so a hill like Gellért-hegy reads as a hill, with soft hill shading under the streets.
  Off, the map is flat again.
*/

const DEM = "lk-dem";
const SHADE_SOURCE = "lk-dem-shade";
const SHADE = "lk-hillshade";
const TILES = ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"];
const EXAGGERATION = 1.8;
const TILT = 55;

function add(map: MapLibreGL.Map, variant: "dark" | "light") {
  if (!map.getSource(DEM)) map.addSource(DEM, { type: "raster-dem", tiles: TILES, tileSize: 256, maxzoom: 15, encoding: "terrarium" });
  // Hill shading reads from its own copy of the source (MapLibre's advice: sharing one with the terrain looks worse).
  if (!map.getSource(SHADE_SOURCE)) map.addSource(SHADE_SOURCE, { type: "raster-dem", tiles: TILES, tileSize: 256, maxzoom: 15, encoding: "terrarium" });
  if (!map.getLayer(SHADE)) {
    // Over the land and water, under the roads and labels: before the first line (or text) layer.
    const firstSymbol = (map.getStyle()?.layers ?? []).find((l) => l.type === "line" || l.type === "symbol")?.id;
    map.addLayer(
      {
        id: SHADE,
        type: "hillshade",
        source: SHADE_SOURCE,
        paint:
          variant === "light"
            ? { "hillshade-shadow-color": "#5c5040", "hillshade-highlight-color": "#ffffff", "hillshade-exaggeration": 0.35 }
            : { "hillshade-shadow-color": "#000000", "hillshade-highlight-color": "#6c7086", "hillshade-exaggeration": 0.55 },
      },
      firstSymbol,
    );
  }
  map.setTerrain({ source: DEM, exaggeration: EXAGGERATION });
}

function remove(map: MapLibreGL.Map) {
  map.setTerrain(null);
  if (map.getLayer(SHADE)) map.removeLayer(SHADE);
  for (const id of [SHADE_SOURCE, DEM]) if (map.getSource(id)) map.removeSource(id);
}

export function Terrain3D({ enabled, variant = "dark" }: { enabled: boolean; variant?: "dark" | "light" }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const apply = () => {
      try {
        if (!enabled) return remove(map);
        // A change of look (dark/light) repaints the shading.
        if (map.getLayer(SHADE)) map.removeLayer(SHADE);
        add(map, variant);
      } catch {
        // A style that is still loading: style.load calls this again.
      }
    };
    apply();
    // A new base style wipes our sources and layers: put them back.
    map.on("style.load", apply);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (enabled && map.getPitch() < 20) map.easeTo({ pitch: TILT, duration: reduce ? 0 : 900 });
    return () => {
      map.off("style.load", apply);
    };
  }, [map, isLoaded, enabled, variant]);

  return null;
}
