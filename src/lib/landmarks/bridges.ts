import type { Centerline, XY } from "./geo";
import { along, pathLength } from "./geo";
import { bar, box, cone, cylinder, ribbon, tube, type Parts } from "./parts";

/*
  The Danube bridges. Each one follows the real road line from the map; the towers, cables and arches
  are put at the proportions of the real bridge (a fraction of its length), at a believable height.
*/

type P3 = [number, number, number];

/** Position beside the centre line: `s` metres along, `n` metres to the left, `z` up. */
function frame(path: XY[]) {
  return (s: number, n: number, z: number): P3 => {
    const a = along(path, s);
    return [a.x - a.dy * n, a.y + a.dx * n, z];
  };
}

const heading = (path: XY[], s: number) => {
  const a = along(path, s);
  return Math.atan2(a.dy, a.dx);
};

/** A curve that hangs between two heights with a sag in the middle. */
function hanging(from: P3, to: P3, sag: number, n = 14): P3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    return [from[0] + (to[0] - from[0]) * u, from[1] + (to[1] - from[1]) * u, from[2] + (to[2] - from[2]) * u - sag * 4 * u * (1 - u)] as P3;
  });
}

const lerpP = (a: P3, b: P3, u: number): P3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];

/** Széchenyi Chain Bridge: stone gateways with chains hanging from them. */
export function chainBridge(parts: Parts, c: Centerline) {
  const L = pathLength(c.points);
  const at = frame(c.points);
  const zD = 9;
  const w = 14.5;
  parts.add("deck", ribbon(c.points, w, zD - 1.6, zD));
  parts.add("stone", ribbon(c.points, w + 1.2, zD - 0.2, zD + 0.2));
  const towers = [0.231 * L, 0.769 * L];
  const out = w / 2 + 2.4;
  for (const s of towers) {
    const h = heading(c.points, s);
    const [cx, cy] = at(s, 0, 0);
    // Pier under the deck, then the gateway: two pillars joined by a beam high above the road.
    parts.add("stone", box(cx, cy, 0, 11, w + 12, zD, h));
    for (const side of [-1, 1]) {
      const [x, y] = at(s, side * out, 0);
      parts.add("stone2", box(x, y, zD - 1, 5.2, 4.4, 46 - zD + 1, h));
    }
    parts.add("stone2", box(cx, cy, 36, 5.2, w + 9.5, 10, h));
    parts.add("stone", box(cx, cy, 46, 6, w + 10.5, 1.6, h));
  }
  // The chains: from the end anchors up over each gateway and across the river.
  const top = 46.5;
  for (const side of [-1, 1]) {
    const n = side * out;
    const pts = [at(0, n, zD + 1), at(towers[0]!, n, top), at(towers[1]!, n, top), at(L, n, zD + 1)];
    const spans: [P3, P3, number][] = [[pts[0]!, pts[1]!, 6], [pts[1]!, pts[2]!, 28], [pts[2]!, pts[3]!, 6]];
    for (const [a, b, sag] of spans) {
      const chain = hanging(a, b, sag);
      parts.add("cable", tube(chain, 0.5, 5));
      // Hangers down to the road.
      const segs: P3[][] = [];
      const count = Math.max(3, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 7));
      for (let k = 1; k < count; k++) {
        const p = lerpP(a, b, k / count);
        const z = a[2] + (b[2] - a[2]) * (k / count) - sag * 4 * (k / count) * (1 - k / count);
        segs.push([[p[0], p[1], z], [p[0], p[1], zD + 0.4]]);
      }
      parts.line("line", segs);
    }
  }
}

/** Szabadság híd: the green steel bridge, tall at its two main piers and low in the middle. */
export function libertyBridge(parts: Parts, c: Centerline) {
  const L = pathLength(c.points);
  const at = frame(c.points);
  const zD = 9;
  const w = 20;
  parts.add("deck", ribbon(c.points, w, zD - 1.8, zD));
  const piers = [0.225 * L, 0.775 * L];
  /** Height of the steel frame above the road. */
  const frameH = (s: number) => {
    const [p1, p2] = piers;
    if (s <= p1!) return 5 + 25 * Math.pow(s / p1!, 1.7);
    if (s >= p2!) return 5 + 25 * Math.pow((L - s) / (L - p2!), 1.7);
    const u = (s - p1!) / (p2! - p1!);
    return 30 - 19 * Math.sin(u * Math.PI);
  };
  const steps = Math.max(20, Math.round(L / 6));
  for (const side of [-1, 1]) {
    const n = side * (w / 2 - 0.8);
    const top: P3[] = [];
    const bottom: P3[] = [];
    for (let i = 0; i <= steps; i++) {
      const s = (L * i) / steps;
      top.push(at(s, n, zD + frameH(s)));
      bottom.push(at(s, n, zD));
    }
    parts.add("steel", tube(top, 0.9, 6));
    const segs: P3[][] = [];
    top.forEach((p, i) => {
      segs.push([p, bottom[i]!]);
      if (i < top.length - 1) segs.push([i % 2 ? bottom[i]! : p, i % 2 ? top[i + 1]! : bottom[i + 1]!]);
    });
    parts.line("line", segs);
  }
  for (const s of piers) {
    const h = heading(c.points, s);
    const [cx, cy] = at(s, 0, 0);
    parts.add("stone", box(cx, cy, 0, 8, w + 4, zD, h));
    for (const side of [-1, 1]) {
      const [x, y] = at(s, side * (w / 2 - 0.8), 0);
      parts.add("steel", box(x, y, zD, 4, 3, 30, h));
      parts.add("gold", cone(x, y, zD + 30, zD + 36, 1.4, 6));
    }
    const [bx, by] = at(s, 0, 0);
    parts.add("steel", box(bx, by, zD + 28, 3.4, w - 1, 2.4, h));
  }
}

/** Erzsébet híd: the white suspension bridge, a single long span between two slim pylons. */
export function elisabethBridge(parts: Parts, c: Centerline) {
  const L = pathLength(c.points);
  const at = frame(c.points);
  const zD = 10;
  const w = 27;
  parts.add("deck", ribbon(c.points, w, zD - 1.5, zD));
  const towers = [0.116 * L, 0.884 * L];
  const topZ = 56;
  for (const s of towers) {
    const h = heading(c.points, s);
    const [cx, cy] = at(s, 0, 0);
    parts.add("stone", box(cx, cy, 0, 10, w + 4, zD, h));
    for (const side of [-1, 1]) {
      // Each pylon leans in a little towards the top.
      parts.add("white", bar(at(s, side * (w / 2 + 1.5), 0), at(s, side * (w / 2 - 0.6), topZ), 1.5, 6));
    }
    parts.add("white", bar(at(s, -(w / 2 - 0.6), topZ - 4), at(s, w / 2 - 0.6, topZ - 4), 0.9, 5));
    parts.add("white", bar(at(s, -(w / 2 + 0.2), 28), at(s, w / 2 + 0.2, 28), 0.8, 5));
  }
  for (const side of [-1, 1]) {
    const n = side * (w / 2 - 0.4);
    const t0 = at(towers[0]!, n, topZ);
    const t1 = at(towers[1]!, n, topZ);
    const main = hanging(t0, t1, 36);
    const back0 = hanging(at(0, n, zD + 1), t0, 4);
    const back1 = hanging(t1, at(L, n, zD + 1), 4);
    for (const cable of [main, back0, back1]) parts.add("white", tube(cable, 0.55, 5));
    const segs: P3[][] = [];
    for (let i = 1; i < main.length - 1; i++) segs.push([main[i]!, [main[i]![0], main[i]![1], zD + 0.3]]);
    parts.line("lineWhite", segs);
  }
}

/** Margit híd: a long bridge with a row of steel arches under the road. */
export function margitBridge(parts: Parts, c: Centerline) {
  const L = pathLength(c.points);
  const at = frame(c.points);
  const zD = 11;
  const w = 25;
  parts.add("deck", ribbon(c.points, w, zD - 1.4, zD));
  const spans = Math.max(3, Math.round(L / 75));
  for (let i = 0; i <= spans; i++) {
    const s = (L * i) / spans;
    const h = heading(c.points, s);
    const [x, y] = at(s, 0, 0);
    parts.add("stone", box(x, y, 0, 7, w - 4, zD - 1, h));
  }
  for (let i = 0; i < spans; i++) {
    const s0 = (L * i) / spans;
    const s1 = (L * (i + 1)) / spans;
    for (const side of [-1, 1]) {
      const n = side * (w / 2 - 3);
      const rib: P3[] = Array.from({ length: 13 }, (_, k) => {
        const u = k / 12;
        return at(s0 + (s1 - s0) * u, n, 3 + (zD - 3.5) * Math.sin(u * Math.PI) * 0.8 + 0.4);
      });
      parts.add("stone2", tube(rib, 0.85, 6));
    }
  }
}

/** A deck and piers for any other bridge, so none of the big ones is left flat. */
export function plainBridge(parts: Parts, c: Centerline) {
  const L = pathLength(c.points);
  const at = frame(c.points);
  const zD = 8;
  const w = Math.max(12, Math.min(26, c.width + 10));
  parts.add("deck", ribbon(c.points, w, zD - 1.4, zD));
  const spans = Math.max(2, Math.round(L / 70));
  for (let i = 1; i < spans; i++) {
    const s = (L * i) / spans;
    const [x, y] = at(s, 0, 0);
    parts.add("stone", cylinder(x, y, 0, zD - 1, 2.2, 2.6, 10));
  }
}
