/*
  Builds the three base maps in public/map-styles/ from the OpenFreeMap forks of the
  OpenMapTiles "Dark Matter" and "Positron" styles (BSD-3 code, CC-BY 4.0 design; see
  the LICENSE files next to this script). Run:  node scripts/map-styles/build.mjs

    night.json      the dark map, recoloured to deep navy water, teal parks and blue roads
    day.json        Positron with a little colour in the water and the parks
    satellite.json  Esri World Imagery with the night map's labels on top
*/
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const load = (name) => JSON.parse(readFileSync(join(here, "src", `${name}.json`), "utf8").replaceAll("__TILEJSON_DOMAIN__", "tiles.openfreemap.org"));
const out = (name, style) => writeFileSync(join(here, "..", "..", "public", "map-styles", `${name}.json`), JSON.stringify(style));

/** Set paint properties of layers by id; a missing id is a mistake worth failing on. */
function recolour(style, table) {
  for (const [id, paint] of Object.entries(table)) {
    const layer = style.layers.find((l) => l.id === id);
    if (!layer) throw new Error(`No layer ${id}`);
    layer.paint = { ...layer.paint, ...paint };
  }
}

/* ------------------------------ night ------------------------------ */
const N = {
  land: "#162338",
  water: "#060e24",
  park: "#0d3a3a",
  wood: "#0b3335",
  building: "#0f1a2d",
  buildingLine: "#26385a",
  minor: "#2f4a6f",
  path: "#2a4363",
  major: "#3d5f8d",
  majorCasing: "#1b2d48",
  motorway: "#4a74a8",
  rail: "#22344f",
  boundary: "#3b5578",
  textRoad: "#9db4d8",
  textRoadMajor: "#b6c8e6",
  textPlace: "#d3deef",
  textPlaceSoft: "#9fb3d3",
  textWater: "#6f8fc4",
  halo: "rgba(10,20,40,0.9)",
};
const night = load("dark");
const placeSoft = ["place_other", "place_suburb", "place_village"];
const placeStrong = ["place_town", "place_city", "place_city_large", "place_state", "place_country_other", "place_country_minor", "place_country_major"];
recolour(night, {
  background: { "background-color": N.land },
  water: { "fill-color": N.water },
  waterway: { "line-color": N.water },
  landcover_ice_shelf: { "fill-color": N.land },
  landcover_glacier: { "fill-color": N.land },
  landuse_residential: { "fill-color": "#192a42" },
  landcover_wood: { "fill-color": N.wood },
  landuse_park: { "fill-color": N.park },
  water_name: { "text-color": N.textWater, "text-halo-color": N.water },
  building: { "fill-color": N.building, "fill-outline-color": N.buildingLine },
  "aeroway-taxiway": { "line-color": "#22344f" },
  "aeroway-runway-casing": { "line-color": "#26385a" },
  "aeroway-area": { "fill-color": "#1b2d48" },
  "aeroway-runway": { "line-color": "#22344f" },
  road_area_pier: { "fill-color": N.land },
  road_pier: { "line-color": N.land },
  highway_path: { "line-color": N.path },
  highway_minor: { "line-color": N.minor },
  highway_major_casing: { "line-color": N.majorCasing },
  highway_major_inner: { "line-color": N.major },
  highway_major_subtle: { "line-color": N.minor },
  highway_motorway_casing: { "line-color": N.majorCasing },
  highway_motorway_inner: { "line-color": N.motorway },
  highway_motorway_subtle: { "line-color": N.minor },
  railway_transit: { "line-color": N.rail },
  railway_transit_dashline: { "line-color": N.land },
  railway_minor: { "line-color": N.rail },
  railway_minor_dashline: { "line-color": N.land },
  railway: { "line-color": N.rail },
  railway_dashline: { "line-color": N.land },
  highway_name_other: { "text-color": N.textRoad, "text-halo-color": N.halo },
  highway_name_motorway: { "text-color": N.textRoadMajor, "text-halo-color": N.halo },
  boundary_state: { "line-color": N.boundary },
  "boundary_country_z0-4": { "line-color": N.boundary },
  "boundary_country_z5-": { "line-color": N.boundary },
  ...Object.fromEntries(placeSoft.map((id) => [id, { "text-color": N.textPlaceSoft, "text-halo-color": N.halo }])),
  ...Object.fromEntries(placeStrong.map((id) => [id, { "text-color": N.textPlace, "text-halo-color": N.halo }])),
});
out("night", night);

/* ------------------------------- day ------------------------------- */
const day = load("positron");
recolour(day, {
  background: { "background-color": "#f2f1ec" },
  park: { "fill-color": "#d8e9d3" },
  landcover_wood: { "fill-color": "#cfe3cb" },
  water: { "fill-color": "#bcd7ee" },
  waterway: { "line-color": "#bcd7ee" },
  building: { "fill-color": "#e6e3da", "fill-outline-color": "#d6d2c6" },
  highway_minor: { "line-color": "#e4e1d8" },
  highway_major_casing: { "line-color": "#d3cfc2" },
  highway_motorway_casing: { "line-color": "#d3cfc2" },
});
out("day", day);

/* ---------------------------- satellite ---------------------------- */
// Imagery from Esri's World Imagery service (attribution is required; see the app's footer
// and imprint). Streets and places are written on top, using the night map's label layers.
const labelIds = ["water_name", "highway_name_other", "highway_name_motorway", ...placeSoft, ...placeStrong];
const labels = labelIds.map((id) => {
  const l = structuredClone(night.layers.find((x) => x.id === id));
  l.paint = { ...l.paint, "text-color": "#ffffff", "text-halo-color": "rgba(0,0,0,0.75)", "text-halo-width": 1.4 };
  return l;
});
const satellite = {
  version: 8,
  name: "Satellite",
  glyphs: night.glyphs,
  sprite: night.sprite,
  sources: {
    imagery: {
      type: "raster",
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
    openmaptiles: night.sources.openmaptiles,
  },
  layers: [
    { id: "background", type: "background", paint: { "background-color": "#0a0f1a" } },
    { id: "imagery", type: "raster", source: "imagery", paint: { "raster-fade-duration": 200 } },
    ...labels,
  ],
};
out("satellite", satellite);
console.log("night", night.layers.length, "day", day.layers.length, "satellite", satellite.layers.length);
