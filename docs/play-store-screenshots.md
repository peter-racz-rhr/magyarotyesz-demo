# Play Store screenshots: plan and prompts

## The five images

Google Play shows up to 8 phone screenshots. We use 5: images 1 and 2 are **one wide panorama cut in half**, so when the
person swipes from 1 to 2 the picture continues; images 3, 4 and 5 stand alone.

| # | Size | What it says | Real app screen to show |
|---|------|--------------|-------------------------|
| 1+2 | 2160×1920, then cut at x=1080 into two 1080×1920 | **"Never guess a toilet code again."** The door codes of Budapest, shared by people who just got in. | Left phone: Nearby with an open card ("Tap to show code"). Right phone: "I need a toilet now" or the map with green dots. A glowing green dotted trail crosses the cut. |
| 3 | 1080×1920 | **"Add a code in seconds."** Tap the map where it is. | The Add form. |
| 4 | 1080×1920 | **"Rank up when people get in."** Newcomer, Regular, Trusted, Local legend. | The rank-up screen (`/profile?rankup=2`). |
| 5 | 1080×1920 | **"Free. Private. Works offline."** No ads, no tracking. | Four short promises (no account needed, offline map, colours, 3 languages). |

`play-store-screenshots-plan.png` next to this file shows the layout with the real app screens in place. Ready-to-use drafts of all five
images (1080×1920) are in `store-images/`: `01-left.png` and `02-right.png` are the two halves of `panorama-2160x1920.png` (a tilted phone cut in half by the seam, with
three small chips), then `03-add.png`, `04-rank.png`, `05-promises.png`. Upload them as they are, or use them as the layout reference for the
generator prompts below. Replace the app screens with fresh screenshots from your phone (with real data) before the final upload.

## Look

Minimal, on Catppuccin Mocha: crust/base background, one soft glow per image in its own accent (green, mauve, yellow, lavender), the app's own font
(Instrument Sans) with tight letter spacing, one highlighted word per headline, and a modern phone (19.5:9 screen, thin bezel, punch-hole camera) drawn
in HTML, so there is no licence question about a downloaded mockup. The app screens were taken with the app's Catppuccin Green palette.

## What makes store screenshots work (short, and honest about the evidence)

- **Image 1 does most of the work.** Many people see only the first two or three images without scrolling. Put the promise and the
  most important screen there. Short headline, huge letters (readable as a thumbnail), one idea per image.
- **Each image must make sense on its own**, because people jump straight to any position. So a panorama must still read as two good
  images when cut (headline and a phone on each half).
- **Show the real app**, not a made-up one. Google Play can reject misleading screenshots, and people leave bad reviews when it differs.
- **Panorama is a style choice, not a proven win.** The articles I found say panoramas are rare (about 2% on Android) and that the often-quoted
  "30% better" figure has no study behind it. So test: Play Console > Store listing experiments lets you compare two sets.
- **Localise.** Make a Hungarian set too (same layout, Hungarian headlines): for Hungarian users it usually helps.
- **Dark theme with one strong colour** (our green) is consistent with the app and stands out on Play's white page.

I could not find a "Bump" app listing whose screenshots I could look at (several apps share the name and the original one was shut down),
and a search tool cannot see images anyway. If you give me the exact link or screenshots of the listing you like, I can describe what they do.

## Prompts for Gemini / Nano Banana

**Method that works best (generators garble small UI text):** generate the *background, headline and a blank phone outline*, then paste your
real screenshots into the phones in Canva, Figma or Photoshop. Or give the generator your real screenshot as a reference image and tell it to keep
the screen unchanged. Always ask for **no extra text** other than the headline.

Common style block (paste at the start of every prompt):

> Style: premium dark mobile app store graphic. Background deep black-green (#0b120e) with a soft emerald glow (#4fe08a). Clean modern sans-serif
> headline, white, very large and bold, left aligned, high contrast. Flat vector look with subtle depth, soft shadows, no clutter, no stock-photo
> people, no logos, no watermarks. Do not add any text except the headline I give you. Do not alter any attached app screenshot.

### Images 1 + 2 (panorama; ask for a SQUARE image, then crop)

Generators do not make 2160×1920 directly. Ask for a **1:1 square at the highest resolution**, crop the top/bottom to 9:8, then cut the middle into two halves
(each exactly 9:16).

> [style block] A wide panoramic composition for a Google Play listing. Headline across the top, spanning the whole width: "Never guess a toilet code again."
> Small subtitle under it: "The door codes of Budapest, shared by people who just got in." Two modern smartphones side by side, the left one slightly lower
> and tilted a few degrees, the right one slightly higher, both showing the attached screenshots unchanged. A glowing emerald dotted trail starts at a green
> dot on the left phone, arcs across the empty space between the phones (this middle gap is where the image will be cut, so keep nothing important exactly at the
> centre line) and ends at a glowing keypad button on the right phone. Subtle keypad dots pattern in the background. Keep 8% empty margin all around.

### Image 3

> [style block] Portrait 9:16. Headline top left, two lines: "Add a code in seconds." Subtitle: "Tap the map where it is." One smartphone, centred, large,
> showing the attached Add-a-toilet screenshot unchanged. A glowing green map pin dropping onto the screen from above with small sparkle particles. Emerald glow behind the phone.

### Image 4

> [style block] Portrait 9:16. Headline top left: "Rank up when people get in." Subtitle: "Newcomer, Regular, Trusted, Local legend." One smartphone, centred,
> showing the attached rank-up screenshot unchanged. Behind it, a burst of golden sparks and concentric rings, warm gold (#ffc247) glow instead of green. A subtle crown shape in the glow.

### Image 5

> [style block, but purple-indigo glow (#9a86ff) instead of emerald] Portrait 9:16. Headline top left: "Free. Private. Works offline." Subtitle: "No ads, no tracking."
> Below, four rounded glass cards stacked vertically, each with a bright green numbered circle and a short line: "No account needed", "Offline Budapest map",
> "Light, dark, 12 colours", "English, Magyar, Deutsch". No phone in this image.

### Hungarian version (same prompts, change the quoted texts)

- 1+2: "Soha többé ne találgasd a WC-kódot." / "Budapest ajtókódjai, azoktól, akik épp bejutottak."
- 3: "Adj hozzá egy kódot pár másodperc alatt." / "Koppints a térképre oda, ahol van."
- 4: "Lépj szintet, ha bejutnak a kódjaiddal." / "Újonc, Törzsvendég, Megbízható, Helyi legenda."
- 5: "Ingyenes. Privát. Offline is működik." / "Nincs reklám, nincs követés." Cards: "Nem kell fiók", "Offline budapesti térkép", "Világos, sötét, 12 szín", "Magyar, English, Deutsch".

## Screens to capture on your phone (Play wants real ones)

1. Nearby with one card open ("Tap to show code" visible).
2. "I need a toilet now" screen (Urgent).
3. The map with several green dots around your area (the best real-looking image; use the dark theme).
4. The Add form, filled in with a real-looking place.
5. The rank-up screen: `https://project-1y1mw.vercel.app/profile?rankup=2`.

Take them at 1080×1920 or larger in portrait, with the status bar clean (battery full, no notifications, 12:00 on the clock if you can).

## Other Play graphics

- **Icon 512×512:** `public/icons/icon-512.png`.
- **Feature graphic 1024×500** (the banner at the top of the listing): one more generation, landscape 2:1: "magyarotyesz: toilet codes in Budapest" on the dark-green background with the keypad
  glow and one phone on the right.

## Checklist before upload

- Image 1 readable at thumbnail size; no important text near the edges (the Play page crops a little).
- Panorama halves exactly 1080×1920, no seam, nothing important on the cut line.
- No text that is not in the app's real language (the Hungarian set uses Hungarian screenshots).
- Store listing experiment set up so you can compare this set with a plain one.
