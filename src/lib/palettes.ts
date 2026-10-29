/*
  The colour palettes. The CSS that applies them is in globals.css, keyed by
  <html data-palette>; this list gives each one's main colours in both looks, so the
  picker in Settings can draw a small preview of it.
*/
export type PaletteLook = {
  /** The page. */
  page: string;
  /** Cards and fields. */
  card: string;
  /** Borders. */
  edge: string;
  /** Text. */
  ink: string;
  /** Secondary text. */
  haze: string;
  /** The accent: links, switches, selections. */
  brand: string;
  /** The glass bar, as a flat colour. */
  glass: string;
  /** The Solid look. */
  solid: string;
};

export const PALETTES = [
  { id: "classic", light: { page: "#f6f3ee", card: "#ffffff", edge: "#ddd6cc", ink: "#1b1917", haze: "#635c55", brand: "#0B6D33", glass: "#fbfaf8", solid: "#d8e8de" }, dark: { page: "#121212", card: "#1c1a19", edge: "#34302d", ink: "#f4efe9", haze: "#9a938c", brand: "#4fe08a", glass: "#2e3239", solid: "#223025" } },
  { id: "forest", light: { page: "#eef1e9", card: "#fbfcf8", edge: "#d3dacb", ink: "#18231b", haze: "#56635a", brand: "#2f6b4f", glass: "#f8f9f6", solid: "#dee7e3" }, dark: { page: "#0f1511", card: "#17201a", edge: "#2a372e", ink: "#e8efe8", haze: "#93a496", brand: "#6fcf97", glass: "#333b35", solid: "#213328" } },
  { id: "mint", light: { page: "#e9f5ef", card: "#fafffc", edge: "#c8e2d6", ink: "#10271f", haze: "#4f6a5f", brand: "#0b7a5c", glass: "#f6fbf9", solid: "#d8eae5" }, dark: { page: "#0c1613", card: "#13211c", edge: "#233a31", ink: "#e3f4ec", haze: "#8fb0a2", brand: "#4fe0b0", glass: "#2f3c37", solid: "#1a362c" } },
  { id: "teal", light: { page: "#e8f3f3", card: "#fafdfd", edge: "#c4dede", ink: "#0e2a2c", haze: "#4a6a6c", brand: "#0a7378", glass: "#f6fafa", solid: "#d8e9e9" }, dark: { page: "#0b1516", card: "#122022", edge: "#213a3d", ink: "#e2f2f2", haze: "#8cb1b3", brand: "#4fd6dc", glass: "#2e3b3d", solid: "#193436" } },
  { id: "ocean", light: { page: "#edf2f7", card: "#fbfdff", edge: "#d0dbe6", ink: "#13202b", haze: "#52626f", brand: "#1a64a0", glass: "#f8fafc", solid: "#dae6f0" }, dark: { page: "#0d131a", card: "#141d27", edge: "#263441", ink: "#e5edf5", haze: "#8fa3b5", brand: "#5db4f0", glass: "#303841", solid: "#1c2e3d" } },
  { id: "midnight", light: { page: "#eceef8", card: "#fbfbff", edge: "#d0d4ec", ink: "#161a2e", haze: "#555b78", brand: "#3b46c4", glass: "#f7f8fc", solid: "#e0e1f6" }, dark: { page: "#0a0d19", card: "#121730", edge: "#242b4d", ink: "#e7eaf9", haze: "#939ac0", brand: "#93a0ff", glass: "#2e3349", solid: "#202647" } },
  { id: "plum", light: { page: "#f4eef5", card: "#fdfbfe", edge: "#e1d4e4", ink: "#251a29", haze: "#675a6c", brand: "#7a3790", glass: "#fbf8fb", solid: "#eadfed" }, dark: { page: "#150f19", card: "#1e1625", edge: "#342a3e", ink: "#f0e9f4", haze: "#a597ad", brand: "#c995e6", glass: "#39323f", solid: "#31243a" } },
  { id: "rose", light: { page: "#f9eff1", card: "#fffbfc", edge: "#ead3d8", ink: "#2a1a1f", haze: "#6c585d", brand: "#ae2f58", glass: "#fdf9f9", solid: "#f2dee4" }, dark: { page: "#170f12", card: "#21161a", edge: "#3b2a30", ink: "#f6eaed", haze: "#ae98a0", brand: "#f27aa0", glass: "#3c3235", solid: "#382129" } },
  { id: "peach", light: { page: "#fbefe7", card: "#fffcfa", edge: "#ecd5c6", ink: "#2d1c14", haze: "#6e5a4e", brand: "#b8461c", glass: "#fdf9f5", solid: "#f4e1db" }, dark: { page: "#171110", card: "#221916", edge: "#3b2d28", ink: "#f6ebe5", haze: "#b09c92", brand: "#f59a74", glass: "#3d3532", solid: "#392720" } },
  { id: "sand", light: { page: "#f3ecdf", card: "#fdfaf4", edge: "#ded2bd", ink: "#2a2116", haze: "#675a47", brand: "#8a5a12", glass: "#faf7f2", solid: "#ece5d9" }, dark: { page: "#14110c", card: "#1e1a13", edge: "#373021", ink: "#f2eadb", haze: "#a89c82", brand: "#d9b06a", glass: "#39352f", solid: "#332b1d" } },
  { id: "lime", light: { page: "#f1f4e3", card: "#fcfdf6", edge: "#d9e0bd", ink: "#1d2410", haze: "#5a6340", brand: "#476f0e", glass: "#f9fbf4", solid: "#e2e8d8" }, dark: { page: "#10140a", card: "#181d0f", edge: "#2e3720", ink: "#eef3df", haze: "#a0ab82", brand: "#b8e24c", glass: "#34382c", solid: "#2a3316" } },
  { id: "mono", light: { page: "#f3f3f3", card: "#ffffff", edge: "#d9d9d9", ink: "#111111", haze: "#5c5c5c", brand: "#2b2b2b", glass: "#fafafa", solid: "#dddddd" }, dark: { page: "#0e0e0e", card: "#181818", edge: "#2c2c2c", ink: "#f2f2f2", haze: "#9a9a9a", brand: "#dcdcdc", glass: "#343434", solid: "#2e2e2e" } },
] as const satisfies readonly { id: string; light: PaletteLook; dark: PaletteLook }[];

export type PaletteId = (typeof PALETTES)[number]["id"];
