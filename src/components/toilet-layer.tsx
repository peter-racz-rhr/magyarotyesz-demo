"use client";

import type * as MapLibreGL from "maplibre-gl";
import { useEffect, useMemo, useRef } from "react";
import { useMap } from "@/components/ui/map";
import { isOpen, isStale, trust, type Toilet } from "@/lib/toilets";

/*
  All the toilets, drawn by the map itself (WebGL) instead of one HTML element each: thousands of
  places stay smooth. Zoomed out, nearby places merge into a bubble with their number; tap it to zoom
  in. Each dot is coloured like the card's health dot (green works, amber unsure, red reported); a
  place nobody has checked yet (most imported public toilets) is a quiet grey, so the city doesn't
  light up. A paid place carries a small amber tag.
*/

const SOURCE = "magyarotyesz-toilets";
export const TOILET_LAYERS = { clusters: "mt-clusters", count: "mt-cluster-count", dots: "mt-dots", paid: "mt-paid", hit: "mt-hit" } as const;
/** The layers a tap can land on: the map's own "tap to add" ignores taps on these. */
export const TAPPABLE = [TOILET_LAYERS.hit, TOILET_LAYERS.clusters];

const css = (name: string, fallback: string) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

function features(toilets: Toilet[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: toilets.map((t) => ({
      type: "Feature",
      id: undefined,
      geometry: { type: "Point", coordinates: [t.longitude, t.latitude] },
      properties: {
        id: t.id,
        // Nobody has voted and there's no code: an unchecked public place.
        plain: t.confirms + t.reports === 0 && t.code === "" ? 1 : 0,
        trust: trust(t),
        dim: isOpen(t) === false || isStale(t) ? 1 : 0,
        paid: t.access === "paid" ? 1 : 0,
      },
    })),
  };
}

function addLayers(map: MapLibreGL.Map, data: GeoJSON.FeatureCollection) {
  if (map.getSource(SOURCE)) return;
  const good = css("--good", "#4fe08a"), stale = css("--stale", "#ffc247"), bad = css("--bad", "#ff5f57");
  const night = css("--night", "#121212"), ink = css("--ink", "#f4efe9"), haze = css("--haze", "#9a938c");
  map.addSource(SOURCE, { type: "geojson", data, cluster: true, clusterMaxZoom: 13, clusterRadius: 56 });

  map.addLayer({
    id: TOILET_LAYERS.clusters,
    type: "circle",
    source: SOURCE,
    filter: ["has", "point_count"],
    paint: {
      // Quiet bubbles: the number says how many, the colour doesn't shout.
      "circle-color": night,
      "circle-opacity": 0.88,
      "circle-radius": ["step", ["get", "point_count"], 12, 10, 14, 50, 17, 200, 20, 1000, 24],
      "circle-stroke-color": haze,
      "circle-stroke-width": 1.5,
      "circle-stroke-opacity": 0.55,
      "circle-pitch-scale": "viewport",
    },
  });
  // The number needs the base map's font; a style without text (satellite) just shows the bubbles.
  const font = (map.getStyle()?.layers ?? []).map((l) => (l.type === "symbol" ? (l.layout?.["text-font"] as string[] | undefined) : undefined)).find((f) => Array.isArray(f));
  if (map.getStyle()?.glyphs && font) {
    map.addLayer({
      id: TOILET_LAYERS.count,
      type: "symbol",
      source: SOURCE,
      filter: ["has", "point_count"],
      layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": font, "text-size": 12, "text-allow-overlap": true },
      paint: { "text-color": ink },
    });
  }

  map.addLayer({
    id: TOILET_LAYERS.dots,
    type: "circle",
    source: SOURCE,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": ["case", ["==", ["get", "plain"], 1], haze, ["interpolate", ["linear"], ["get", "trust"], 0, bad, 0.5, stale, 1, good]],
      "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, ["case", ["==", ["get", "plain"], 1], 3, 4], 15, ["case", ["==", ["get", "plain"], 1], 5, 6.5], 18, 8],
      "circle-stroke-color": night,
      "circle-stroke-width": 2,
      "circle-opacity": ["case", ["==", ["get", "dim"], 1], 0.45, ["==", ["get", "plain"], 1], 0.8, 1],
      "circle-stroke-opacity": ["case", ["==", ["get", "dim"], 1], 0.45, 1],
      "circle-pitch-scale": "viewport",
    },
  });
  map.addLayer({
    id: TOILET_LAYERS.paid,
    type: "circle",
    source: SOURCE,
    filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "paid"], 1]],
    minzoom: 13,
    paint: { "circle-color": stale, "circle-radius": 3, "circle-translate": [6, -6], "circle-stroke-color": night, "circle-stroke-width": 1.5, "circle-pitch-scale": "viewport" },
  });
  // A finger-sized, invisible target around each dot.
  map.addLayer({
    id: TOILET_LAYERS.hit,
    type: "circle",
    source: SOURCE,
    filter: ["!", ["has", "point_count"]],
    paint: { "circle-radius": 18, "circle-color": "#000", "circle-opacity": 0, "circle-pitch-scale": "viewport" },
  });
}

/** Draws the toilets on the map; a tap on a dot calls onOpen with that toilet. */
export function ToiletLayer({ toilets, onOpen, theme }: { toilets: Toilet[]; onOpen: (toilet: Toilet) => void; theme: string }) {
  const { map, isLoaded } = useMap();
  // Only rebuilt when a place, a vote or a filter actually changed.
  const key = toilets.map((t) => t.id + t.confirms + t.reports + t.access + t.code.length).join();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => features(toilets), [key]);
  const byId = useRef(new Map<string, Toilet>());
  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
    byId.current = new Map(toilets.map((t) => [t.id, t]));
  });
  const dataRef = useRef(data);

  // Fresh data: hand it to the source (cheap; the map re-clusters on its side).
  useEffect(() => {
    dataRef.current = data;
    const source = map?.getSource(SOURCE) as MapLibreGL.GeoJSONSource | undefined;
    source?.setData(data);
  }, [map, data]);

  useEffect(() => {
    if (!map || !isLoaded) return;
    const apply = () => {
      // Colours follow the theme: rebuild the layers with the current ones.
      for (const id of Object.values(TOILET_LAYERS)) if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(SOURCE)) map.removeSource(SOURCE);
      addLayers(map, dataRef.current);
    };
    apply();
    map.on("style.load", apply);

    const openDot = (e: MapLibreGL.MapLayerMouseEvent) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      const toilet = id ? byId.current.get(id) : undefined;
      if (toilet) onOpenRef.current(toilet);
    };
    const openCluster = async (e: MapLibreGL.MapLayerMouseEvent) => {
      const feature = e.features?.[0];
      const source = map.getSource(SOURCE) as MapLibreGL.GeoJSONSource | undefined;
      if (!feature || !source) return;
      const zoom = await source.getClusterExpansionZoom(feature.properties?.cluster_id as number);
      map.easeTo({ center: (feature.geometry as GeoJSON.Point).coordinates as [number, number], zoom: Math.min(zoom + 0.5, 17), duration: 500 });
    };
    const pointer = () => (map.getCanvas().style.cursor = "pointer");
    const plain = () => (map.getCanvas().style.cursor = "");
    map.on("click", TOILET_LAYERS.hit, openDot);
    map.on("click", TOILET_LAYERS.clusters, openCluster);
    for (const id of TAPPABLE) {
      map.on("mouseenter", id, pointer);
      map.on("mouseleave", id, plain);
    }
    return () => {
      map.off("style.load", apply);
      map.off("click", TOILET_LAYERS.hit, openDot);
      map.off("click", TOILET_LAYERS.clusters, openCluster);
      for (const id of TAPPABLE) {
        map.off("mouseenter", id, pointer);
        map.off("mouseleave", id, plain);
      }
    };
  }, [map, isLoaded, theme]);

  return null;
}
