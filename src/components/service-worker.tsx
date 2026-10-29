"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker (production builds only), and keeps its saved pages as new as the
 * last time the phone was online: at start, and again whenever the connection comes back.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const refresh = () => {
      if (!navigator.onLine) return;
      void navigator.serviceWorker.ready.then((registration) => {
        void registration.update().catch(() => {});
        registration.active?.postMessage("refresh-pages");
      });
    };
    void navigator.serviceWorker.register("/sw.js").then(refresh, () => {});
    window.addEventListener("online", refresh);
    return () => window.removeEventListener("online", refresh);
  }, []);
  return null;
}
