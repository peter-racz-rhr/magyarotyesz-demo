import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Poly, XY } from "./geo";
import { orient } from "./geo";

/*
  Building blocks for the landmark models. Everything is drawn in "local metres": x east, y north, z up,
  with the ground at z = 0. Parts are collected by material and merged, so a whole landmark is a handful
  of draw calls. (The layer's matrix flips north-south for the map, so nothing is mirrored here.)
*/

export type Mat = string;

export class Parts {
  private geos = new Map<Mat, THREE.BufferGeometry[]>();
  private lines = new Map<string, number[]>();

  add(mat: Mat, geometry: THREE.BufferGeometry) {
    // Merging needs the same attributes everywhere.
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g.getAttribute("uv")) g.deleteAttribute("uv");
    if (g.getAttribute("uv1")) g.deleteAttribute("uv1");
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    if (g !== geometry) geometry.dispose();
    (this.geos.get(mat) ?? this.geos.set(mat, []).get(mat)!).push(g);
    return this;
  }

  /** Thin lines (hangers, spokes): pairs of 3D points. */
  line(mat: Mat, segments: [number, number, number][][]) {
    const out = this.lines.get(mat) ?? this.lines.set(mat, []).get(mat)!;
    for (const [a, b] of segments) out.push(a![0], a![1], a![2], b![0], b![1], b![2]);
    return this;
  }

  /** The finished meshes. */
  build(materials: Record<Mat, THREE.Material>, lineMaterials: Record<Mat, THREE.LineBasicMaterial>) {
    const group = new THREE.Group();
    for (const [mat, list] of this.geos) {
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!merged) continue;
      merged.computeBoundingSphere();
      group.add(new THREE.Mesh(merged, materials[mat] ?? materials.stone));
    }
    for (const [mat, pos] of this.lines) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      group.add(new THREE.LineSegments(g, lineMaterials[mat] ?? lineMaterials.line));
    }
    this.geos.clear();
    this.lines.clear();
    return group;
  }
}

const v2 = (p: XY) => new THREE.Vector2(p[0], p[1]);

/** An outline (with courtyards) raised from z0 to z1. */
export function prism(poly: Poly, z0: number, z1: number) {
  const rings = orient(poly);
  const shape = new THREE.Shape(rings[0]!.map(v2));
  for (const hole of rings.slice(1)) shape.holes.push(new THREE.Path(hole.map(v2)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.01, z1 - z0), bevelEnabled: false });
  g.translate(0, 0, z0);
  return g;
}

export function box(cx: number, cy: number, z0: number, sx: number, sy: number, sz: number, angle = 0) {
  const g = new THREE.BoxGeometry(sx, sy, sz);
  g.translate(0, 0, sz / 2);
  g.rotateZ(angle);
  g.translate(cx, cy, z0);
  return g;
}

export function cylinder(cx: number, cy: number, z0: number, z1: number, r0: number, r1 = r0, seg = 16) {
  const g = new THREE.CylinderGeometry(r1, r0, z1 - z0, seg, 1);
  g.rotateX(Math.PI / 2);
  g.translate(cx, cy, (z0 + z1) / 2);
  return g;
}

export const cone = (cx: number, cy: number, z0: number, z1: number, r: number, seg = 8) => cylinder(cx, cy, z0, z1, r, 0.001, seg);

/** A round dome or spire turned from a profile of [radius, height] pairs, base first. */
export function lathe(cx: number, cy: number, z0: number, profile: [number, number][], seg = 20) {
  const g = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), seg);
  g.rotateX(Math.PI / 2);
  g.translate(cx, cy, z0);
  return g;
}

/**
 * A roof with a ridge: length `len` along local x, `width` across, eaves at z0 and the ridge at z1.
 * Placed at (cx, cy) and turned by `angle`.
 */
export function gable(cx: number, cy: number, z0: number, len: number, width: number, z1: number, angle: number) {
  const s = new THREE.Shape([new THREE.Vector2(-width / 2, 0), new THREE.Vector2(width / 2, 0), new THREE.Vector2(0, z1 - z0)]);
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
  // shape x -> y, shape y -> z, extrusion -> x
  g.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0)));
  g.translate(-len / 2, 0, 0);
  g.rotateZ(angle);
  g.translate(cx, cy, z0);
  return g;
}

/** A flat strip along a path (a road deck), `width` wide, from z0 to z1. */
export function ribbon(path: XY[], width: number, z0: number, z1: number) {
  const left: XY[] = [];
  const right: XY[] = [];
  path.forEach((p, i) => {
    const a = path[Math.max(0, i - 1)]!;
    const b = path[Math.min(path.length - 1, i + 1)]!;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    left.push([p[0] + (nx * width) / 2, p[1] + (ny * width) / 2]);
    right.push([p[0] - (nx * width) / 2, p[1] - (ny * width) / 2]);
  });
  const pos: number[] = [];
  const quad = (a: number[], b: number[], c: number[], d: number[]) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let i = 0; i < path.length - 1; i++) {
    const L0 = left[i]!, L1 = left[i + 1]!, R0 = right[i]!, R1 = right[i + 1]!;
    quad([R0[0], R0[1], z1], [R1[0], R1[1], z1], [L1[0], L1[1], z1], [L0[0], L0[1], z1]); // top
    quad([L0[0], L0[1], z0], [L1[0], L1[1], z0], [R1[0], R1[1], z0], [R0[0], R0[1], z0]); // underside
    quad([L0[0], L0[1], z1], [L1[0], L1[1], z1], [L1[0], L1[1], z0], [L0[0], L0[1], z0]); // left edge
    quad([R0[0], R0[1], z0], [R1[0], R1[1], z0], [R1[0], R1[1], z1], [R0[0], R0[1], z1]); // right edge
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** A thin tube through 3D points (a cable or a rim). */
export function tube(points: [number, number, number][], radius: number, radial = 5) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.2);
  return new THREE.TubeGeometry(curve, Math.max(8, points.length * 3), radius, radial, false);
}

/** A bar between two points. */
export function bar(a: [number, number, number], b: [number, number, number], radius: number, seg = 5) {
  const dir = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const len = dir.length();
  const g = new THREE.CylinderGeometry(radius, radius, len, seg, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return g;
}
