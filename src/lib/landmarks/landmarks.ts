import type { Box, Centerline, LngLat, Poly, XY } from "./geo";
import { centerline, metresBetween, orientedBox, polyArea, ringCentroid, open, toLngLat, toLocal } from "./geo";

/** Where the landmarks are, and how to recognise their outlines in the map data. */

export type BuildingKind = "parliament" | "castle" | "matthias" | "basilica";
export type BridgeKind = "chain" | "liberty" | "elisabeth" | "margit";

export type Spec =
  | { id: string; type: "building"; kind: BuildingKind; center: LngLat; radius: number; minArea: number; plaza?: LngLat }
  | { id: string; type: "bridge"; kind: BridgeKind; center: LngLat; match: RegExp }
  | { id: string; type: "wheel"; center: LngLat };

export const SPECS: Spec[] = [
  { id: "parliament", type: "building", kind: "parliament", center: [19.0457, 47.5072], radius: 90, minArea: 2500 },
  { id: "castle", type: "building", kind: "castle", center: [19.0396, 47.4963], radius: 170, minArea: 1200 },
  { id: "matthias", type: "building", kind: "matthias", center: [19.034, 47.5019], radius: 45, minArea: 300 },
  { id: "basilica", type: "building", kind: "basilica", center: [19.0537, 47.5009], radius: 55, minArea: 800, plaza: [19.0529, 47.5003] },
  { id: "chain", type: "bridge", kind: "chain", center: [19.0433, 47.4992], match: /lanchid|chain bridge/ },
  { id: "liberty", type: "bridge", kind: "liberty", center: [19.0507, 47.4873], match: /szabadsag hid|liberty bridge|freedom bridge/ },
  { id: "elisabeth", type: "bridge", kind: "elisabeth", center: [19.0473, 47.4925], match: /erzsebet hid|elisabeth bridge|erzsebet bridge/ },
  { id: "margit", type: "bridge", kind: "margit", center: [19.0436, 47.5158], match: /margit hid|margaret bridge/ },
  { id: "wheel", type: "wheel", center: [19.0521, 47.4983] },
];

type Feature = { geometry: { type: string; coordinates: unknown }; properties?: Record<string, unknown> | null };

/** "Szabadság híd" -> "szabadsag hid", so names match whatever the accents look like. */
export const plain = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function polygonsOf(f: Feature): LngLat[][][] {
  const g = f.geometry;
  if (g.type === "Polygon") return [g.coordinates as LngLat[][]];
  if (g.type === "MultiPolygon") return g.coordinates as LngLat[][][];
  return [];
}

function linesOf(f: Feature): LngLat[][] {
  const g = f.geometry;
  if (g.type === "LineString") return [g.coordinates as LngLat[]];
  if (g.type === "MultiLineString") return g.coordinates as LngLat[][];
  return [];
}

export type BuildingFit = { origin: LngLat; polys: Poly[]; box: Box; plaza?: XY };

/** The outlines of one landmark among all the loaded buildings, and the box they sit in. */
export function fitBuilding(spec: Extract<Spec, { type: "building" }>, features: Feature[]): BuildingFit | null {
  const origin = spec.center;
  const seen = new Set<string>();
  const polys: Poly[] = [];
  for (const f of features) {
    for (const rings of polygonsOf(f)) {
      const poly: Poly = rings.map((r) => open(r.map((p) => toLocal(origin, p))));
      if (!poly[0] || poly[0].length < 3) continue;
      const [cx, cy] = ringCentroid(poly[0]);
      const area = polyArea(poly);
      if (area < spec.minArea || Math.hypot(cx, cy) > spec.radius) continue;
      // A building cut by a tile edge arrives more than once.
      const key = `${Math.round(cx / 2)}:${Math.round(cy / 2)}:${Math.round(area / 40)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      polys.push(poly);
    }
  }
  if (!polys.length) return null;
  const box = orientedBox(polys.flatMap((p) => p[0]!));
  return { origin, polys, box, plaza: spec.plaza ? toLocal(origin, spec.plaza) : undefined };
}

export type BridgeFit = { origin: LngLat; line: Centerline };

/** The road line of a named bridge, from all the little pieces of it in the loaded tiles. */
export function fitBridge(spec: Extract<Spec, { type: "bridge" }>, features: Feature[]): BridgeFit | null {
  const origin = spec.center;
  const lines: XY[][] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    const names = [p.name, p["name:latin"], p.name_en, p["name:en"], p["name:hu"]].map(plain).join(" | ");
    if (!spec.match.test(names)) continue;
    for (const line of linesOf(f)) {
      const local = line.map((q) => toLocal(origin, q));
      const mid = local[Math.floor(local.length / 2)];
      if (mid && Math.hypot(mid[0], mid[1]) < 800) lines.push(local);
    }
  }
  const c = centerline(lines);
  if (!c || c.length < 150) return null;
  // Re-centre on the middle of the bridge so the numbers stay small.
  const mid = c.points[Math.floor(c.points.length / 2)]!;
  return { origin: toLngLat(origin, mid), line: { ...c, points: c.points.map((p) => [p[0] - mid[0], p[1] - mid[1]] as XY) } };
}

export const distanceTo = (a: LngLat, b: LngLat) => metresBetween(a, b);
