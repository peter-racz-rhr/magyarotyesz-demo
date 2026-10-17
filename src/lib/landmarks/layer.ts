import * as THREE from "three";
import type { CustomLayerInterface, Map as MapLibreMap, MercatorCoordinate as Merc } from "maplibre-gl";
import { MercatorCoordinate } from "maplibre-gl";
import { basilica, castle, matthias, parliament } from "./buildings";
import { chainBridge, elisabethBridge, libertyBridge, margitBridge, plainBridge } from "./bridges";
import { metresBetween, type LngLat } from "./geo";
import { fitBridge, fitBuilding, SPECS, type BridgeFit, type BuildingFit, type Spec } from "./landmarks";
import { makeMaterials, recolour, type Variant } from "./palette";
import { Parts } from "./parts";
import { buildWheel } from "./wheel";

/*
  One custom map layer that draws all the landmark models with three.js, in the same depth buffer as the
  map's own 3D buildings. A landmark is added once its outline has been found in the loaded map tiles
  (see `Landmarks3D`); until then nothing is drawn for it, so a model never floats beside the real place.
*/

export type Entry = {
  id: string;
  origin: LngLat;
  /** Beyond this many metres from the map centre it is not drawn. */
  reach: number;
  make: (materials: Record<string, THREE.MeshLambertMaterial>, lines: Record<string, THREE.LineBasicMaterial>) => { root: THREE.Object3D; update?: (seconds: number) => void };
  scene?: THREE.Scene;
  update?: (seconds: number) => void;
  mercator: Merc;
};

/** The zoom at which the models start to rise from the ground, and where they are fully grown (like the map's blocks). */
const FROM = 14.5;
const TO = 15.7;

export class LandmarkLayer implements CustomLayerInterface {
  id = "magyarotyesz-landmarks";
  type = "custom" as const;
  renderingMode = "3d" as const;

  private map: MapLibreMap | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private camera = new THREE.Camera();
  private entries: Entry[] = [];
  private mats = makeMaterials("dark");
  private variant: Variant;

  constructor(variant: Variant) {
    this.variant = variant;
    this.mats = makeMaterials(variant);
  }

  has(id: string) {
    return this.entries.some((e) => e.id === id);
  }

  add(entry: Omit<Entry, "mercator" | "scene" | "update">) {
    if (this.has(entry.id)) return;
    const full: Entry = { ...entry, mercator: MercatorCoordinate.fromLngLat({ lng: entry.origin[0], lat: entry.origin[1] }, 0) };
    this.entries.push(full);
    if (this.renderer) this.prepare(full);
    this.map?.triggerRepaint();
  }

  setVariant(variant: Variant) {
    this.variant = variant;
    recolour(variant, this.mats.materials, this.mats.lines);
    this.map?.triggerRepaint();
  }

  private prepare(entry: Entry) {
    const { root, update } = entry.make(this.mats.materials, this.mats.lines);
    const scene = new THREE.Scene();
    scene.add(root);
    // Light from the south-west and above (x east, y north, z up).
    scene.add(new THREE.AmbientLight(0xffffff, 1.55));
    const sun = new THREE.DirectionalLight(0xffffff, 1.7);
    sun.position.set(-0.5, -0.6, 1);
    scene.add(sun);
    entry.scene = scene;
    entry.update = update;
  }

  onAdd(map: MapLibreMap, gl: WebGL2RenderingContext) {
    this.map = map;
    this.renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true });
    this.renderer.autoClear = false;
    for (const e of this.entries) this.prepare(e);
  }

  onRemove() {
    for (const e of this.entries) {
      e.scene?.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
      });
      e.scene = undefined;
    }
    this.renderer?.dispose();
    this.renderer = null;
    this.map = null;
  }

  render(_gl: WebGL2RenderingContext, args: { defaultProjectionData: { mainMatrix: ArrayLike<number> } }) {
    const map = this.map;
    const renderer = this.renderer;
    if (!map || !renderer) return;
    const zoom = map.getZoom();
    if (zoom < FROM) return;
    const grow = Math.min(1, (zoom - FROM) / (TO - FROM));
    const centre = map.getCenter();
    const here: LngLat = [centre.lng, centre.lat];
    const main = new THREE.Matrix4().fromArray(Array.from(args.defaultProjectionData.mainMatrix));
    const seconds = performance.now() / 1000;
    let moving = false;
    for (const e of this.entries) {
      if (!e.scene || metresBetween(here, e.origin) > e.reach) continue;
      const s = e.mercator.meterInMercatorCoordinateUnits();
      const local = new THREE.Matrix4().makeTranslation(e.mercator.x, e.mercator.y, e.mercator.z).scale(new THREE.Vector3(s, -s, s * grow)); // north is up in the models, south is down on the map
      this.camera.projectionMatrix = main.clone().multiply(local);
      this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
      if (e.update) {
        e.update(seconds);
        moving = true;
      }
      renderer.resetState();
      renderer.render(e.scene, this.camera);
    }
    // Only the wheel moves by itself; everything else is drawn when the map moves.
    if (moving) map.triggerRepaint();
  }
}

/** Puts the right model on a found outline. */
export function entryForBuilding(spec: Extract<Spec, { type: "building" }>, fit: BuildingFit): Omit<Entry, "mercator" | "scene" | "update"> {
  return {
    id: spec.id,
    origin: fit.origin,
    reach: 260 + Math.max(fit.box.length, fit.box.width),
    make: (materials, lines) => {
      const parts = new Parts();
      if (spec.kind === "parliament") parliament(parts, fit.polys, fit.box);
      else if (spec.kind === "matthias") matthias(parts, fit.polys, fit.box);
      else if (spec.kind === "basilica") basilica(parts, fit.polys, fit.box, fit.plaza ?? [fit.box.cx, fit.box.cy]);
      else castle(parts, fit.polys, fit.box);
      return { root: parts.build(materials, lines) };
    },
  };
}

export function entryForBridge(spec: Extract<Spec, { type: "bridge" }>, fit: BridgeFit): Omit<Entry, "mercator" | "scene" | "update"> {
  return {
    id: spec.id,
    origin: fit.origin,
    reach: 300 + fit.line.length / 2,
    make: (materials, lines) => {
      const parts = new Parts();
      const draw = { chain: chainBridge, liberty: libertyBridge, elisabeth: elisabethBridge, margit: margitBridge }[spec.kind] ?? plainBridge;
      draw(parts, fit.line);
      return { root: parts.build(materials, lines) };
    },
  };
}

export function entryForWheel(spec: Extract<Spec, { type: "wheel" }>): Omit<Entry, "mercator" | "scene" | "update"> {
  return {
    id: spec.id,
    origin: spec.center,
    reach: 500,
    make: (materials, lines) => {
      const { root, update } = buildWheel(materials, lines);
      return { root, update };
    },
  };
}

export { SPECS, fitBridge, fitBuilding };
