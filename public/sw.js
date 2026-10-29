/*
  Keeps the app working without signal (metro, basements). Pages come
  from the network when there is one, so updates arrive straight away, and
  from the saved copy when there isn't. Built files are saved forever (their
  names change with every build). The codes themselves already live on the
  phone. Map pieces you have already seen are kept too (MAP_CACHE); new areas and address search need the internet.
*/
const CACHE = "magyarotyesz-v3";
// Map pieces from other servers (vector tiles, fonts, satellite). Seen once, they stay on the phone, so
// the places you have looked at still show up with no signal. Capped so it never fills the storage.
const MAP_CACHE = "magyarotyesz-map-v1";
// Satellite pictures (Esri) are left out on purpose: its licence does not allow copying them for offline use.
const MAP_HOSTS = ["tiles.openfreemap.org", "basemaps.cartocdn.com"];
// Budapest saved for offline use (Settings) is about 700 pieces; the rest is room for browsing.
const MAP_LIMIT = 12000;

const trimMap = async () => {
  const cache = await caches.open(MAP_CACHE);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAP_LIMIT)).map((key) => cache.delete(key)));
};

const PAGES = ["/", "/welcome", "/map", "/nearby", "/profile", "/urgent", "/settings", "/terms", "/privacy", "/imprint", "/manifest.webmanifest", "/icons/icon-192.png"];

// Fetches the pages again, skipping the browser's own cache, and saves them. The app asks for this every time it
// opens with a connection, because moving between pages inside the app never fetches the page itself: without it
// a phone offline would start from a copy as old as the install, with the old version of the app in it.
const refreshPages = () =>
  caches.open(CACHE).then((cache) =>
    Promise.all(
      PAGES.map((url) =>
        fetch(url, { cache: "reload" })
          .then((response) => (response.ok ? cache.put(url, response) : undefined))
          .catch(() => {}),
      ),
    ),
  );

self.addEventListener("message", (event) => {
  if (event.data === "refresh-pages") event.waitUntil(refreshPages());
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.all(PAGES.map((url) => cache.add(url).catch(() => {})))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== MAP_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (MAP_HOSTS.includes(url.hostname)) {
    // The tile list ("/planet") names the current tile version, so it goes to the network first.
    const fresh = url.pathname === "/planet" || url.pathname.endsWith("style.json");
    event.respondWith(
      (async () => {
        const cache = await caches.open(MAP_CACHE);
        const hit = await cache.match(request);
        if (hit && !fresh) return hit;
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone()).then(() => (Math.random() < 0.02 ? trimMap() : undefined));
          }
          return response;
        } catch (error) {
          if (hit) return hit;
          throw error;
        }
      })(),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Built files: saved once, served from the phone.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  // Pages and everything else: network first, the saved copy when offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request, { ignoreSearch: true })
          .then((hit) => hit || (request.mode === "navigate" ? caches.match("/map") : undefined))
          .then((hit) => hit || new Response("Offline", { status: 503 })),
      ),
  );
});

// Tapping an alert notification opens Profile, where the alerts are.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windows) => {
      const open = windows[0];
      if (open) return open.navigate("/profile").then((w) => w && w.focus());
      return self.clients.openWindow("/profile");
    }),
  );
});
