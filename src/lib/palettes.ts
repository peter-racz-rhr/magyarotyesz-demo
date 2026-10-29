/*
  The colour palettes (the CSS is in globals.css, keyed by <html data-palette>). Each lists the
  page, card and accent colours of its light and dark look, for the picker's swatches only.
*/
export const PALETTES = [
  { id: "classic", light: ["#f6f3ee", "#ffffff", "#0B6D33"], dark: ["#121212", "#1c1a19", "#4fe08a"] },
  { id: "forest", light: ["#eef1e9", "#fbfcf8", "#2f6b4f"], dark: ["#0f1511", "#17201a", "#6fcf97"] },
  { id: "mint", light: ["#e9f5ef", "#fafffc", "#0b7a5c"], dark: ["#0c1613", "#13211c", "#4fe0b0"] },
  { id: "teal", light: ["#e8f3f3", "#fafdfd", "#0a7378"], dark: ["#0b1516", "#122022", "#4fd6dc"] },
  { id: "ocean", light: ["#edf2f7", "#fbfdff", "#1a64a0"], dark: ["#0d131a", "#141d27", "#5db4f0"] },
  { id: "midnight", light: ["#eceef8", "#fbfbff", "#3b46c4"], dark: ["#0a0d19", "#121730", "#93a0ff"] },
  { id: "plum", light: ["#f4eef5", "#fdfbfe", "#7a3790"], dark: ["#150f19", "#1e1625", "#c995e6"] },
  { id: "rose", light: ["#f9eff1", "#fffbfc", "#ae2f58"], dark: ["#170f12", "#21161a", "#f27aa0"] },
  { id: "peach", light: ["#fbefe7", "#fffcfa", "#b8461c"], dark: ["#171110", "#221916", "#f59a74"] },
  { id: "sand", light: ["#f3ecdf", "#fdfaf4", "#8a5a12"], dark: ["#14110c", "#1e1a13", "#d9b06a"] },
  { id: "lime", light: ["#f1f4e3", "#fcfdf6", "#476f0e"], dark: ["#10140a", "#181d0f", "#b8e24c"] },
  { id: "mono", light: ["#f3f3f3", "#ffffff", "#2b2b2b"], dark: ["#0e0e0e", "#181818", "#dcdcdc"] },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];
