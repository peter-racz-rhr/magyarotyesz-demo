"use client";

import type * as MapLibreGL from "maplibre-gl";
import { useEffect } from "react";
import { useMap } from "@/components/ui/map";

/*
  Raises the map's buildings as 3D blocks. The base map already carries
  the building outlines (and their heights, where OpenStreetMap knows them),
  so this adds one extrusion layer on top of the same data. It fades in as
  you zoom in, is shaded so the walls read against the dark map, and tilts
  the map a little when switched on. Off, the layer is removed and the map
  goes back to flat.
*/

const LAYER = "magyarotyesz-buildings-3d";
const TILT = 55;

/** Where the base style keeps its buildings: the first layer that draws them. */
function findBuildings(map: MapLibreGL.Map) {
  const layers = map.getStyle()?.layers ?? [];
  const found = layers.find((l) => "source-layer" in l && l["source-layer"] === "building") ?? layers.find((l) => /^building/.test(l.id) && "source" in l);
  return found && "source" in found && found.source ? { source: found.source as string, sourceLayer: (found as { "source-layer"?: string })["source-layer"], id: found.id } : null;
}

/** On the light map the blocks are cream and white; a grey block would be far too harsh there. */
function colours(variant: "dark" | "light") {
  const height = ["coalesce", ["to-number", ["get", "render_height"]], ["to-number", ["get", "height"]], 12];
  return variant === "light"
    ? ["interpolate", ["linear"], height, 0, "#fcfaf5", 25, "#f5f0e4", 70, "#ece5d4"]
    : ["interpolate", ["linear"], height, 0, "#1d2026", 25, "#2a2f38", 70, "#3a414d"];
}

function add(map: MapLibreGL.Map, variant: "dark" | "light") {
  if (map.getLayer(LAYER)) return;
  const base = findBuildings(map);
  if (!base) return;
  // Heights as the map data names them; many buildings have none, so give those a believable one.
  const height = ["coalesce", ["to-number", ["get", "render_height"]], ["to-number", ["get", "height"]], 12];
  const floor = ["coalesce", ["to-number", ["get", "render_min_height"]], ["to-number", ["get", "min_height"]], 0];
  map.addLayer({
    id: LAYER,
    type: "fill-extrusion",
    source: base.source,
    ...(base.sourceLayer ? { "source-layer": base.sourceLayer } : {}),
    minzoom: 14.5,
    paint: {
      // Taller buildings are a little lighter, so a skyline has depth even in the dark.
      "fill-extrusion-color": colours(variant),
      // Rise from the ground as you zoom in instead of popping up.
      "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14.5, 0, 15.7, height],
      "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 14.5, 0, 15.7, floor],
      "fill-extrusion-opacity": 0.94,
      "fill-extrusion-vertical-gradient": variant !== "light", // cream walls stay even, no dark foot
    },
  } as unknown as MapLibreGL.FillExtrusionLayerSpecification);
  // The flat outlines would only poke through the roofs.
  try {
    map.setLayoutProperty(base.id, "visibility", "none");
  } catch {
    // A style without that layer: nothing to hide.
  }
}

function remove(map: MapLibreGL.Map) {
  if (map.getLayer(LAYER)) map.removeLayer(LAYER);
  const base = findBuildings(map);
  if (base) {
    try {
      map.setLayoutProperty(base.id, "visibility", "visible");
    } catch {
      // Ignore.
    }
  }
}

export function Buildings3D({ enabled, variant = "dark" }: { enabled: boolean; variant?: "dark" | "light" }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (!map || !isLoaded) return;
    const apply = () => {
      if (!enabled) return remove(map);
      // A change of look (dark/light) repaints the blocks.
      if (map.getLayer(LAYER)) map.removeLayer(LAYER);
      add(map, variant);
    };
    apply();
    // A new base style (light/dark) wipes our layer: put it back.
    map.on("style.load", apply);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (enabled && map.getPitch() < 20) map.easeTo({ pitch: TILT, duration: reduce ? 0 : 900 });
    if (!enabled && map.getPitch() > 0) map.easeTo({ pitch: 0, duration: reduce ? 0 : 600 });
    return () => {
      map.off("style.load", apply);
    };
  }, [map, isLoaded, enabled, variant]);

  return null;
}
