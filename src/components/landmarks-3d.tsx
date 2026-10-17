"use client";

import type * as MapLibreGL from "maplibre-gl";
import { useEffect, useRef } from "react";
import { findBuildings } from "@/components/buildings-3d";
import { useMap } from "@/components/ui/map";
import type { LandmarkLayer } from "@/lib/landmarks/layer";
import type { LngLat } from "@/lib/landmarks/geo";

/*
  Better 3D models for Budapest's best-known places (the Parliament, Buda Castle, the two big churches, the
  big bridges and the wheel). They are drawn on top of the map's own blocks, and they are placed by looking
  for the real building and bridge outlines in the map tiles that are already loaded, so each model stands
  exactly where the real thing is. Only when the 3D buildings are on, and never over the satellite picture.
  The 3D library loads the first time the map comes near one of these places.
*/

/** How close (metres) the map centre has to be before a landmark is looked for. */
const NEAR = 3500;
const TRIES = 8;

export function Landmarks3D({ enabled, variant }: { enabled: boolean; variant: "dark" | "light" }) {
  const { map, isLoaded } = useMap();
  const layerRef = useRef<LandmarkLayer | null>(null);
  const variantRef = useRef(variant);

  useEffect(() => {
    variantRef.current = variant;
    layerRef.current?.setVariant(variant);
  }, [variant]);

  useEffect(() => {
    // Handy for looking around by hand while developing.
    if (map && process.env.NODE_ENV !== "production") (window as unknown as { __map?: unknown }).__map = map;
  }, [map]);

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return;
    let alive = true;
    const attempts = new Map<string, number>();
    let busy = false;

    const ensureLayer = (layer: LandmarkLayer) => {
      if (map.getLayer(layer.id)) return;
      // Above the map's own 3D blocks, so the models win wherever they overlap.
      map.addLayer(layer);
    };

    const discover = async () => {
      if (busy || !alive) return;
      const zoom = map.getZoom();
      if (zoom < 14.2) return;
      const centre = map.getCenter();
      const here: LngLat = [centre.lng, centre.lat];
      busy = true;
      try {
        const mod = await import("@/lib/landmarks/layer");
        const { metresBetween } = await import("@/lib/landmarks/geo");
        if (!alive) return;
        const pending = mod.SPECS.filter((s) => !layerRef.current?.has(s.id) && (attempts.get(s.id) ?? 0) < TRIES && metresBetween(here, s.center) < NEAR);
        if (!pending.length) return;
        if (!layerRef.current) layerRef.current = new mod.LandmarkLayer(variantRef.current);
        const layer = layerRef.current;
        const base = findBuildings(map);
        const source = base?.source;
        const read = (sourceLayer: string, filter?: MapLibreGL.FilterSpecification) =>
          source ? (map.querySourceFeatures(source, { sourceLayer, ...(filter ? { filter } : {}) }) as unknown as Parameters<typeof mod.fitBuilding>[1]) : [];
        let buildings: ReturnType<typeof read> | null = null;
        let roads: ReturnType<typeof read> | null = null;
        for (const spec of pending) {
          attempts.set(spec.id, (attempts.get(spec.id) ?? 0) + 1);
          if (spec.type === "wheel") {
            layer.add(mod.entryForWheel(spec));
          } else if (spec.type === "building") {
            buildings ??= read(base?.sourceLayer ?? "building");
            const fit = mod.fitBuilding(spec, buildings);
            if (fit) layer.add(mod.entryForBuilding(spec, fit));
          } else {
            roads ??= read("transportation_name", ["==", ["get", "brunnel"], "bridge"]);
            const fit = mod.fitBridge(spec, roads);
            if (fit) layer.add(mod.entryForBridge(spec, fit));
          }
        }
        ensureLayer(layer);
      } finally {
        busy = false;
      }
    };

    const onStyle = () => {
      const layer = layerRef.current;
      if (layer) setTimeout(() => alive && ensureLayer(layer), 0);
    };
    map.on("moveend", discover);
    map.on("idle", discover);
    map.on("style.load", onStyle);
    void discover();
    return () => {
      alive = false;
      map.off("moveend", discover);
      map.off("idle", discover);
      map.off("style.load", onStyle);
      const layer = layerRef.current;
      if (layer && map.getLayer(layer.id)) map.removeLayer(layer.id);
      layerRef.current = null;
    };
  }, [map, isLoaded, enabled]);

  return null;
}
