# magyarotyesz on Google Play: steps and store texts

## Part 1. Steps (about one afternoon of work, plus Google's waiting times)

1. **Developer account.** https://play.google.com/console/signup, one-time $25, personal account, identity check (can take a few days). Use the same Google account you want to own the app.
2. **Own domain (recommended).** The Android app is tied to the web address. If you will ever move from `project-1y1mw.vercel.app`, do it **before** the first upload, then use the new address everywhere below.
3. **Build the Android app with PWABuilder.** Open https://www.pwabuilder.com, enter the app address, press Start, then Package for stores > Android.
   - Package ID: pick one and never change it, for example `hu.magyarotyesz.app`.
   - App name: `magyarotyesz`. Display mode: standalone. Notifications: on. Location delegation: on.
   - Signing key: choose **Create new** and **download the key file and passwords, back them up** (a lost key means you cannot update the app). Play App Signing will also re-sign it.
   - Download the zip; it contains the `.aab` file to upload.
4. **Asset links** (so the app opens the site without a browser bar). This repository already serves `/.well-known/assetlinks.json`. In the Vercel project (Settings > Environment Variables) set:
   - `ANDROID_PACKAGE_NAME` = the package ID from step 3
   - `ANDROID_SHA256_FINGERPRINTS` = the SHA-256 fingerprint(s), comma separated: the one PWABuilder shows for your signing key **and** the "App signing key certificate" from Play Console > Test and release > App integrity (after the first upload).
   - Redeploy, then open `https://<your address>/.well-known/assetlinks.json`: it must show your package name. If the browser bar still shows in the app, the fingerprints are wrong.
5. **Create the app in Play Console.** App, free, Android. Upload the `.aab` to **Closed testing** (a new personal account must run a closed test with at least 12 testers for 14 days before production; check Google's current rule). Add testers by email list (they must join with the Google account you list).
6. **Store listing:** paste the texts below. Graphics: app icon 512×512 (use `public/icons/icon-512.png`), feature graphic 1024×500, at least 2 phone screenshots (take them from the real app: map, a toilet card with a code, Profile with a rank).
7. **App content forms:** privacy policy link, account deletion link, ads (none), content rating, target audience, data safety (answers below).
8. After 14 days with 12+ testers: apply for production access, then publish.

## Part 2. Links to enter

- Privacy policy: `https://<your address>/privacy`
- Account deletion page (Play requires a public web link because the app lets people sign in): `https://<your address>/delete-account`
- Contact email: peter.racz.rhr@gmail.com
- Website: `https://<your address>`

## Part 3. Store listing, English

**App name (max 30):** magyarotyesz: toilet codes

**Short description (max 80):** Toilet door codes in Budapest, shared by people who got in.

**Full description (max 4000):**

Never guess a toilet code again.

Many cafés, restaurants and shops in Budapest keep their toilet behind a keypad. magyarotyesz is a free community map of those door codes, shared by people who have just used them.

What you can do
• See toilets near you on the map, with how fresh each code is: green dots are codes that worked lately.
• Tap a place to show its code, and see the walking time to get there.
• Say whether the code worked (one tap) so the next person knows.
• Know a code? Tap the map where it is and add it in a few seconds.
• "I need a toilet now": the closest open toilet in huge letters.
• Free and public toilets, paid ones and customer-only ones, with opening hours, wheelchair access, baby changing and gender-neutral tags.
• Save your favourite places, and search by address.
• Works offline once you save the Budapest map.
• Rank up as more people get in with your codes.
• Dark and light looks, many colour palettes, bigger text, English, Hungarian and German.

Private by design
No ads, no tracking. You do not need an account: your phone gets a random ID. If you want your profile on a new phone, sign in with Google or an emailed code. Your location stays on your phone; it is sent once to check that you are really at the toilet when you add or check a code, and is not stored. You can delete all your data any time in Settings.

Please share only codes for toilet doors, never for homes, staff areas or building entrances, and respect places meant for customers. Venues can ask us to remove their code at any time.

magyarotyesz is a community project. Codes are shared by users and can be wrong or out of date.

**What's new (first beta):** First beta. Find toilet codes in Budapest, add your own, and tell us what to improve in Settings > Send feedback.

## Part 3b. Store listing, Hungarian (magyar)

**Név (max 30):** magyarotyesz: WC-kódok

**Rövid leírás (max 80):** Budapesti mosdók ajtókódjai, azoktól, akik épp bejutottak.

**Teljes leírás:**

Soha többé ne találgasd a mosdókódot.

Sok budapesti kávézó, étterem és üzlet kódzár mögé teszi a mosdóját. A magyarotyesz ezeknek az ajtókódoknak az ingyenes, közösségi térképe, olyanok megosztásában, akik épp használták őket.

Mit tehetsz
• Nézd a közeli mosdókat a térképen, és lásd, mennyire friss a kód: a zöld pontok a nemrég bevált kódok.
• Koppints egy helyre a kódért, és nézd meg, mennyi a gyaloglás.
• Egy koppintással jelezd, bevált-e a kód, hogy a következő is tudja.
• Ismersz egy kódot? Koppints a térképre oda, ahol van, és add hozzá pár másodperc alatt.
• „Most kell egy WC”: a legközelebbi nyitott mosdó óriási betűkkel.
• Ingyenes, nyilvános, fizetős és csak vendégeknek szóló mosdók, nyitvatartással, akadálymentesítéssel, pelenkázóval és mindenkinek való jelöléssel.
• Mentsd a kedvenc helyeidet, és keress címre.
• Offline is működik, ha elmented a budapesti térképet.
• Lépj szintet, ahogy egyre többen jutnak be a te kódjaiddal.
• Sötét és világos megjelenés, sok színpaletta, nagyobb szöveg, magyar, angol és német nyelv.

Magánszféra tervezve
Nincs reklám, nincs követés. Nem kell fiók: a telefonod véletlenszerű azonosítót kap. Ha új telefonon is szeretnéd a profilodat, lépj be Google-lel vagy e-mailes kóddal. A helyzeted a telefonodon marad; kód hozzáadásakor vagy ellenőrzésekor egyszer elküldjük, hogy megnézzük, tényleg ott vagy-e, és nem tároljuk. Az adataidat bármikor törölheted a Beállításokban.

Kérjük, csak mosdóajtók kódját oszd meg, soha lakásokét, személyzeti helyiségekét vagy épületbejáratokét, és tartsd tiszteletben a vendégeknek szánt helyeket. A helyek üzemeltetői bármikor kérhetik a kódjuk eltávolítását.

A magyarotyesz közösségi projekt. A kódokat a felhasználók osztják meg, és lehetnek tévesek vagy elavultak.

**Újdonságok (első béta):** Első béta. Találj mosdókódokat Budapesten, add hozzá a sajátjaidat, és írd meg, mit javítsunk: Beállítások > Visszajelzés küldése.

## Part 4. Form answers (check each against the current Play form before sending)

**Category:** Maps & Navigation (or Lifestyle). **Tags:** maps, utilities. **Free**, no in-app purchases.

**Ads:** none.

**App access:** all functions are available without signing in (sign-in is optional). No test account needed.

**Target audience:** 16 and over (the app's terms require 16). Not designed for children; no "Designed for Families".

**Content rating questionnaire:** user-generated content: yes (places and short notes, with reporting and moderation); no violence, sexual content, gambling, drugs; shares location with other users: no (only toilet positions are shown, never the user's); users can interact/communicate: no.

**Data safety**
- Data collected and shared: nothing is sold or shared for advertising. Service providers only process it for the app (hosting).
- Location, precise: used for nearby toilets and an on-the-spot check; optional; **processed ephemerally** (sent once with an add/vote/report, not stored).
- Personal info: email address (only if the user chooses email sign-in; only a hash is stored, the address is used to send a code); name (optional profile name).
- User IDs: random app ID (account/profile).
- App activity and user-generated content: places, codes, notes, votes, reports, feedback messages.
- Is all data encrypted in transit: yes (HTTPS).
- Can users request deletion: yes, in the app (Settings > Delete my data) and at `/delete-account`.
- Data not collected: financial info, health, contacts, photos/files, audio, calendar, web browsing history, device identifiers for ads.

**Permissions** (the Android app asks for): location (optional), notifications (optional), vibration (no prompt).

## Part 5. Before you invite testers

- Update the server on the VM (`cd ~/magyarotyesz-server && bash scripts/update-server.sh`), set `GOOGLE_CLIENT_ID`, `SMTP_URL`, `MAIL_FROM`, `ADMIN_FROM_BROWSER`, then run the OSM import so Budapest is not empty.
- Add the Android app's origin to Google Cloud's OAuth client if Google sign-in fails inside the app (the web origin is the same, so it normally works unchanged).
- Lawyer review of the legal texts; Esri imagery licence check.
- Remove the five test toilets.
