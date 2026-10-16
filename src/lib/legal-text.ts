import type { Lang } from "./settings";
import type { DocKey } from "./legal";

/*
  The legal texts, in English and Hungarian. {operator}, {email} and {address}
  are filled in from the environment (see legal.ts). These are drafts written
  for a small hobby project: have a lawyer read them before relying on them.
*/

export type Section = { h: string; p: string[] };
export type Doc = { title: string; updated: string; intro?: string; sections: Section[] };

const UPDATED = { en: "Last updated: 15 October 2026", hu: "Utolsó frissítés: 2026. október 15." };

const en: Record<DocKey, Doc> = {
  terms: {
    title: "Terms of use",
    updated: UPDATED.en,
    intro: "magyarotyesz is a free community map of toilet door codes in Budapest, run by {operator}. By using it you agree to these terms.",
    sections: [
      {
        h: "What this is",
        p: [
          "People share the codes of toilet doors they have used. We do not own or control these places and cannot promise a code is right, current or that you will be let in. Use the codes at your own judgement.",
        ],
      },
      {
        h: "Who can use it",
        p: ["You must be at least 16, or have a parent or guardian who agrees to this on your behalf. The app has no account: your phone gets a random anonymous ID."],
      },
      {
        h: "What you may add",
        p: [
          "Only add real door codes you have actually used, for places you are allowed to share. Do not add codes for private homes, staff-only or security areas, or anything you were told in confidence.",
          "Do not add offensive, hateful, sexual, illegal or misleading names or notes, personal data about anyone, advertising or spam, or fake votes. Names and notes pass an automatic word filter; this is a safety net, not a guarantee.",
          "You keep the rights to what you write, and you give us permission to store it, show it to other users and remove it, for as long as the service runs.",
        ],
      },
      {
        h: "Reporting and removal",
        p: [
          "Every place has a Report button. Enough reports hide a place until someone checks it. We remove content that breaks these terms or the law, and we may block a phone that keeps doing so.",
          "If you run a place and do not want its code listed (for example it is meant for customers only), write to {email} with the name and address of the place and we will remove it. The same address takes notices about illegal content.",
        ],
      },
      {
        h: "No guarantees",
        p: [
          "The service is free and provided as it is. We do not guarantee that it is available, accurate or error free. To the extent the law allows, we are not liable for loss caused by a wrong or outdated code or by the service being unavailable. Nothing here limits liability that cannot be limited by law.",
        ],
      },
      {
        h: "Changes and law",
        p: ["We may change these terms or the service; the date above shows the latest version. Hungarian law applies, and consumers keep the rights they have under the mandatory law of their country."],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    updated: UPDATED.en,
    intro: "The controller of your data is {operator}, {address}, {email}. We keep this to the minimum the app needs.",
    sections: [
      {
        h: "What we process",
        p: [
          "Anonymous ID: when you first use the shared map your phone gets a random ID and a secret token. The server keeps only a hash of the token, plus the list of places you added and when. There is no name, email or phone number.",
          "Profile name: optional. If you choose a name, it is saved with your anonymous ID on the server. Only you and the administrator can see it; it is not shown on any place.",
          "Your contributions: places you add (name, code, kind, opening hours, note, position), your votes, code suggestions and reports.",
          "Location: your phone's position is read on the device to show you where you are and to find nearby places. When you add a place or vote, your position is sent with the request so the server can check you are within about 150 m of the toilet; the server does not store it.",
          "Technical data: your IP address is processed to deliver the service and to limit abuse. It appears in short-lived server logs and is not linked to your ID by us.",
          "On your phone: settings, a copy of the places and a queue of actions waiting to be sent are stored in your browser's local storage. This is strictly necessary for the app to work, so there is no cookie banner. We do not use analytics or advertising trackers.",
        ],
      },
      {
        h: "Why, and on what basis",
        p: [
          "To run the shared map you asked to use (performance of the service, GDPR Art. 6(1)(b)), and to keep it safe and free of abuse and illegal content (our legitimate interest, Art. 6(1)(f)). Location is used only when you allow your device to share it (Art. 6(1)(a)).",
        ],
      },
      {
        h: "Who else sees data",
        p: [
          "Server: hosted at Oracle Cloud Infrastructure in Frankfurt, Germany.",
          "App hosting: Vercel Inc. delivers the web app and sees your IP address when it loads.",
          "Map and search: map tiles come from OpenFreeMap (OpenStreetMap data) and, in the satellite view, aerial images from Esri. If you search for an address, the text you type and the area are sent to Photon (komoot.io) or OpenStreetMap Nominatim. These services see your IP address and request.",
          "Some of these providers are outside the EU and rely on the safeguards described in their own policies. We do not sell data.",
        ],
      },
      {
        h: "How long",
        p: [
          "Places and votes stay until they are deleted. You can delete the places you added in the Profile tab; an administrator can delete or hide places and block IDs that break the terms. Server logs are kept only briefly. Clear your browser data to remove everything stored on your phone.",
        ],
      },
      {
        h: "Your rights",
        p: [
          "You can ask for access, correction, deletion, restriction, or object to processing, and ask for your data in a portable format. Because the ID is anonymous, we may ask you to show that you control it. Write to {email}; we answer within one month.",
          "You can complain to the Hungarian National Authority for Data Protection and Freedom of Information (NAIH), 1055 Budapest, Falk Miksa utca 9-11, www.naih.hu, or go to court, or complain to the authority of your own EU country.",
        ],
      },
      {
        h: "Children",
        p: ["The app is meant for people aged 16 and over. If you are younger, use it only with a parent or guardian."],
      },
    ],
  },
  imprint: {
    title: "Imprint",
    updated: UPDATED.en,
    sections: [
      { h: "Service provider", p: ["{operator}", "{address}"] },
      { h: "Contact", p: ["{email}", "Use this address for questions, privacy requests, takedown requests and notices about illegal content. We aim to reply within a few working days."] },
      { h: "Service", p: ["magyarotyesz, a free community map of toilet door codes in Budapest. Not a commercial service; no fee is charged."] },
      { h: "Hosting", p: ["Web app: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.", "Server: Oracle Cloud Infrastructure, Frankfurt, Germany."] },
      { h: "Map data", p: ["Map © OpenFreeMap, © OpenMapTiles, data © OpenStreetMap contributors. Style based on the CartoDB basemaps (CC BY 3.0).", "Satellite imagery © Esri, Maxar, Earthstar Geographics and the GIS User Community."] },
    ],
  },
};

const hu: Record<DocKey, Doc> = {
  terms: {
    title: "Felhasználási feltételek",
    updated: UPDATED.hu,
    intro: "A magyarotyesz egy ingyenes, közösségi térkép budapesti mosdók ajtókódjairól, üzemeltetője: {operator}. A használatával elfogadod ezeket a feltételeket.",
    sections: [
      {
        h: "Mi ez",
        p: ["Az emberek megosztják azoknak a mosdóknak a kódját, amiket használtak. Ezek a helyek nem a mieink, és nem vállalhatjuk, hogy egy kód helyes, naprakész, vagy hogy beengednek. A kódokat saját felelősségedre használd."],
      },
      {
        h: "Ki használhatja",
        p: ["Legalább 16 évesnek kell lenned, vagy a szülőd/gondviselőd hozzájárulása kell. Az appban nincs fiók: a telefonod véletlenszerű, névtelen azonosítót kap."],
      },
      {
        h: "Mit adhatsz hozzá",
        p: [
          "Csak valódi, általad ténylegesen használt kódot adj hozzá, olyan helyről, amelyet megoszthatsz. Ne adj hozzá magánlakások, csak személyzetnek szánt vagy biztonsági területek kódját, sem bizalmasan kapott információt.",
          "Ne adj meg sértő, gyűlöletkeltő, szexuális, jogellenes vagy félrevezető nevet vagy megjegyzést, senki személyes adatát, reklámot, spamet, hamis szavazatot. A nevek és megjegyzések automatikus szófilteren mennek át; ez biztonsági háló, nem garancia.",
          "A tartalom jogai nálad maradnak, de engedélyt adsz arra, hogy a szolgáltatás működése alatt eltároljuk, mutassuk másoknak és eltávolítsuk.",
        ],
      },
      {
        h: "Jelentés és eltávolítás",
        p: [
          "Minden helyen van Jelentés gomb. Elég számú jelentés elrejti a helyet, amíg valaki meg nem nézi. Eltávolítjuk a feltételeket vagy a jogszabályt sértő tartalmat, és letilthatjuk azt a telefont, amely ezt ismételten teszi.",
          "Ha egy hely üzemeltetője vagy, és nem szeretnéd, hogy a kódjuk szerepeljen (például csak vendégeknek szól), írj a {email} címre a hely nevével és címével, és eltávolítjuk. Ugyanide küldhetők a jogellenes tartalomról szóló bejelentések.",
        ],
      },
      {
        h: "Garancia nélkül",
        p: ["A szolgáltatás ingyenes, ahogy van. Nem garantáljuk, hogy elérhető, pontos vagy hibamentes. A jogszabályok adta keretek között nem felelünk téves vagy elavult kódból, illetve az elérhetetlenségből eredő kárért. Ez nem korlátozza azt a felelősséget, amelyet jogszabály nem enged korlátozni."],
      },
      {
        h: "Változások, irányadó jog",
        p: ["A feltételeket és a szolgáltatást módosíthatjuk; a fenti dátum a legfrissebb változatot mutatja. A magyar jog az irányadó, a fogyasztók megtartják a lakóhelyük kötelező jogából fakadó jogaikat."],
      },
    ],
  },
  privacy: {
    title: "Adatkezelési tájékoztató",
    updated: UPDATED.hu,
    intro: "Az adataid kezelője: {operator}, {address}, {email}. Csak azt kezeljük, amire az appnak szüksége van.",
    sections: [
      {
        h: "Milyen adatokat kezelünk",
        p: [
          "Névtelen azonosító: amikor először használod a közös térképet, a telefonod kap egy véletlenszerű azonosítót és egy titkos tokent. A szerver a tokennek csak a hash-ét tárolja, valamint azt, hogy mely helyeket és mikor adtál hozzá. Nincs név, e-mail-cím vagy telefonszám.",
          "Profilnév: nem kötelező. Ha megadsz egy nevet, az a névtelen azonosítódhoz kötve tárolódik a szerveren. Csak te és az adminisztrátor látja, egyetlen helynél sem jelenik meg.",
          "Hozzájárulásaid: a hozzáadott helyek (név, kód, fajta, nyitva tartás, megjegyzés, helyzet), szavazataid, kódjavaslataid és jelentéseid.",
          "Helyadat: a telefonod pozícióját az eszközön olvassuk, hogy megmutassuk, hol vagy, és a közeli helyeket. Hely hozzáadásakor és szavazáskor a pozíciód elküldjük a kéréssel, hogy a szerver ellenőrizze, hogy kb. 150 méteren belül vagy; a szerver nem tárolja.",
          "Technikai adat: az IP-címedet a szolgáltatás nyújtásához és a visszaélések korlátozásához kezeljük. Rövid életű szerver naplókban jelenik meg, és mi nem kapcsoljuk az azonosítódhoz.",
          "A telefonodon: a beállítások, a helyek másolata és az elküldésre váró műveletek a böngésző helyi tárolójában vannak. Ez az app működéséhez feltétlenül szükséges, ezért nincs sütibanner. Nem használunk analitikát vagy hirdetési követőket.",
        ],
      },
      {
        h: "Miért és milyen jogalapon",
        p: ["A kért közös térkép működtetéséhez (szerződés teljesítése, GDPR 6. cikk (1) b)), valamint a visszaélések és jogellenes tartalmak elleni védelemhez (jogos érdek, 6. cikk (1) f)). A helyadatot csak akkor használjuk, ha engedélyezed az eszközödnek a megosztást (6. cikk (1) a))."],
      },
      {
        h: "Ki látja még",
        p: [
          "Szerver: Oracle Cloud Infrastructure, Frankfurt, Németország.",
          "Az app kiszolgálása: a Vercel Inc. szolgálja ki a webappot, betöltéskor látja az IP-címedet.",
          "Térkép és keresés: a térképcsempéket az OpenFreeMap adja (OpenStreetMap adatok), a műholdas nézetben pedig az Esri légifelvételei. Címkereséskor a beírt szöveg és a terület a Photon (komoot.io) vagy az OpenStreetMap Nominatim felé megy. Ezek látják az IP-címedet és a kérést.",
          "Néhány szolgáltató az EU-n kívül működik, és a saját szabályzatukban leírt garanciákra támaszkodnak. Adatot nem adunk el.",
        ],
      },
      {
        h: "Meddig",
        p: ["A helyek és szavazatok a törlésükig megmaradnak. A hozzáadott helyeidet a Profil fülön törölheted; adminisztrátor törölhet vagy elrejthet helyeket és letilthat a feltételeket sértő azonosítókat. A szerver naplókat csak rövid ideig őrizzük. A telefonodon tárolt adatokat a böngészőadatok törlésével távolíthatod el."],
      },
      {
        h: "Jogaid",
        p: [
          "Kérhetsz hozzáférést, helyesbítést, törlést, korlátozást, tiltakozhatsz az adatkezelés ellen, és kérheted az adataid hordozhatóságát. Mivel az azonosító névtelen, kérhetjük, hogy igazold, hogy a tiéd. Írj a {email} címre; egy hónapon belül válaszolunk.",
          "Panasszal fordulhatsz a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH), 1055 Budapest, Falk Miksa utca 9-11., www.naih.hu, bírósághoz, vagy a saját EU-s országod hatóságához.",
        ],
      },
      {
        h: "Gyermekek",
        p: ["Az app 16 éves és idősebb felhasználóknak szól. Fiatalabbként csak szülő vagy gondviselő mellett használd."],
      },
    ],
  },
  imprint: {
    title: "Impresszum",
    updated: UPDATED.hu,
    sections: [
      { h: "Szolgáltató", p: ["{operator}", "{address}"] },
      { h: "Kapcsolat", p: ["{email}", "Kérdésekkel, adatkezelési kérésekkel, eltávolítási kérésekkel és jogellenes tartalomról szóló bejelentésekkel erre a címre írj. Néhány munkanapon belül igyekszünk válaszolni."] },
      { h: "Szolgáltatás", p: ["magyarotyesz, ingyenes közösségi térkép budapesti mosdók ajtókódjairól. Nem üzleti szolgáltatás, díjat nem számítunk fel."] },
      { h: "Tárhely", p: ["Webapp: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.", "Szerver: Oracle Cloud Infrastructure, Frankfurt, Németország."] },
      { h: "Térképadatok", p: ["Térkép © OpenFreeMap, © OpenMapTiles, adatok © OpenStreetMap közreműködők. A stílus a CartoDB alaptérképeken alapul (CC BY 3.0).", "Műholdkép © Esri, Maxar, Earthstar Geographics és a GIS User Community."] },
    ],
  },
};

export const LEGAL: Record<Lang, Record<DocKey, Doc>> = { en, hu };
