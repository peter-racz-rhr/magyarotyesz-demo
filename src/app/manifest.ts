import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "magyarotyesz",
    short_name: "magyarotyesz",
    description: "Toilet door codes, shared by people who needed them too.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#121212",
    theme_color: "#121212",
    // Long-press the home-screen icon: straight to the nearest toilet, or to the places you kept.
    shortcuts: [
      { name: "Nearest toilet", short_name: "Nearest", url: "/map?nearest=1", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "I need a toilet now", short_name: "Urgent", url: "/urgent", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Saved places", short_name: "Saved", url: "/nearby?saved=1", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
