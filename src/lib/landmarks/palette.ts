import * as THREE from "three";

export type Variant = "dark" | "light";

/** Colours per material name. The dark map gets slightly muted stone so the models do not glare against it. */
export const PALETTE: Record<Variant, Record<string, string>> = {
  dark: {
    stone: "#b3ab9c",
    stone2: "#c9c1af",
    roof: "#5d6874",
    roofA: "#a55a40",
    roofB: "#cf8a4b",
    copper: "#6e9a8b",
    gold: "#d9b45a",
    steel: "#5e9b69",
    white: "#e6ebf0",
    deck: "#4a4f58",
    cable: "#8a929c",
    cabin: "#8fb7d6",
    rim: "#dfe4ea",
  },
  light: {
    stone: "#e3d9c6",
    stone2: "#f0e8d6",
    roof: "#8b96a2",
    roofA: "#b9623f",
    roofB: "#d99a55",
    copper: "#78a897",
    gold: "#c9a24a",
    steel: "#4f8f5b",
    white: "#fbfcfd",
    deck: "#9a9fa7",
    cable: "#5a616b",
    cabin: "#7aa7ca",
    rim: "#cdd3da",
  },
};

export const LINE_COLORS: Record<Variant, Record<string, string>> = {
  dark: { line: "#a4acb6", lineWhite: "#e6ebf0" },
  light: { line: "#5e656e", lineWhite: "#b8bfc8" },
};

export function makeMaterials(variant: Variant) {
  const materials: Record<string, THREE.MeshLambertMaterial> = {};
  for (const [name, color] of Object.entries(PALETTE[variant])) {
    // The polygon offset lets a model win where its walls sit exactly on the map's own flat-roofed block.
    materials[name] = new THREE.MeshLambertMaterial({ color, flatShading: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  }
  const lines: Record<string, THREE.LineBasicMaterial> = {};
  for (const [name, color] of Object.entries(LINE_COLORS[variant])) lines[name] = new THREE.LineBasicMaterial({ color });
  return { materials, lines };
}

export function recolour(variant: Variant, materials: Record<string, THREE.MeshLambertMaterial>, lines: Record<string, THREE.LineBasicMaterial>) {
  for (const [name, color] of Object.entries(PALETTE[variant])) materials[name]?.color.set(color);
  for (const [name, color] of Object.entries(LINE_COLORS[variant])) lines[name]?.color.set(color);
}
