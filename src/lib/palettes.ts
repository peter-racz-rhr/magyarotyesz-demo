/*
  The colour palettes: Classic, and the Catppuccin accents (catppuccin.com, MIT) on its four flavours. The CSS that applies them is in globals.css, keyed by
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

export type Flavour = "mocha" | "macchiato" | "frappe";
export const FLAVOURS: readonly Flavour[] = ["mocha", "macchiato", "frappe"];

type Looks = Record<"latte" | Flavour, PaletteLook>;

const CLASSIC = { light: { page: "#f6f3ee", card: "#ffffff", edge: "#ddd6cc", ink: "#1b1917", haze: "#605952", brand: "#0B6D33", glass: "#fbfaf8", solid: "#d8e8de" }, dark: { page: "#121212", card: "#1c1a19", edge: "#34302d", ink: "#f4efe9", haze: "#9a938c", brand: "#4fe08a", glass: "#2e3239", solid: "#223025" } };

/** Catppuccin accents: one look per flavour (Latte is the light one). */
const ACCENTS = {
  mauve: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#8839ef", glass: "#f9f9fb", solid: "#f5effe" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#cba6f7", glass: "#45475a", solid: "#201d2d" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#c6a0f6", glass: "#494d64", solid: "#262437" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#ca9ee6", glass: "#51576d", solid: "#303042" } },
  lavender: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#5566be", glass: "#f9f9fb", solid: "#f1f3fa" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#b4befe", glass: "#45475a", solid: "#1e1f2d" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#b7bdf8", glass: "#494d64", solid: "#252637" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#babbf1", glass: "#51576d", solid: "#2f3243" } },
  blue: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#1d62eb", glass: "#f9f9fb", solid: "#edf2fd" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#89b4fa", glass: "#45475a", solid: "#1b1e2d" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#8aadf4", glass: "#494d64", solid: "#212536" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#8caaee", glass: "#51576d", solid: "#2b3143" } },
  sapphire: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#187383", glass: "#f9f9fb", solid: "#edf4f5" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#74c7ec", glass: "#45475a", solid: "#19202c" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#7dc4e4", glass: "#494d64", solid: "#202735" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#85c1dc", glass: "#51576d", solid: "#2b3241" } },
  sky: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#04729f", glass: "#f9f9fb", solid: "#ebf4f7" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#89dceb", glass: "#45475a", solid: "#1b212c" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#91d7e3", glass: "#494d64", solid: "#222835" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#99d1db", glass: "#51576d", solid: "#2c3441" } },
  teal: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#12777d", glass: "#f9f9fb", solid: "#ecf4f5" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#94e2d5", glass: "#45475a", solid: "#1b222a" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#8bd5ca", glass: "#494d64", solid: "#212833" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#81c8be", glass: "#51576d", solid: "#2b333f" } },
  green: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#317921", glass: "#f9f9fb", solid: "#eff4ed" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#a6e3a1", glass: "#45475a", solid: "#1d2226" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#a6da95", glass: "#494d64", solid: "#23282f" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#a6d189", glass: "#51576d", solid: "#2d343b" } },
  peach: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#b7480b", glass: "#f9f9fb", solid: "#f9f0eb" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#fab387", glass: "#45475a", solid: "#241e24" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#f5a97f", glass: "#494d64", solid: "#2a252d" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#ef9f76", glass: "#51576d", solid: "#333039" } },
  maroon: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#bc3844", glass: "#f9f9fb", solid: "#faeff0" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#eba0ac", glass: "#45475a", solid: "#221c27" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#ee99a0", glass: "#494d64", solid: "#292330" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#ea999c", glass: "#51576d", solid: "#332f3c" } },
  flamingo: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#9f5656", glass: "#f9f9fb", solid: "#f7f1f1" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#f2cdcd", glass: "#45475a", solid: "#232029" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#f0c6c6", glass: "#494d64", solid: "#292733" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#eebebe", glass: "#51576d", solid: "#33323f" } },
  rosewater: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#935c50", glass: "#f9f9fb", solid: "#f6f2f1" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#f5e0dc", glass: "#45475a", solid: "#23222a" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#f4dbd6", glass: "#494d64", solid: "#2a2934" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#f2d5cf", glass: "#51576d", solid: "#343440" } },
  pink: { latte: { page: "#eff1f5", card: "#f9f9fb", edge: "#ccd0da", ink: "#4c4f69", haze: "#54576d", brand: "#9c4e87", glass: "#f9f9fb", solid: "#f7f1f5" }, mocha: { page: "#1e1e2e", card: "#28293a", edge: "#45475a", ink: "#cdd6f4", haze: "#bac2de", brand: "#f5c2e7", glass: "#45475a", solid: "#231f2b" }, macchiato: { page: "#24273a", card: "#2e3146", edge: "#494d64", ink: "#cad3f5", haze: "#b8c0e0", brand: "#f5bde6", glass: "#494d64", solid: "#2a2635" }, frappe: { page: "#303446", card: "#393d50", edge: "#51576d", ink: "#c6d0f5", haze: "#b5bfe2", brand: "#f4b8e4", glass: "#51576d", solid: "#343242" } },
} satisfies Record<string, Looks>;

export const PALETTE_IDS = ["classic", ...Object.keys(ACCENTS)] as readonly string[] as readonly PaletteId[];
export type PaletteId = "classic" | keyof typeof ACCENTS;

/** What the picker draws for a palette in the current look and dark flavour. */
export function paletteLook(id: PaletteId, look: "light" | "dark", flavour: Flavour): PaletteLook {
  if (id === "classic") return CLASSIC[look];
  return ACCENTS[id][look === "light" ? "latte" : flavour];
}

export const isPaletteId = (v: unknown): v is PaletteId => typeof v === "string" && (PALETTE_IDS as readonly string[]).includes(v);

/** The own palettes of earlier versions, and the Catppuccin accent each one became. */
const LEGACY: Record<string, PaletteId> = { forest: "green", mint: "teal", teal: "teal", ocean: "blue", midnight: "lavender", plum: "mauve", rose: "pink", peach: "peach", sand: "rosewater", lime: "green", mono: "classic" };

/** A saved palette id that is valid now: unknown or retired ids map to their successor. */
export const normalizePalette = (v: unknown): PaletteId => (isPaletteId(v) ? v : (typeof v === "string" && LEGACY[v]) || "classic");
