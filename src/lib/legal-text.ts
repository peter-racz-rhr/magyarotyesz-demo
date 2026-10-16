import type { Lang } from "./settings";
import type { DocKey } from "./legal";

/*
  The legal texts, in English and Hungarian. {operator}, {email} and {address}
  are filled in from the environment (see legal.ts). These are drafts written
  for a small hobby project: have a lawyer read them before relying on them.
*/

export type Section = { h: string; p: string[] };
export type Doc = { title: string; updated: string; intro?: string; sections: Section[] };

const UPDATED = { en: "Last updated: 16 October 2026", hu: "Utolsó frissítés: 2026. október 16." };

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
        p: ["You must be at least 16 years old to use magyarotyesz. The app has no account: your phone gets a random anonymous ID."],
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
          "Every place has a Report button. One report that a place is not a toilet hides it straight away; several reports of offensive or private content hide it too. Hidden places stay hidden until someone has checked them. We remove content that breaks these terms or the law, and we may block a phone that keeps doing so.",
          "When we hide or remove a place you shared, we tell you why in the app (Profile, Alerts).",
          "If you run a place and do not want its code listed (for example it is meant for customers only), write to {email} with the name and address of the place and we will remove it within 48 hours. The same address takes notices about illegal content.",
          "Contact point under the EU Digital Services Act, for users and for authorities: {email}. We answer in Hungarian and English.",
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
          "Location: your phone's position is read on the device to show you where you are and to find nearby places. When you add a place or vote, your position is sent with the request so the server can check you are within about 150 m of the toilet; the server does not store it. You can withdraw your consent at any time: switch off \"Use my location\" in Settings, or turn location off for the app in your phone or browser settings.",
          "Technical data: your IP address is processed to deliver the service and to limit abuse. Our server writes no access log: the address is held in memory for about an hour to limit abuse and is then forgotten. The providers named below keep their own technical logs.",
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
          "Server: Oracle Cloud Infrastructure, Frankfurt, Germany (EU). Oracle is a US company; where data could be reached from outside the EU, the transfer relies on the EU–US Data Privacy Framework and/or standard contractual clauses, as set out in Oracle's data processing terms.",
          "App hosting: Vercel Inc., USA. It delivers the web app and sees your IP address when it loads. The transfer relies on the EU–US Data Privacy Framework and/or standard contractual clauses in Vercel's data processing terms.",
          "Map tiles: OpenFreeMap (openfreemap.org) with OpenStreetMap data. It receives your IP address and the map area you look at. We have no contract with it; it is a free public service.",
          "Satellite view: EOX IT Services GmbH, Austria (EU), tiles.maps.eox.at. It receives your IP address and the map area.",
          "Address search: Photon, run by Komoot, Germany (EU), and OpenStreetMap Nominatim, run by the OpenStreetMap Foundation, United Kingdom. They receive what you type, the area, and your IP address.",
          "We do not sell data. Where a provider is outside the EU, the basis for the transfer is the one named above or the country's adequacy decision.",
        ],
      },
      {
        h: "How long",
        p: [
          "Places, votes, suggestions and reports stay until they are deleted. If a place is deleted, its votes, suggestions and reports are deleted with it. You can delete the places you added in the Profile tab; an administrator can delete or hide places and block IDs that break the terms. Your anonymous ID and optional name stay until you ask us to delete them. Our server keeps no access logs. Clear your browser data to remove everything stored on your phone, including your profile photo, which never leaves it.",
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
        p: ["The app is only for people aged 16 and over."],
      },
    ],
  },
  imprint: {
    title: "Imprint",
    updated: UPDATED.en,
    sections: [
      { h: "Service provider", p: ["{operator}", "{address}"] },
      { h: "Contact", p: ["{email}", "{phone}", "Use this address for questions, privacy requests, takedown requests and notices about illegal content. We aim to reply within a few working days."] },
      { h: "Service", p: ["magyarotyesz, a free community map of toilet door codes in Budapest. Not a commercial service; no fee is charged."] },
      { h: "Hosting", p: ["Web app: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.", "Server: Oracle Cloud Infrastructure, Frankfurt, Germany."] },
      { h: "Map data", p: ["Map © OpenFreeMap, © OpenMapTiles, data © OpenStreetMap contributors. Style based on the CartoDB basemaps (CC BY 3.0).", "Satellite: Sentinel-2 cloudless – https://s2maps.eu by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2016 & 2017), CC BY 4.0."] },
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
        p: ["A magyarotyesz használatához legalább 16 évesnek kell lenned. Az appban nincs fiók: a telefonod véletlenszerű, névtelen azonosítót kap."],
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
          "Minden helyen van Jelentés gomb. Ha egyetlen jelentés szerint a hely nem mosdó, azonnal elrejtjük; ha többen jelentik sértőnek vagy magánjellegűnek, az is elrejti. A rejtett hely addig rejtett marad, amíg valaki meg nem nézte. Eltávolítjuk a feltételeket vagy a jogszabályt sértő tartalmat, és letilthatjuk azt a telefont, amely ezt ismételten teszi.",
          "Ha elrejtünk vagy eltávolítunk egy általad megosztott helyet, az appban (Profil, Értesítések) megmondjuk, miért.",
          "Ha egy hely üzemeltetője vagy, és nem szeretnéd, hogy a kódjuk szerepeljen (például csak vendégeknek szól), írj a {email} címre a hely nevével és címével, és 48 órán belül eltávolítjuk. Ugyanide küldhetők a jogellenes tartalomról szóló bejelentések.",
          "Az EU digitális szolgáltatásokról szóló rendelete (DSA) szerinti kapcsolattartó pont felhasználóknak és hatóságoknak: {email}. Magyarul és angolul válaszolunk.",
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
          "Helyadat: a telefonod pozícióját az eszközön olvassuk, hogy megmutassuk, hol vagy, és a közeli helyeket. Hely hozzáadásakor és szavazáskor a pozíciód elküldjük a kéréssel, hogy a szerver ellenőrizze, hogy kb. 150 méteren belül vagy; a szerver nem tárolja. A hozzájárulásodat bármikor visszavonhatod: kapcsold ki a Beállításokban a „Helyem használata” kapcsolót, vagy a telefon / böngésző helybeállításaiban az appot.",
          "Technikai adat: az IP-címedet a szolgáltatás nyújtásához és a visszaélések korlátozásához kezeljük. A szerverünk nem ír hozzáférési naplót: a címet kb. egy órán át a memóriában tartja a visszaélések korlátozásához, aztán elfelejti. Az alább megnevezett szolgáltatók saját technikai naplót vezetnek.",
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
          "Szerver: Oracle Cloud Infrastructure, Frankfurt, Németország (EU). Az Oracle amerikai cég; ha az adatokhoz az EU-n kívülről is hozzá lehet férni, az átadás az EU–USA adatvédelmi keretrendszerre (Data Privacy Framework) és/vagy általános szerződési feltételekre (SCC) támaszkodik, az Oracle adatfeldolgozási feltételei szerint.",
          "Az app kiszolgálása: Vercel Inc., USA. Szolgálja ki a webappot, betöltéskor látja az IP-címedet. Az átadás az EU–USA adatvédelmi keretrendszerre és/vagy általános szerződési feltételekre támaszkodik, a Vercel adatfeldolgozási feltételei szerint.",
          "Térképcsempék: OpenFreeMap (openfreemap.org), OpenStreetMap adatokkal. Látja az IP-címedet és a megnézett térképterületet. Nincs vele szerződésünk, ingyenes nyilvános szolgáltatás.",
          "Műholdas nézet: EOX IT Services GmbH, Ausztria (EU), tiles.maps.eox.at. Látja az IP-címedet és a térképterületet.",
          "Címkeresés: Photon (Komoot, Németország, EU) és OpenStreetMap Nominatim (OpenStreetMap Foundation, Egyesült Királyság). Látják, amit beírsz, a területet és az IP-címedet.",
          "Adatot nem adunk el. Ahol a szolgáltató az EU-n kívül van, az átadás jogalapja a fent megnevezett, vagy az adott ország megfelelőségi határozata.",
        ],
      },
      {
        h: "Meddig",
        p: ["A helyek, szavazatok, javaslatok és jelentések a törlésükig megmaradnak. Ha egy helyet törölnek, a szavazatai, javaslatai és jelentései is törlődnek vele. A hozzáadott helyeidet a Profil fülön törölheted; adminisztrátor törölhet vagy elrejthet helyeket és letilthat a feltételeket sértő azonosítókat. A névtelen azonosítód és az opcionális neved addig marad, amíg nem kéred a törlésüket. A szerverünk nem tart hozzáférési naplót. A telefonodon tárolt adatokat (a profilfotóddal együtt, ami sosem hagyja el a telefont) a böngészőadatok törlésével távolíthatod el."],
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
        p: ["Az app csak 16 éves és idősebb felhasználóknak szól."],
      },
    ],
  },
  imprint: {
    title: "Impresszum",
    updated: UPDATED.hu,
    sections: [
      { h: "Szolgáltató", p: ["{operator}", "{address}"] },
      { h: "Kapcsolat", p: ["{email}", "{phone}", "Kérdésekkel, adatkezelési kérésekkel, eltávolítási kérésekkel és jogellenes tartalomról szóló bejelentésekkel erre a címre írj. Néhány munkanapon belül igyekszünk válaszolni."] },
      { h: "Szolgáltatás", p: ["magyarotyesz, ingyenes közösségi térkép budapesti mosdók ajtókódjairól. Nem üzleti szolgáltatás, díjat nem számítunk fel."] },
      { h: "Tárhely", p: ["Webapp: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.", "Szerver: Oracle Cloud Infrastructure, Frankfurt, Németország."] },
      { h: "Térképadatok", p: ["Térkép © OpenFreeMap, © OpenMapTiles, adatok © OpenStreetMap közreműködők. A stílus a CartoDB alaptérképeken alapul (CC BY 3.0).", "Műholdkép: Sentinel-2 cloudless – https://s2maps.eu, EOX IT Services GmbH (módosított Copernicus Sentinel-adatokat tartalmaz, 2016 és 2017), CC BY 4.0."] },
    ],
  },
};

export const LEGAL: Record<Lang, Record<DocKey, Doc>> = { en, hu };
