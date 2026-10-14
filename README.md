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
| `/map` | Dark map of Budapest. Each toilet is a small dot coloured by its votes (green = everyone got in, red = nobody did). Filters: Open now, Free, Usually works. **Nearest** jumps to the closest open toilet that usually works. Tap empty map to add one (code, kind, free / customers only / paid with price, opening hours, wheelchair access, baby changing). |
| `/nearby` | Every toilet, closest first, with a search bar for names and Budapest addresses (Photon) |
| `/profile` | Alerts about your codes, codes you shared, English / Magyar, settings and demo tools |

On each card: the code (hidden until tapped), walking directions, opening
hours, how many said it works or didn't, Still works / Doesn't work, and a
new code (an edit for the person who shared it, a suggestion for everyone
else).

Against fake codes: adding and voting only count within 150 m of the toilet
(switch off in Profile to try the demo from home), one vote per phone, and
at most 10 new codes a day per phone.

Works offline: a service worker (`public/sw.js`) keeps the app on the phone;
the codes are saved on the phone anyway. Map tiles and address search need
the internet.

```bash
pnpm install
pnpm dev
```

## Server

By default the app is a demo that keeps everything on the phone. Set `NEXT_PUBLIC_API_URL` to share codes through the magyarotyesz server: see [docs/connect-to-server.md](docs/connect-to-server.md).
