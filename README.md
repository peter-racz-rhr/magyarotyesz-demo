# magyarotyesz (demo)

Toilet door codes in Budapest, shared by the people who needed them. A
mobile-first web app (installable to the Home Screen), built with Next.js,
Tailwind, mapcn (MapLibre) and Liquefy UI glass.

This is the demo: everything is saved on the phone (localStorage). No
accounts and no server yet.

| Route | Screen |
| --- | --- |
| `/` | Splash, then the intro the first time or the map after that |
| `/welcome` | The hook: a keypad tries the wrong code, then the right one, and the door opens |
| `/map` | Dark map of Budapest. Each toilet is a small dot: green = code confirmed this week, amber = not checked lately, red = reported not working. Tap a dot for the code (hidden until you tap), when it last worked, and Still works / Doesn't work. Tap empty map to add one. |
| `/nearby` | Every toilet, closest first, from you or from Deák Ferenc tér |
| `/profile` | Codes you shared, replay the intro, delete everything |

```bash
pnpm install
pnpm dev
```
