"use client";

import { createLocalStore } from "./local-store";

/*
  "Save Budapest": downloads every map piece for the city once, so the map (streets, buildings,
  names) works with no signal at all. The pieces go into the same cache the service worker
  already keeps the map in (public/sw.js), so it answers from there when the network is gone.
  Satellite pictures are never saved: Esri's licence does not allow it.
*/

/** The same cache name as public/sw.js. */
const MAP_CACHE = "magyarotyesz-map-v1";
const TILEJSON = "https://tiles.openfreemap.org/planet";
/** Budapest, the box the server accepts. */
const BBOX = { west: 18.92, south: 47.35, east: 19.34, north: 47.62 };
/** The tiles stop at this zoom; closer views are drawn from them. */
const MAX_ZOOM = 14;
/** Letters, accents (Hungarian ő and ű are in the second block) and punctuation. */
const GLYPH_RANGES = ["0-255", "256-511", "512-767", "8192-8447"];
const CONCURRENCY = 6;

export type OfflineMap = { savedAt: string; files: number; bytes: number } | null;
const store = createLocalStore<OfflineMap>("magyarotyesz:offline-map", null);
export const useOfflineMap = store.useValue;

const tileX = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * 2 ** z);
const tileY = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};

/** Every tile that touches the city, from zoom 0 to `maxZoom`. */
export function tilesFor(maxZoom: number, minZoom = 0) {
  const out: { z: number; x: number; y: number }[] = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    for (let x = tileX(BBOX.west, z); x <= tileX(BBOX.east, z); x++) {
      for (let y = tileY(BBOX.north, z); y <= tileY(BBOX.south, z); y++) out.push({ z, x, y });
    }
  }
  return out;
}

const fill = (template: string, t: { z: number; x: number; y: number }) =>
  template.replace("{z}", String(t.z)).replace("{x}", String(t.x)).replace("{y}", String(t.y));

type StyleJson = {
  sources?: Record<string, { tiles?: string[]; maxzoom?: number; type?: string }>;
  sprite?: string;
  glyphs?: string;
  layers?: { layout?: { "text-font"?: unknown } }[];
};

/** Every address to save: the vector tiles, the low-zoom picture tiles, the sprite and the letters. */
async function listFiles(signal: AbortSignal) {
  const tilejson = (await (await fetch(TILEJSON, { signal })).json()) as { tiles?: string[]; maxzoom?: number };
  const vector = tilejson.tiles?.[0];
  if (!vector) throw new Error("no tile address");
  const zoom = Math.min(MAX_ZOOM, tilejson.maxzoom ?? MAX_ZOOM);
  const urls = tilesFor(zoom).map((t) => fill(vector, t));

  const fonts = new Set<string>();
  let sprite: string | undefined;
  let glyphs: string | undefined;
  for (const name of ["day", "night"]) {
    const style = (await (await fetch(`/map-styles/${name}.json`, { signal })).json()) as StyleJson;
    sprite = style.sprite ?? sprite;
    glyphs = style.glyphs ?? glyphs;
    for (const source of Object.values(style.sources ?? {})) {
      if (source.type === "raster" && source.tiles?.[0]) {
        for (const t of tilesFor(Math.min(source.maxzoom ?? 6, 6))) urls.push(fill(source.tiles[0], t));
      }
    }
    for (const layer of style.layers ?? []) {
      const font = layer.layout?.["text-font"];
      if (Array.isArray(font) && font.every((f) => typeof f === "string")) fonts.add((font as string[]).join(","));
    }
  }
  if (sprite) for (const file of [".json", ".png", "@2x.json", "@2x.png"]) urls.push(sprite + file);
  if (glyphs) for (const font of fonts) for (const range of GLYPH_RANGES) urls.push(glyphs.replace("{fontstack}", encodeURIComponent(font)).replace("{range}", range));
  return [...new Set(urls)];
}

/**
 * Saves the city. `onProgress` gets 0..1. A few failures are fine (a piece nobody ever needs);
 * too many mean the connection is bad, and the whole attempt reports that.
 */
export async function downloadOfflineMap(onProgress: (done: number) => void, signal: AbortSignal) {
  const urls = await listFiles(signal);
  const cache = await caches.open(MAP_CACHE);
  let done = 0;
  let failed = 0;
  let bytes = 0;
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      if (signal.aborted) return;
      const url = urls[next++];
      try {
        const hit = await cache.match(url);
        if (hit) {
          bytes += Number(hit.headers.get("content-length") ?? 0);
        } else {
          // One retry for a piece that did not come the first time.
          let response: Response | null = null;
          for (let attempt = 0; attempt < 2 && !response; attempt++) {
            try {
              const got = await fetch(url, { signal });
              if (got.ok || got.status === 404 || got.status === 204) response = got;
            } catch (e) {
              if (signal.aborted) throw e;
            }
          }
          if (!response) failed++;
          // A tile the server does not have (open sea, nothing there) is a normal answer, not a failure.
          else if (response.ok) {
            bytes += (await response.clone().arrayBuffer()).byteLength;
            await cache.put(url, response);
          }
        }
      } catch (e) {
        if (signal.aborted) throw e;
        failed++;
      }
      onProgress(++done / urls.length);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  if (failed > urls.length * 0.03) throw new Error(`${failed} of ${urls.length} pieces failed`);
  store.set({ savedAt: new Date().toISOString(), files: urls.length, bytes });
}

/** Forgets the saved map (and, with it, the pieces seen while browsing; they come back as you look around). */
export async function removeOfflineMap() {
  await caches.delete(MAP_CACHE);
  store.set(null);
}
