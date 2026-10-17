import type { Box, Poly, XY } from "./geo";
import { inset, nearestInside } from "./geo";
import { box, cone, cylinder, gable, lathe, prism, type Parts } from "./parts";

/*
  The big buildings. Each one takes the real outline from the map (so it stands exactly where the flat
  building is) and puts walls, stepped roofs, domes and towers on it. Heights are from memory of the real
  buildings, rounded; these are portraits, not surveys.
*/

const along = (b: Box, a: number, c: number): XY => [b.cx + b.ux * a + b.vx * c, b.cy + b.uy * a + b.vy * c];

/** Walls up to `wall`, then two stepped roof layers, for each outline. */
function shell(parts: Parts, polys: Poly[], wall: number, step = 4.5, roofMat = "roof", wallMat = "stone") {
  for (const p of polys) {
    // A hair outside the map's own block, so the model's walls are the ones you see.
    parts.add(wallMat, prism(inset(p, -0.8), 0, wall));
    parts.add(roofMat, prism(inset(p, 2), wall, wall + step));
    parts.add(roofMat, prism(inset(p, 6.5), wall + step, wall + step * 1.8));
  }
}

/** The Hungarian Parliament: long neo-Gothic block, a tall central dome, pinnacles all round. */
export function parliament(parts: Parts, polys: Poly[], b: Box) {
  const wall = 26;
  shell(parts, polys, wall, 5, "roof", "stone2");
  // Long roof ridges over the two wings, which run the whole length of the building.
  for (const sy of [-1, 1]) {
    const [rx, ry] = along(b, 0, sy * b.width * 0.33);
    parts.add("roofA", gable(rx, ry, wall + 8, b.length * 0.86, b.width * 0.26, wall + 22, b.angle));
  }
  const [dx, dy] = along(b, 0, 0);
  // Dome: a sixteen-sided drum, then the pointed dome (96 m in all).
  parts.add("stone2", cylinder(dx, dy, wall + 4, 62, 11.5, 11.5, 16));
  parts.add(
    "stone2",
    lathe(dx, dy, 62, [[11.5, 0], [12, 3], [10.6, 9], [8.2, 16], [5.2, 23], [2.4, 29], [1, 33], [0, 34]], 16),
  );
  parts.add("gold", cone(dx, dy, 94, 100, 0.5, 6));
  // Pinnacles round the drum.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    parts.add("stone2", cone(dx + Math.cos(a) * 13.6, dy + Math.sin(a) * 13.6, wall + 4, wall + 26, 1.3, 6));
  }
  // Corner towers and the row of pinnacles along both long sides.
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const [x, y] = along(b, sx * (b.length / 2 - 6), sy * (b.width / 2 - 6));
      parts.add("stone2", box(x, y, wall, 6.5, 6.5, 12, b.angle));
      parts.add("roof", cone(x, y, wall + 12, wall + 28, 4.6, 4));
    }
  }
  for (const sy of [-1, 1]) {
    for (let k = -6; k <= 6; k++) {
      if (Math.abs(k) < 2) continue;
      const [x, y] = along(b, (k * b.length) / 15, sy * (b.width / 2 - 3));
      parts.add("stone2", cone(x, y, wall, wall + 15, 1.4, 6));
    }
  }
}

/** Matthias Church: a steep, patterned roof, and the tall tower with its spire at the south-west end. */
export function matthias(parts: Parts, polys: Poly[], b: Box) {
  const wall = 20;
  for (const p of polys) parts.add("stone", prism(inset(p, -0.8), 0, wall));
  // The nave roof, cut into sections so the two tile colours alternate like the real zigzag.
  const n = 10;
  const len = b.length * 0.8;
  for (let i = 0; i < n; i++) {
    const [x, y] = along(b, -len / 2 + ((i + 0.5) * len) / n, 0);
    parts.add(i % 2 ? "roofA" : "roofB", gable(x, y, wall, len / n, b.width * 0.62, wall + 15, b.angle));
  }
  // The tower stands at the end that points furthest south-west.
  const end = (s: number) => along(b, s * (b.length / 2 - 6), 0);
  const [e1, e2] = [end(1), end(-1)];
  const [tx, ty] = e1[0] + e1[1] < e2[0] + e2[1] ? e1 : e2;
  parts.add("stone2", box(tx, ty, 0, 11, 11, 52, b.angle));
  parts.add("stone2", cylinder(tx, ty, 52, 60, 6.2, 6.2, 8));
  parts.add("roofA", cone(tx, ty, 60, 86, 6.8, 8));
  parts.add("gold", cone(tx, ty, 86, 91, 0.45, 5));
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const p = (a: number, c: number): XY => [tx + b.ux * a + b.vx * c, ty + b.uy * a + b.vy * c];
      const [x, y] = p(sx * 5, sy * 5);
      parts.add("stone2", cone(x, y, 52, 63, 1.6, 6));
    }
  }
}

/** St Stephen's Basilica: the great dome in the middle and two towers on the front. */
export function basilica(parts: Parts, polys: Poly[], b: Box, plaza: XY) {
  const wall = 28;
  shell(parts, polys, wall, 4, "roof");
  const [dx, dy] = nearestInside(polys, [b.cx, b.cy]);
  parts.add("stone2", cylinder(dx, dy, wall + 3, 58, 10.5, 10.5, 16));
  parts.add("copper", lathe(dx, dy, 58, [[10.5, 0], [11, 2], [10, 8], [7.6, 15], [4.2, 20], [1.8, 23], [0.8, 25], [0, 26]], 16));
  parts.add("stone2", cylinder(dx, dy, 84, 92, 2.2, 2.2, 8));
  parts.add("gold", cone(dx, dy, 92, 99, 1.1, 6));
  // The front faces the square: the long or the short side, whichever points that way.
  const toward: XY = [plaza[0] - b.cx, plaza[1] - b.cy];
  const alongU = Math.abs(toward[0] * b.ux + toward[1] * b.uy) >= Math.abs(toward[0] * b.vx + toward[1] * b.vy);
  const sign = Math.sign(alongU ? toward[0] * b.ux + toward[1] * b.uy : toward[0] * b.vx + toward[1] * b.vy) || 1;
  const front = alongU ? b.length / 2 : b.width / 2;
  const side = alongU ? b.width / 2 : b.length / 2;
  for (const s of [-1, 1]) {
    const [x, y] = alongU ? along(b, sign * (front - 8), s * (side - 8)) : along(b, s * (side - 8), sign * (front - 8));
    parts.add("stone2", box(x, y, 0, 12, 12, 43, b.angle));
    parts.add("copper", cone(x, y, 43, 53, 7.2, 8));
    parts.add("gold", cone(x, y, 53, 57, 0.5, 5));
  }
}

/** The Royal Palace on Castle Hill: a long, low palace with the green dome of the central wing. */
export function castle(parts: Parts, polys: Poly[], b: Box) {
  const wall = 21;
  shell(parts, polys, wall, 4, "roof");
  const [dx, dy] = nearestInside(polys, [b.cx, b.cy]);
  parts.add("stone2", cylinder(dx, dy, wall + 3, 36, 9, 9, 16));
  parts.add("copper", lathe(dx, dy, 36, [[9, 0], [9.6, 2], [8, 7], [5, 12], [2.2, 15], [0.7, 17], [0, 18]], 16));
  parts.add("gold", cone(dx, dy, 54, 60, 0.7, 6));
  // Corner pavilions on the longest outline.
  const main = polys.reduce((a, p) => (Math.abs(p[0]!.length) > Math.abs(a[0]!.length) ? p : a), polys[0]!);
  const ring = main[0]!;
  const step = Math.max(1, Math.floor(ring.length / 8));
  for (let i = 0; i < ring.length; i += step) {
    const [x, y] = ring[i]!;
    parts.add("stone2", box(x, y, 0, 7, 7, wall + 8, b.angle));
    parts.add("roof", cone(x, y, wall + 8, wall + 16, 5, 4));
  }
}
