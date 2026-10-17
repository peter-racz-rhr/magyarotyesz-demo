/*
  Small geometry helpers for the 3D landmarks. Everything works in "local metres" around an origin:
  x is east, y is north. (The map is flat here, so that is accurate enough over a kilometre.)
*/

export type XY = [number, number];
export type LngLat = [number, number];
/** A building outline: the outer ring first, then any courtyards. */
export type Poly = XY[][];

const RAD = Math.PI / 180;
const EARTH = 6378137;

export const toLocal = (origin: LngLat, p: LngLat): XY => [
  (p[0] - origin[0]) * RAD * EARTH * Math.cos(origin[1] * RAD),
  (p[1] - origin[1]) * RAD * EARTH,
];

export const toLngLat = (origin: LngLat, p: XY): LngLat => [
  origin[0] + p[0] / (RAD * EARTH * Math.cos(origin[1] * RAD)),
  origin[1] + p[1] / (RAD * EARTH),
];

export const metresBetween = (a: LngLat, b: LngLat) => Math.hypot(...toLocal(a, b));

/** Signed area: positive when the ring runs counter-clockwise. */
export function signedArea(ring: XY[]) {
  let sum = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[(i + 1) % n]!;
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

export const polyArea = (poly: Poly) => Math.abs(signedArea(poly[0]!)) - poly.slice(1).reduce((n, h) => n + Math.abs(signedArea(h)), 0);

export function ringCentroid(ring: XY[]): XY {
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[(i + 1) % n]!;
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  if (Math.abs(a) < 1e-6) return ring[0] ?? [0, 0];
  return [cx / (3 * a), cy / (3 * a)];
}

/** Outer ring counter-clockwise, courtyards clockwise: the material is always on the left. */
export function orient(poly: Poly): Poly {
  return poly.map((ring, i) => {
    const ccw = signedArea(ring) > 0;
    return (i === 0 ? ccw : !ccw) ? ring : [...ring].reverse();
  });
}

/** Drops the repeated closing point that GeoJSON rings carry. */
export const open = (ring: XY[]) => {
  const first = ring[0];
  const last = ring[ring.length - 1];
  return first && last && first[0] === last[0] && first[1] === last[1] ? ring.slice(0, -1) : ring;
};

/**
 * Moves every outline inward by `d` metres (a rough offset: each corner slides along its bisector).
 * Used to step a roof back from the wall, so a flat block gets a layered, roof-like silhouette.
 */
export function inset(poly: Poly, d: number): Poly {
  return orient(poly).map((ring) => {
    const n = ring.length;
    return ring.map((p, i) => {
      const a = ring[(i + n - 1) % n]!;
      const b = ring[(i + 1) % n]!;
      const e1: XY = [p[0] - a[0], p[1] - a[1]];
      const e2: XY = [b[0] - p[0], b[1] - p[1]];
      const l1 = Math.hypot(...e1) || 1;
      const l2 = Math.hypot(...e2) || 1;
      // Left-hand normals of both edges (the material side).
      const n1: XY = [-e1[1] / l1, e1[0] / l1];
      const n2: XY = [-e2[1] / l2, e2[0] / l2];
      let bx = n1[0] + n2[0];
      let by = n1[1] + n2[1];
      const bl = Math.hypot(bx, by) || 1;
      bx /= bl;
      by /= bl;
      // A sharp corner needs to travel further along its bisector to keep the edges `d` apart.
      const k = Math.min(2.2, 1 / Math.max(0.45, bx * n1[0] + by * n1[1]));
      return [p[0] + bx * d * k, p[1] + by * d * k] as XY;
    });
  });
}

export function convexHull(points: XY[]): XY[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o: XY, a: XY, b: XY) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: XY[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: XY[] = [];
  for (const p of [...pts].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

export type Box = {
  /** Centre. */
  cx: number;
  cy: number;
  /** Unit vector along the long side, and the one across it. */
  ux: number;
  uy: number;
  vx: number;
  vy: number;
  length: number;
  width: number;
  /** Heading of the long side in radians, counter-clockwise from east. */
  angle: number;
};

/** The smallest rectangle (at any angle) around some points: where the building sits and which way it points. */
export function orientedBox(points: XY[]): Box {
  const hull = convexHull(points);
  let best: Box | null = null;
  let bestArea = Infinity;
  for (let i = 0; i < hull.length; i++) {
    const a = hull[i]!;
    const b = hull[(i + 1) % hull.length]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-6) continue;
    const ux = (b[0] - a[0]) / len;
    const uy = (b[1] - a[1]) / len;
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const p of hull) {
      const u = p[0] * ux + p[1] * uy;
      const v = -p[0] * uy + p[1] * ux;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    const area = (maxU - minU) * (maxV - minV);
    if (area < bestArea) {
      bestArea = area;
      const mu = (minU + maxU) / 2;
      const mv = (minV + maxV) / 2;
      let length = maxU - minU;
      let width = maxV - minV;
      let lx = ux;
      let ly = uy;
      if (width > length) {
        [length, width] = [width, length];
        [lx, ly] = [-uy, ux];
      }
      best = { cx: mu * ux - mv * uy, cy: mu * uy + mv * ux, ux: lx, uy: ly, vx: -ly, vy: lx, length, width, angle: Math.atan2(ly, lx) };
    }
  }
  return best ?? { cx: 0, cy: 0, ux: 1, uy: 0, vx: 0, vy: 1, length: 1, width: 1, angle: 0 };
}

export function pointInRing(p: XY, ring: XY[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export const pointInPoly = (p: XY, poly: Poly) => pointInRing(p, poly[0]!) && !poly.slice(1).some((h) => pointInRing(p, h));

/** The spot on the building (not in a courtyard) nearest to a wanted point. */
export function nearestInside(polys: Poly[], want: XY, step = 5): XY {
  let best: XY = want;
  let bestD = Infinity;
  const all = polys.flatMap((p) => p[0]!);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  if (!xs.length) return want;
  for (let x = Math.min(...xs); x <= Math.max(...xs); x += step) {
    for (let y = Math.min(...ys); y <= Math.max(...ys); y += step) {
      if (!polys.some((poly) => pointInPoly([x, y], poly))) continue;
      const d = Math.hypot(x - want[0], y - want[1]);
      if (d < bestD) {
        bestD = d;
        best = [x, y];
      }
    }
  }
  return best;
}

export type Centerline = { points: XY[]; length: number; width: number };

/**
 * One centre line from all the little line pieces a bridge is made of: the pieces are put in order
 * along their main direction, and each stretch gets the average sideways position of its points.
 */
export function centerline(lines: XY[][]): Centerline | null {
  const pts = lines.flat();
  if (pts.length < 2) return null;
  const mx = pts.reduce((n, p) => n + p[0], 0) / pts.length;
  const my = pts.reduce((n, p) => n + p[1], 0) / pts.length;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (const p of pts) {
    const dx = p[0] - mx;
    const dy = p[1] - my;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  // Densify the pieces so a long straight segment counts along its whole length, not only at its ends.
  const dense: { t: number; v: number }[] = [];
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i]!;
      const b = line[i + 1]!;
      const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 4));
      for (let k = 0; k <= steps; k++) {
        const x = a[0] + ((b[0] - a[0]) * k) / steps - mx;
        const y = a[1] + ((b[1] - a[1]) * k) / steps - my;
        dense.push({ t: x * ux + y * uy, v: -x * uy + y * ux });
      }
    }
  }
  const tMin = Math.min(...dense.map((d) => d.t));
  const tMax = Math.max(...dense.map((d) => d.t));
  const length = tMax - tMin;
  if (length < 30) return null;
  const bins = Math.max(2, Math.round(length / 12));
  const sums = Array.from({ length: bins + 1 }, () => ({ v: 0, n: 0 }));
  for (const d of dense) {
    const i = Math.round(((d.t - tMin) / length) * bins);
    sums[i]!.v += d.v;
    sums[i]!.n += 1;
  }
  const vs = dense.map((d) => d.v);
  const width = Math.max(...vs) - Math.min(...vs);
  const points: XY[] = [];
  let last = 0;
  sums.forEach((s, i) => {
    const v = s.n ? s.v / s.n : last;
    last = v;
    const t = tMin + (length * i) / bins;
    points.push([mx + t * ux - v * uy, my + t * uy + v * ux]);
  });
  return { points, length, width };
}

/** A point `s` metres along a polyline, with the direction it is heading there. */
export function along(points: XY[], s: number) {
  let left = s;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= len || i === points.length - 2) {
      const f = len ? Math.min(1, Math.max(0, left / len)) : 0;
      return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, dx: len ? (b[0] - a[0]) / len : 1, dy: len ? (b[1] - a[1]) / len : 0 };
    }
    left -= len;
  }
  const p = points[0] ?? [0, 0];
  return { x: p[0], y: p[1], dx: 1, dy: 0 };
}

export const pathLength = (points: XY[]) => points.slice(1).reduce((n, p, i) => n + Math.hypot(p[0] - points[i]![0], p[1] - points[i]![1]), 0);
