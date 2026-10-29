/** What's new, newest first. Each line is written in both languages; the page shows the one the app is set to. */
export type Change = { date: string; title: { en: string; hu: string; de: string }; items: { en: string; hu: string; de: string }[] };

export const CHANGELOG: Change[] = [
  {
    date: "2026-10-31",
    title: { en: "Your data, your choice", hu: "Az adataid, a döntésed", de: "Deine Daten, deine Entscheidung" },
    items: [
      { en: "Settings > \"Delete my data\" removes your profile and everything you added.", hu: "Beállítások > „Adataim törlése”: törli a profilodat és mindent, amit hozzáadtál.", de: "Einstellungen > „Meine Daten löschen“ entfernt dein Profil und alles, was du hinzugefügt hast." },
      { en: "Updated Terms and Privacy policy. You will be asked to agree again.", hu: "Frissített Felhasználási feltételek és Adatkezelési tájékoztató. Újra el kell fogadnod őket.", de: "Aktualisierte Bedingungen und Datenschutzerklärung. Du wirst um erneute Zustimmung gebeten." },
      { en: "Decisions about your places are explained in Alerts, and you hear back about your reports.", hu: "A helyeidről hozott döntéseket az Értesítések magyarázzák, és a jelentéseidre választ kapsz.", de: "Entscheidungen zu deinen Orten werden unter Hinweise erklärt, und zu deinen Meldungen bekommst du eine Antwort." },
    ],
  },
  {
    date: "2026-10-30",
    title: { en: "Catppuccin colours", hu: "Catppuccin színek", de: "Catppuccin-Farben" },
    items: [
      { en: "The colours are now Catppuccin: pick one of twelve accents, light is Latte.", hu: "A színek mostantól Catppuccin: válassz a tizenkét kiemelőszín közül, a világos a Latte.", de: "Die Farben sind jetzt Catppuccin: wähle einen von zwölf Akzenten, hell ist Latte." },
      { en: "Map filters: one small button in the corner opens the list.", hu: "Térképszűrők: egy kis sarokgomb nyitja a listát.", de: "Kartenfilter: ein kleiner Eckknopf öffnet die Liste." },
      { en: "Dark has three flavours: Mocha, Macchiato and Frappé.", hu: "A sötétnek három változata van: Mocha, Macchiato és Frappé.", de: "Dunkel gibt es in drei Varianten: Mocha, Macchiato und Frappé." },
    ],
  },
  {
    date: "2026-10-29",
    title: { en: "Find, keep and share", hu: "Keresés, mentés, megosztás", de: "Finden, merken, teilen" },
    items: [
      { en: "Walking time on every place, and on the Directions button.", hu: "Gyaloglási idő minden helynél és az Útvonal gombon.", de: "Gehzeit bei jedem Ort und auf der Routen-Taste." },
      { en: "Save places with the bookmark, and find them under Saved.", hu: "Mentsd a helyeket a könyvjelzővel, és találd meg őket a Mentettek alatt.", de: "Speichere Orte mit dem Lesezeichen und finde sie unter Gespeichert." },
      { en: "\"I need a toilet now\": the closest open one, as big as the screen allows.", hu: "„Most kell egy WC”: a legközelebbi nyitott, akkora betűkkel, amekkorát a képernyő enged.", de: "„Ich brauche jetzt eine Toilette“: die nächste offene, so groß, wie der Bildschirm es zulässt." },
      { en: "A small card asks if the code worked a couple of minutes after you looked at it.", hu: "Egy kis kártya megkérdezi, bevált-e a kód, pár perccel azután, hogy megnézted.", de: "Eine kleine Karte fragt ein paar Minuten, nachdem du einen Code angesehen hast, ob er funktioniert hat." },
      { en: "How fresh a code is, at a glance, and a \"How to find it\" note with quick tips.", hu: "Egy pillantásra látszik, mennyire friss a kód, és van „Hogyan találod meg” megjegyzés gyors tippekkel.", de: "Auf einen Blick sehen, wie frisch ein Code ist, und eine Notiz „So findest du sie“ mit schnellen Tipps." },
      { en: "Filters for wheelchair access, baby changing and gender-neutral toilets.", hu: "Szűrők az akadálymentes, a pelenkázós és a mindenkinek való mosdókra.", de: "Filter für Rollstuhlzugang, Wickeltisch und Toiletten für alle." },
    ],
  },
  {
    date: "2026-10-28",
    title: { en: "Looks and navigation", hu: "Megjelenés és navigáció", de: "Aussehen und Navigation" },
    items: [
      { en: "Twelve colour palettes in Settings, in light and dark.", hu: "Tizenkét színpaletta a Beállításokban, világosban és sötétben.", de: "Zwölf Farbpaletten in den Einstellungen, hell und dunkel." },
      { en: "Navigation as a bar or as one round button (Orb).", hu: "Navigáció sávként vagy egy kerek gombként (Gömb).", de: "Navigation als Leiste oder als ein runder Knopf (Kugel)." },
      { en: "Solid bars and buttons without glass effects, in your palette's pastel.", hu: "Egyszínű sávok és gombok üveghatás nélkül, a paletta pasztell árnyalatában.", de: "Einfarbige Leisten und Tasten ohne Glaseffekte, im Pastellton deiner Palette." },
      { en: "Text size: normal, large or extra large.", hu: "Szövegméret: normál, nagy vagy extra nagy.", de: "Textgröße: normal, groß oder sehr groß." },
    ],
  },
];
