/** What's new, newest first. Each line is written in both languages; the page shows the one the app is set to. */
export type Change = { date: string; title: { en: string; hu: string }; items: { en: string; hu: string }[] };

export const CHANGELOG: Change[] = [
  {
    date: "2026-10-29",
    title: { en: "Find, keep and share", hu: "Keresés, mentés, megosztás" },
    items: [
      { en: "Walking time on every place, and on the Directions button.", hu: "Gyaloglási idő minden helynél és az Útvonal gombon." },
      { en: "Save places with the bookmark, and find them under Saved.", hu: "Mentsd a helyeket a könyvjelzővel, és találd meg őket a Mentettek alatt." },
      { en: "\"I need a toilet now\": the closest open one, as big as the screen allows.", hu: "„Most kell egy WC”: a legközelebbi nyitott, akkora betűkkel, amekkorát a képernyő enged." },
      { en: "A small card asks if the code worked a couple of minutes after you looked at it.", hu: "Egy kis kártya megkérdezi, bevált-e a kód, pár perccel azután, hogy megnézted." },
      { en: "How fresh a code is, at a glance, and a \"How to find it\" note with quick tips.", hu: "Egy pillantásra látszik, mennyire friss a kód, és van „Hogyan találod meg” megjegyzés gyors tippekkel." },
      { en: "Filters for wheelchair access, baby changing and gender-neutral toilets.", hu: "Szűrők az akadálymentes, a pelenkázós és a mindenkinek való mosdókra." },
    ],
  },
  {
    date: "2026-10-28",
    title: { en: "Looks and navigation", hu: "Megjelenés és navigáció" },
    items: [
      { en: "Twelve colour palettes in Settings, in light and dark.", hu: "Tizenkét színpaletta a Beállításokban, világosban és sötétben." },
      { en: "Navigation as a bar or as one round button (Orb).", hu: "Navigáció sávként vagy egy kerek gombként (Gömb)." },
      { en: "Solid bars and buttons without glass effects, in your palette's pastel.", hu: "Egyszínű sávok és gombok üveghatás nélkül, a paletta pasztell árnyalatában." },
      { en: "Text size: normal, large or extra large.", hu: "Szövegméret: normál, nagy vagy extra nagy." },
    ],
  },
];
