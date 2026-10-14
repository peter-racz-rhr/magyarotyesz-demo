/*
  Keeps the app working without signal (metro, basements). Pages come
  from the network when there is one, so updates arrive straight away, and
  from the saved copy when there isn't. Built files are saved forever (their
  names change with every build). The codes themselves already live on the
  phone. Map tiles and address search still need the internet.
*/
const CACHE = "magyarotyesz-v1";
const PAGES = ["/", "/welcome", "/map", "/nearby", "/profile", "/manifest.webmanifest", "/icons/icon-192.png"];

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
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
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
