"use client";

import { getSettings } from "./settings";

/**
 * A phone notification, if they're switched on in Profile and allowed.
 * Android Chrome only shows them through the service worker.
 */
export async function notify(title: string, body: string) {
  if (!getSettings().notify || !("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) await registration.showNotification(title, { body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png" });
    else new Notification(title, { body, icon: "/icons/icon-192.png" });
  } catch {
    // Not allowed here: the alert is still in Profile.
  }
}

/** Ask once; returns whether notifications can be shown. */
export async function askForNotifications() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  return (await Notification.requestPermission()) === "granted";
}
