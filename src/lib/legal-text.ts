import type { Lang } from "./settings";
import type { DocKey } from "./legal";

/*
  The legal texts, in English and Hungarian (revised 29 October 2026). {operator}, {email},
  {address} and {phone} are filled in from the environment (see legal.ts). A line starting
  with "- " is a list item; **bold** is allowed. They are plain-language texts for a small
  hobby project that no lawyer has read yet: change them only together with the app.
*/

export type Section = { h: string; p: string[] };
export type Doc = { title: string; updated: string; intro?: string; sections: Section[] };

const en: Record<DocKey, Doc> = {
  terms: {
    title: "Terms of use",
    updated: "Last updated: 29 October 2026",
    intro: "magyarotyesz is a free community map of toilet door codes in Budapest, run by {operator} ({address}, {email}). By tapping \"I am 16 or older and I agree\" you accept these terms.",
    sections: [
      {
        h: "What this is",
        p: [
          "People share the codes of toilet doors they have used, including toilets in cafés, restaurants and shops that are meant for customers. We do not own or control these places and cannot promise that a code is right or current, or that you will be let in. Use the codes at your own judgement and risk.",
        ],
      },
      {
        h: "Who can use it",
        p: [
          "You must be at least 16 years old to use magyarotyesz. You do not need an account: your phone gets a random ID that does not contain your name or contact details. You can also sign in with Google or with an email address, so that your profile stays with you when you change browser or phone.",
        ],
      },
      {
        h: "What you may add",
        p: [
          "You may add the code of a toilet door that you have used yourself, including a toilet meant for a venue's customers (for example a code printed on a receipt). The venue can ask us to remove it at any time (see Reporting and removal).",
          "Do not add:\n- codes for private homes, staff-only areas, offices, storerooms or security areas;\n- codes for building entrances, gates, stairwells or any door that opens more than a toilet;\n- codes you were told by staff or by someone else on the condition that you keep them to yourself;\n- offensive, hateful, sexual, illegal or misleading names or notes, personal data about anyone, advertising, spam or fake votes.",
          "Names and notes pass an automatic word filter. This is a safety net, not a guarantee.",
          "You keep the rights to what you write. You give us a free permission to store it, show it to other users and remove it, for as long as the service runs or until you delete it.",
        ],
      },
      {
        h: "Reporting and removal",
        p: [
          "Every place has a Report button. Our rules for hiding content are:\n- one report that a place is not a toilet hides it automatically, straight away;\n- several reports that a place is offensive or private hide it automatically too;\n- every hidden place is then checked by the administrator (one person), usually within a few days, and is either shown again or removed.",
          "We remove content that breaks these terms or the law. We may block the ID of a phone that repeatedly adds such content.",
          "**If you run a place** and do not want its code listed (for example because it is meant for customers only), write to {email} with the name and address of the place. We will remove it within 48 hours and will not list it again.",
          "**Notices about illegal content** can be sent to the same address or with the Report button. Please explain why you think the content is illegal and where it is in the app. We confirm that we received your notice and tell you what we decided. If you report from the app, the answer appears under Profile > Alerts.",
          "**If we hide or remove something you shared, or block your ID,** we tell you in the app (Profile > Alerts): what we did, why (which rule of these terms or which law), whether it happened automatically, and how you can challenge it. You can ask us to look at the decision again by writing to {email} within six months; a person, not a machine, will review it. You can also go to court, or complain to Hungary's Digital Services Coordinator, the National Media and Infocommunications Authority (NMHH, nmhh.hu).",
          "If something in the app makes us suspect a crime that threatens someone's life or safety, we report it to the police.",
          "Contact point under the EU Digital Services Act (Articles 11 and 12), for users and for authorities: {email}. We answer in Hungarian and English.",
        ],
      },
      {
        h: "Who is responsible",
        p: [
          "magyarotyesz only passes on what its users share. We do not open doors, we do not give anyone permission to enter a place, and we are not a party between you and the people who run it. A code that works is not a right to enter. If a venue's toilet is for customers, respect that.",
          "You are responsible for what you do with a code and for what you share. If you share a code you were not allowed to share, or one that opens more than a toilet, you are responsible for that.",
          "We are a hosting service for what users add. We do not check every entry beforehand, but once we know about illegal content we remove it quickly (see Reporting and removal). Other users' entries are theirs, not ours.",
          "Nothing in these terms limits liability that the law does not allow to be limited, for example for harm caused on purpose or by gross negligence, or for injury to life, body or health.",
        ],
      },
      {
        h: "No guarantees",
        p: [
          "The service is free and provided as it is. We do not guarantee that it is available, accurate or error free. To the extent the law allows, we are not liable for loss caused by a wrong or outdated code or by the service being unavailable.",
        ],
      },
      {
        h: "Ending use",
        p: [
          "You can stop using magyarotyesz at any time and delete your data in Settings (\"Delete my data\"). We can end or pause the service; if we shut it down, we will say so in the app at least 30 days in advance where possible.",
        ],
      },
      {
        h: "Changes and law",
        p: [
          "We may change these terms. If we make a change that matters for you, we show it in the app before it takes effect and ask you to accept it again; if you do not agree, you can stop using the app and delete your data. The date above shows the current version.",
          "Hungarian law applies. If you are a consumer, you keep the protection of the mandatory law of the country where you live, and you can go to court there.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    updated: "Last updated: 29 October 2026",
    intro: "The controller of your data is {operator}, {address}, {email}, {phone}. We process only what the app needs.",
    sections: [
      {
        h: "What we process",
        p: [
          "**Your ID.** When you first use the shared map your phone gets a random ID and a secret token. The server keeps the ID, a hash of the token, and which places you added and when. There is no name, email or phone number unless you sign in with an account (see below), but the ID is still personal data under the GDPR, because it links your contributions together. We call it pseudonymous, not anonymous.",
          "**Account (optional).** If you press \"Continue with Google\", Google's sign-in script is loaded (Google sees your IP address) and Google tells our server a stable id for your Google account. If you choose \"Continue with email\", we send a six-digit code to the address you type. In both cases our server stores only a keyed hash of that id or address, enough to recognise you next time, and not the address itself. The address exists on our server only while the code is sent. The hash is linked to your ID, so it is personal data. This lets you sign in to the same profile in another browser or on another phone.",
          "**Profile name (optional).** If you choose a name, it is saved with your ID on the server. Only you and the administrator can see it; it is not shown on any place.",
          "**Your contributions.** Places you add (name, code, kind, opening hours, note, position, date), your votes, your code suggestions and your reports, including the optional message in a report. Because a place shows where its toilet is and when you added it, it can show where you were at that time.",
          "**Location.** Your phone's position is read on the phone to show where you are and to sort nearby places. When you add a place, vote, suggest a code or report a place, your position is sent with the request so the server can check that you are within about 150 m of the toilet. The server uses it for that check and does not store it. Location is off unless you allow it, and you can turn it off at any time in Settings (\"Use my location\") or in your phone or browser settings. Without it you can still browse the map; only adding and checking codes need it.",
          "**Messages.** If you send feedback, we store your message and, if you give one, the contact detail you write in \"How can we answer?\". If the administrator sends you a message, it is stored with your ID so you can see it under Alerts.",
          "**Moderation records.** If a place is hidden or removed or an ID is blocked, we keep what was decided, why, and when.",
          "**Technical data.** Your IP address is processed to deliver the service and to limit abuse. Our server writes no access log: the address is held in memory for about an hour for abuse limits and is then forgotten. The providers named below keep their own technical logs.",
          "**On your phone.** Settings, a copy of the places, your profile photo (which never leaves the phone) and a queue of actions waiting to be sent are stored in your browser's local storage. This is strictly necessary for the app you asked to use, so no cookie banner is needed. We use no analytics and no advertising trackers.",
        ],
      },
      {
        h: "Why, and on what legal basis",
        p: [
          "- Running the shared map you asked to use, including your ID, contributions and moderation messages: performance of the service (GDPR Art. 6(1)(b)).\n- Keeping the map safe and free of abuse and illegal content (IP abuse limits, reports, moderation records, blocking): our legitimate interest in a usable, lawful service (Art. 6(1)(f)), and our legal duties under the EU Digital Services Act (Art. 6(1)(c)).\n- The on-the-spot location check: your consent, given when you allow location (Art. 6(1)(a)). You can withdraw it at any time; this does not affect checks already made.\n- Feedback: our legitimate interest in answering you and improving the app (Art. 6(1)(f)).",
          "Where we rely on legitimate interest, you can object at any time (see Your rights).",
        ],
      },
      {
        h: "Who else sees data",
        p: [
          "We do not sell data. These providers are involved:\n- **Server:** Oracle Cloud Infrastructure, Frankfurt, Germany (EU). It stores the server data. Oracle is a US company; any access from outside the EU is covered by the EU–US Data Privacy Framework and/or standard contractual clauses in Oracle's data processing terms.\n- **Server address:** the server is reached through sslip.io, a free DNS service that translates the server's name into its IP address. It handles the name lookup only, not your data.\n- **App hosting:** Vercel Inc., USA. It delivers the web app and sees your IP address when the app loads. The transfer is covered by the EU–US Data Privacy Framework and/or standard contractual clauses in Vercel's data processing terms.\n- **Map tiles:** OpenFreeMap (openfreemap.org), with OpenStreetMap data. It receives your IP address and the map area you look at. It is a free public service; we have no contract with it.\n- **Sign-in with Google (optional):** Google LLC, USA, only if you press Continue with Google. It sees your IP address and that you use magyarotyesz. The transfer is covered by the EU–US Data Privacy Framework and/or standard contractual clauses in Google's terms.\n- **Emailed codes (optional):** the email provider that delivers the code to you (it sees your address and the code email). \n- **Satellite view:** Esri Inc., USA (server.arcgisonline.com). Only if you switch the satellite view on, it receives your IP address and the map area. The transfer is covered by the EU–US Data Privacy Framework and/or standard contractual clauses in Esri's terms.\n- **Address search:** Photon, run by Komoot, Germany (EU), suggests results while you type. OpenStreetMap Nominatim, run by the OpenStreetMap Foundation in the United Kingdom, is asked only when you press Search. They receive what you typed, the map area and your IP address. The transfer to the United Kingdom relies on the European Commission's adequacy decision for the UK.",
        ],
      },
      {
        h: "How long we keep data",
        p: [
          "- Places stay on the map until you, the administrator or a venue's request removes them. When a place is deleted, its votes, suggestions and reports are deleted with it.\n- Your ID, profile name, and the link between you and your contributions: deleted when you use \"Delete my data\", or automatically after 24 months without any activity. After automatic deletion, the places you added stay on the map without any link to you.\n- Reports and their messages: deleted 6 months after they are handled.\n- Feedback messages and contact details: deleted 12 months after we receive them.\n- Moderation records and the ID of a blocked phone: kept while the block lasts, and at most 24 months.\n- IP addresses on our server: about one hour, in memory only.\n- Data on your phone: until you clear the app's browser data or use \"Delete my data\".",
        ],
      },
      {
        h: "Your rights",
        p: [
          "You can ask for access to your data, correction, deletion, restriction of processing and a copy in a portable format, and you can object to processing based on our legitimate interest.",
          "The quickest ways:\n- **Copy of your data:** Settings > \"Download my data\" gives you a file with everything the server links to your ID.\n- **Deletion:** Settings > \"Delete my data\" deletes your ID, your profile name, the places you added with their votes and suggestions, your votes and suggestions on other places, your reports, and your alerts from the server, and clears the app on your phone. This cannot be undone.",
          "You can also write to {email}. Because we do not know who you are, we may ask you to prove that you control the ID, for example with a code shown in your app's Settings. We answer within one month.",
          "You can complain to the Hungarian National Authority for Data Protection and Freedom of Information (NAIH), 1055 Budapest, Falk Miksa utca 9-11, www.naih.hu, or to the data protection authority of the EU country where you live, or go to court.",
        ],
      },
      {
        h: "Children",
        p: [
          "The app is only for people aged 16 and over. If we learn that a user is younger, we delete their data.",
        ],
      },
      {
        h: "Changes",
        p: [
          "If we change this policy in a way that matters for you, we tell you in the app before the change takes effect.",
        ],
      },
    ],
  },
  imprint: {
    title: "Imprint",
    updated: "Last updated: 29 October 2026",
    sections: [
      {
        h: "Service provider",
        p: [
          "{operator} (private individual)",
          "{address}",
        ],
      },
      {
        h: "Contact",
        p: [
          "Email: {email}",
          "Phone: {phone}",
          "Use the email address for questions, privacy requests, removal requests from venues and notices about illegal content. Removal requests from venues are handled within 48 hours; other messages usually within a few working days. We answer in Hungarian and English.",
        ],
      },
      {
        h: "Service",
        p: [
          "magyarotyesz, a free community map of toilet door codes in Budapest. Not a commercial service; no fee is charged.",
        ],
      },
      {
        h: "Supervisory authorities",
        p: [
          "Data protection: Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH), 1055 Budapest, Falk Miksa utca 9-11, www.naih.hu.",
          "EU Digital Services Act: Nemzeti Média- és Hírközlési Hatóság (NMHH), Hungary's Digital Services Coordinator, nmhh.hu.",
        ],
      },
      {
        h: "Hosting",
        p: [
          "Web app: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.",
          "Server: Oracle Cloud Infrastructure, Frankfurt, Germany.",
        ],
      },
      {
        h: "Map data",
        p: [
          "Map © OpenFreeMap, © OpenMapTiles, data © OpenStreetMap contributors. Style based on the CartoDB basemaps (CC BY 3.0).",
          "Satellite: Powered by Esri. Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community.",
        ],
      },
    ],
  },
};

const hu: Record<DocKey, Doc> = {
  terms: {
    title: "Felhasználási feltételek",
    updated: "Utolsó frissítés: 2026. október 29.",
    intro: "A magyarotyesz ingyenes, közösségi térkép budapesti mosdók ajtókódjairól. Üzemeltetője: {operator} ({address}, {email}). Az „Elmúltam 16 éves, és elfogadom” gomb megnyomásával elfogadod ezeket a feltételeket.",
    sections: [
      {
        h: "Mi ez",
        p: [
          "Az emberek megosztják azoknak a mosdóknak az ajtókódját, amelyeket használtak, köztük kávézók, éttermek és üzletek vendégeknek szánt mosdóiét is. Ezek a helyek nem a mieink, nem mi irányítjuk őket, és nem vállalhatjuk, hogy egy kód helyes, naprakész, vagy hogy beengednek. A kódokat saját belátásod szerint és saját felelősségedre használd.",
        ],
      },
      {
        h: "Ki használhatja",
        p: [
          "A magyarotyesz használatához legalább 16 évesnek kell lenned. Fiók nem szükséges: a telefonod véletlenszerű azonosítót kap, amely nem tartalmazza a nevedet és az elérhetőségedet. Bejelentkezhetsz Google-lel vagy e-mail-címmel is, hogy a profilod böngészőváltáskor vagy új telefonon is megmaradjon.",
        ],
      },
      {
        h: "Mit adhatsz hozzá",
        p: [
          "Hozzáadhatod annak a mosdóajtónak a kódját, amelyet te magad használtál, akkor is, ha a mosdó egy hely vendégeinek szól (például a blokkra nyomtatott kód). A hely üzemeltetője bármikor kérheti az eltávolítását (lásd: Jelentés és eltávolítás).",
          "Ne add hozzá:\n- magánlakások, csak személyzetnek szánt helyiségek, irodák, raktárak vagy biztonsági területek kódját;\n- kapuk, épületbejáratok, lépcsőházak vagy bármely olyan ajtó kódját, amely többet nyit egy mosdónál;\n- olyan kódot, amelyet a személyzet vagy más azzal a feltétellel mondott el, hogy megtartod magadnak;\n- sértő, gyűlöletkeltő, szexuális, jogellenes vagy félrevezető nevet vagy megjegyzést, más személyes adatát, reklámot, spamet vagy hamis szavazatot.",
          "A nevek és megjegyzések automatikus szófilteren mennek át. Ez biztonsági háló, nem garancia.",
          "A tartalmad jogai nálad maradnak. Ingyenes engedélyt adsz arra, hogy eltároljuk, megmutassuk más felhasználóknak és eltávolítsuk, amíg a szolgáltatás működik, vagy amíg nem törlöd.",
        ],
      },
      {
        h: "Jelentés és eltávolítás",
        p: [
          "Minden helyen van Jelentés gomb. A tartalmak elrejtésének szabályai:\n- ha valaki jelenti, hogy egy hely nem mosdó, az automatikusan, azonnal elrejtődik;\n- ha többen jelentik sértőnek vagy magánjellegűnek, az is automatikusan elrejtődik;\n- minden elrejtett helyet ezután az adminisztrátor (egy személy) megnéz, általában néhány napon belül, és vagy újra megjeleníti, vagy eltávolítja.",
          "Eltávolítjuk a feltételeket vagy a jogszabályt sértő tartalmat. Letilthatjuk annak a telefonnak az azonosítóját, amely ismételten ilyen tartalmat ad hozzá.",
          "**Ha egy hely üzemeltetője vagy**, és nem szeretnéd, hogy a kódja szerepeljen (például mert csak vendégeknek szól), írj a {email} címre a hely nevével és címével. 48 órán belül eltávolítjuk, és nem tesszük vissza.",
          "**Jogellenes tartalomról szóló bejelentést** ugyanerre a címre vagy a Jelentés gombbal küldhetsz. Kérjük, írd meg, miért tartod jogellenesnek, és hol található az appban. Visszaigazoljuk a bejelentés beérkezését, és tájékoztatunk a döntésünkről. Ha az appból jelentettél, a válasz a Profil > Értesítések alatt jelenik meg.",
          "**Ha elrejtünk vagy eltávolítunk valamit, amit megosztottál, vagy letiltjuk az azonosítódat,** az appban (Profil > Értesítések) megírjuk: mit tettünk, miért (a feltételek melyik pontja vagy melyik jogszabály alapján), automatikusan történt-e, és hogyan kifogásolhatod. Hat hónapon belül kérheted a döntés felülvizsgálatát a {email} címen; ezt ember vizsgálja meg, nem gép. Bírósághoz is fordulhatsz, vagy panaszt tehetsz Magyarország digitális szolgáltatási koordinátoránál, a Nemzeti Média- és Hírközlési Hatóságnál (NMHH, nmhh.hu).",
          "Ha az appban valami olyan bűncselekmény gyanújára utal, amely valakinek az életét vagy biztonságát veszélyezteti, azt jelentjük a rendőrségnek.",
          "Az EU digitális szolgáltatásokról szóló rendelete (DSA, 11. és 12. cikk) szerinti kapcsolattartó pont a felhasználók és a hatóságok számára: {email}. Magyarul és angolul válaszolunk.",
        ],
      },
      {
        h: "Ki a felelős",
        p: [
          "A magyarotyesz csak azt adja tovább, amit a felhasználók megosztanak. Nem mi nyitjuk az ajtókat, senkinek nem adunk engedélyt egy helyre való belépéshez, és nem vagyunk fél közted és a hely üzemeltetője között. Az, hogy egy kód működik, nem jogosít fel a belépésre. Ha egy mosdó a vendégeknek szól, ezt tartsd tiszteletben.",
          "Te felelsz azért, amit egy kóddal teszel, és azért, amit megosztasz. Ha olyan kódot osztasz meg, amelyet nem lett volna szabad, vagy amely többet nyit egy mosdónál, azért te felelsz.",
          "A felhasználók által feltöltött tartalom tárhelyszolgáltatója vagyunk. Nem ellenőrzünk előre minden bejegyzést, de a jogellenes tartalmat, amint tudomást szerzünk róla, gyorsan eltávolítjuk (lásd: Jelentés és eltávolítás). A többi felhasználó bejegyzései az övéik, nem a mieink.",
          "E feltételek egyike sem korlátozza azt a felelősséget, amelyet jogszabály nem enged korlátozni, például a szándékosan vagy súlyos gondatlansággal okozott kárért, illetve az élet, a testi épség vagy az egészség megsértéséért való felelősséget.",
        ],
      },
      {
        h: "Garancia nélkül",
        p: [
          "A szolgáltatás ingyenes, és olyan, amilyen. Nem garantáljuk, hogy elérhető, pontos vagy hibamentes. A jogszabályok által megengedett mértékben nem felelünk a téves vagy elavult kódból, illetve a szolgáltatás elérhetetlenségéből eredő kárért.",
        ],
      },
      {
        h: "A használat befejezése",
        p: [
          "Bármikor abbahagyhatod a magyarotyesz használatát, és törölheted az adataidat a Beállításokban („Adataim törlése”). Mi befejezhetjük vagy szüneteltethetjük a szolgáltatást; ha megszüntetjük, ezt lehetőség szerint legalább 30 nappal előre jelezzük az appban.",
        ],
      },
      {
        h: "Változások, irányadó jog",
        p: [
          "A feltételeket módosíthatjuk. Ha egy változás érint téged, azt a hatálybalépése előtt megmutatjuk az appban, és újra kérjük az elfogadásodat; ha nem értesz egyet, abbahagyhatod az app használatát és törölheted az adataidat. A fenti dátum a hatályos változatot mutatja.",
          "A magyar jog az irányadó. Ha fogyasztó vagy, megtartod a lakóhelyed szerinti ország kötelező jogának védelmét, és ott is fordulhatsz bírósághoz.",
        ],
      },
    ],
  },
  privacy: {
    title: "Adatkezelési tájékoztató",
    updated: "Utolsó frissítés: 2026. október 29.",
    intro: "Az adataid kezelője: {operator}, {address}, {email}, {phone}. Csak azt kezeljük, amire az appnak szüksége van.",
    sections: [
      {
        h: "Milyen adatokat kezelünk",
        p: [
          "**Azonosító.** Amikor először használod a közös térképet, a telefonod kap egy véletlenszerű azonosítót és egy titkos tokent. A szerver tárolja az azonosítót, a token hash-ét, és azt, hogy mely helyeket és mikor adtad hozzá. Nincs név, e-mail-cím vagy telefonszám, hacsak nem lépsz be fiókkal (lásd alább), de az azonosító a GDPR szerint így is személyes adat, mert összeköti a hozzájárulásaidat. Ezért álnevesnek, nem névtelennek nevezzük.",
          "**Fiók (nem kötelező).** Ha a „Folytatás Google-lel” gombot nyomod meg, betöltődik a Google belépési szkriptje (a Google látja az IP-címedet), és a Google átad a szerverünknek egy állandó azonosítót a Google-fiókodról. Ha a „Folytatás e-maillel” lehetőséget választod, hat számjegyű kódot küldünk a megadott címre. Mindkét esetben a szerverünk csak az azonosító vagy a cím kulcsolt hash-ét tárolja, ami elég ahhoz, hogy legközelebb felismerjen, magát a címet nem. A cím a szerverünkön csak a kód elküldéséig létezik. A hash az azonosítódhoz kapcsolódik, ezért személyes adat. Ezáltal ugyanabba a profilba léphetsz be másik böngészőben vagy másik telefonon.",
          "**Profilnév (nem kötelező).** Ha megadsz egy nevet, az az azonosítódhoz kötve tárolódik a szerveren. Csak te és az adminisztrátor látja, egyetlen helynél sem jelenik meg.",
          "**Hozzájárulásaid.** A hozzáadott helyek (név, kód, fajta, nyitva tartás, megjegyzés, helyzet, dátum), a szavazataid, a kódjavaslataid és a jelentéseid, a jelentéshez írt üzenettel együtt. Mivel egy hely megmutatja, hol van a mosdó és mikor adtad hozzá, abból kiderülhet, hol voltál akkor.",
          "**Helyadat.** A telefonod pozícióját a telefonon olvassuk, hogy megmutassuk, hol vagy, és sorba rendezzük a közeli helyeket. Hely hozzáadásakor, szavazáskor, kódjavaslatkor és jelentéskor a pozíciódat elküldjük a kéréssel, hogy a szerver ellenőrizze, hogy kb. 150 méteren belül vagy a mosdótól. A szerver csak erre az ellenőrzésre használja, és nem tárolja. A helymeghatározás csak akkor működik, ha engedélyezed, és bármikor kikapcsolhatod a Beállításokban („Helyem használata”) vagy a telefon, illetve a böngésző beállításaiban. Nélküle is böngészheted a térképet; csak a kódok hozzáadásához és ellenőrzéséhez kell.",
          "**Üzenetek.** Ha visszajelzést küldesz, eltároljuk az üzenetedet és, ha megadod, a „Hogyan válaszolhatunk?” mezőbe írt elérhetőséget. Ha az adminisztrátor üzenetet küld neked, az az azonosítódhoz kötve tárolódik, hogy láthasd az Értesítések alatt.",
          "**Moderálási nyilvántartás.** Ha egy helyet elrejtünk vagy eltávolítunk, vagy letiltunk egy azonosítót, megőrizzük, mit döntöttünk, miért és mikor.",
          "**Technikai adat.** Az IP-címedet a szolgáltatás nyújtásához és a visszaélések korlátozásához kezeljük. A szerverünk nem ír hozzáférési naplót: a címet kb. egy órán át a memóriában tartja a visszaélések korlátozásához, aztán elfelejti. Az alább megnevezett szolgáltatók saját technikai naplót vezetnek.",
          "**A telefonodon.** A beállítások, a helyek másolata, a profilképed (amely sosem hagyja el a telefont) és az elküldésre váró műveletek a böngésző helyi tárolójában vannak. Ez a kért app működéséhez feltétlenül szükséges, ezért nincs szükség sütibannerre. Nem használunk analitikát és hirdetési követőket.",
        ],
      },
      {
        h: "Miért és milyen jogalapon",
        p: [
          "- A kért közös térkép működtetése, ideértve az azonosítót, a hozzájárulásaidat és a moderálási üzeneteket: a szolgáltatás nyújtása (GDPR 6. cikk (1) b)).\n- A térkép biztonsága, a visszaélések és a jogellenes tartalmak elleni védelem (IP-alapú korlátozás, jelentések, moderálási nyilvántartás, letiltás): jogos érdekünk egy használható és jogszerű szolgáltatáshoz (6. cikk (1) f)), valamint az EU digitális szolgáltatásokról szóló rendeletéből fakadó kötelezettségeink (6. cikk (1) c)).\n- A helyszíni helyellenőrzés: a hozzájárulásod, amelyet a helymeghatározás engedélyezésével adsz (6. cikk (1) a)). Bármikor visszavonhatod; ez nem érinti a már elvégzett ellenőrzéseket.\n- Visszajelzések: jogos érdekünk, hogy válaszoljunk és javítsuk az appot (6. cikk (1) f)).",
          "Ahol jogos érdekre hivatkozunk, bármikor tiltakozhatsz (lásd: Jogaid).",
        ],
      },
      {
        h: "Ki látja még",
        p: [
          "Adatot nem adunk el. Ezek a szolgáltatók vesznek részt:\n- **Szerver:** Oracle Cloud Infrastructure, Frankfurt, Németország (EU). Itt tárolódnak a szerveradatok. Az Oracle amerikai cég; az EU-n kívüli esetleges hozzáférésre az EU–USA adatvédelmi keretrendszer (Data Privacy Framework) és/vagy az Oracle adatfeldolgozási feltételeiben szereplő általános szerződési feltételek (SCC) vonatkoznak.\n- **Szervercím:** a szervert az sslip.io-n keresztül érjük el. Ez egy ingyenes DNS-szolgáltatás, amely a szerver nevét IP-címre fordítja. Csak a névfeloldást végzi, az adataidat nem látja.\n- **Az app kiszolgálása:** Vercel Inc., USA. Kiszolgálja a webappot, és betöltéskor látja az IP-címedet. Az adattovábbításra az EU–USA adatvédelmi keretrendszer és/vagy a Vercel adatfeldolgozási feltételeiben szereplő általános szerződési feltételek vonatkoznak.\n- **Térképcsempék:** OpenFreeMap (openfreemap.org), OpenStreetMap adatokkal. Látja az IP-címedet és a megnézett térképterületet. Ingyenes, nyilvános szolgáltatás; nincs vele szerződésünk.\n- **Belépés Google-lel (nem kötelező):** Google LLC, USA, csak ha a Folytatás Google-lel gombot nyomod meg. Látja az IP-címedet és azt, hogy a magyarotyesz-t használod. Az adattovábbításra az EU–USA adatvédelmi keretrendszer és/vagy a Google feltételeiben szereplő általános szerződési feltételek vonatkoznak.\n- **E-mailben küldött kódok (nem kötelező):** az e-mail-szolgáltató, amely kézbesíti neked a kódot (látja a címedet és a kódot tartalmazó levelet).\n- **Műholdas nézet:** Esri Inc., USA (server.arcgisonline.com). Csak ha bekapcsolod a műholdas nézetet, akkor látja az IP-címedet és a térképterületet. Az adattovábbításra az EU–USA adatvédelmi keretrendszer és/vagy az Esri feltételeiben szereplő általános szerződési feltételek vonatkoznak.\n- **Címkeresés:** a Photon (Komoot, Németország, EU) gépelés közben ad javaslatokat. Az OpenStreetMap Nominatimot (OpenStreetMap Foundation, Egyesült Királyság) csak akkor kérdezzük, ha megnyomod a Keresés gombot. Látják, amit beírtál, a térképterületet és az IP-címedet. Az Egyesült Királyságba történő továbbítás az Európai Bizottság megfelelőségi határozatán alapul.",
        ],
      },
      {
        h: "Meddig őrizzük meg az adatokat",
        p: [
          "- A helyek addig maradnak a térképen, amíg te, az adminisztrátor vagy egy hely üzemeltetőjének kérése el nem távolítja őket. Egy hely törlésekor a hozzá tartozó szavazatok, javaslatok és jelentések is törlődnek.\n- Az azonosítód, a profilneved, valamint a közted és a hozzájárulásaid közötti kapcsolat: az „Adataim törlése” használatakor, vagy automatikusan 24 hónap inaktivitás után törlődik. Automatikus törlés után az általad hozzáadott helyek a térképen maradnak, de már nem kapcsolódnak hozzád.\n- A jelentések és üzeneteik: a kezelésük után 6 hónappal törlődnek.\n- A visszajelzések és a megadott elérhetőségek: a beérkezésük után 12 hónappal törlődnek.\n- A moderálási nyilvántartás és a letiltott telefon azonosítója: a letiltás idejéig, legfeljebb 24 hónapig.\n- Az IP-címek a szerverünkön: kb. egy óráig, csak a memóriában.\n- A telefonodon tárolt adatok: amíg nem törlöd az app böngészőadatait, vagy nem használod az „Adataim törlése” funkciót.",
        ],
      },
      {
        h: "Jogaid",
        p: [
          "Kérhetsz hozzáférést az adataidhoz, helyesbítést, törlést, az adatkezelés korlátozását és az adataid hordozható formában való kiadását, valamint tiltakozhatsz a jogos érdeken alapuló adatkezelés ellen.",
          "A leggyorsabb módok:\n- **Másolat az adataidról:** Beállítások > „Adataim letöltése”: egy fájlt kapsz mindenről, amit a szerver az azonosítódhoz köt.\n- **Törlés:** Beállítások > „Adataim törlése”: a szerverről törli az azonosítódat, a profilnevedet, az általad hozzáadott helyeket a szavazataikkal és javaslataikkal, a más helyekre adott szavazataidat és javaslataidat, a jelentéseidet és az értesítéseidet, és kiüríti az appot a telefonodon. Nem vonható vissza.",
          "Írhatsz a {email} címre is. Mivel nem tudjuk, ki vagy, kérhetjük, hogy igazold, hogy az azonosító a tiéd, például az app Beállításaiban látható kóddal. Egy hónapon belül válaszolunk.",
          "Panaszt tehetsz a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH), 1055 Budapest, Falk Miksa utca 9-11., www.naih.hu, vagy annak az EU-s országnak az adatvédelmi hatóságánál, ahol élsz, illetve bírósághoz fordulhatsz.",
        ],
      },
      {
        h: "Gyermekek",
        p: [
          "Az app csak 16 éves és idősebb felhasználóknak szól. Ha kiderül, hogy egy felhasználó fiatalabb, töröljük az adatait.",
        ],
      },
      {
        h: "Változások",
        p: [
          "Ha ezt a tájékoztatót olyan módon változtatjuk meg, amely érint téged, a hatálybalépés előtt jelezzük az appban.",
        ],
      },
    ],
  },
  imprint: {
    title: "Impresszum",
    updated: "Utolsó frissítés: 2026. október 29.",
    sections: [
      {
        h: "Szolgáltató",
        p: [
          "{operator} (magánszemély)",
          "{address}",
        ],
      },
      {
        h: "Kapcsolat",
        p: [
          "E-mail: {email}",
          "Telefon: {phone}",
          "Kérdésekkel, adatkezelési kérésekkel, helyek üzemeltetőitől érkező eltávolítási kérésekkel és jogellenes tartalomról szóló bejelentésekkel az e-mail-címre írj. Az üzemeltetők eltávolítási kéréseit 48 órán belül, a többi üzenetet általában néhány munkanapon belül intézzük. Magyarul és angolul válaszolunk.",
        ],
      },
      {
        h: "Szolgáltatás",
        p: [
          "magyarotyesz, ingyenes közösségi térkép budapesti mosdók ajtókódjairól. Nem üzleti szolgáltatás, díjat nem számítunk fel.",
        ],
      },
      {
        h: "Felügyeleti hatóságok",
        p: [
          "Adatvédelem: Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH), 1055 Budapest, Falk Miksa utca 9-11., www.naih.hu.",
          "EU digitális szolgáltatásokról szóló rendelet: Nemzeti Média- és Hírközlési Hatóság (NMHH), Magyarország digitális szolgáltatási koordinátora, nmhh.hu.",
        ],
      },
      {
        h: "Tárhely",
        p: [
          "Webapp: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.",
          "Szerver: Oracle Cloud Infrastructure, Frankfurt, Németország.",
        ],
      },
      {
        h: "Térképadatok",
        p: [
          "Térkép © OpenFreeMap, © OpenMapTiles, adatok © OpenStreetMap közreműködők. A stílus a CartoDB alaptérképeken alapul (CC BY 3.0).",
          "Műholdkép: Powered by Esri. Forrás: Esri, Vantor, Earthstar Geographics és a GIS User Community.",
        ],
      },
    ],
  },
};

const LEGAL_BY_LANG: Record<"en" | "hu", Record<DocKey, Doc>> = { en, hu };
/** The terms, privacy policy and imprint exist in English and Hungarian only; German shows the English ones. */
export const legalFor = (lang: Lang) => LEGAL_BY_LANG[lang === "hu" ? "hu" : "en"];
