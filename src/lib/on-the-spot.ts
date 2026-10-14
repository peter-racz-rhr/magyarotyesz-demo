"use client";

import type { Coordinates } from "./location";
import { getSettings } from "./settings";
import { distance } from "./toilets";

/**
 * Against fake codes: you can only add a code, or say whether one works,
 * when you're actually there. Real accounts will add more (new accounts
 * counting less until they've been right a few times).
 */
export const NEAR_METRES = 150;

/** Where you are right now: a fresh fix, never one older than 30 seconds. */
function whereAmI() {
  return new Promise<Coordinates>((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });
}

export type SpotCheck = { ok: true } | { ok: false; reason: "location" } | { ok: false; reason: "far"; metres: number };

export async function checkOnTheSpot(place: { latitude: number; longitude: number }): Promise<SpotCheck> {
  if (!getSettings().nearbyCheck) return { ok: true };
  try {
    const metres = distance(await whereAmI(), place);
    return metres <= NEAR_METRES ? { ok: true } : { ok: false, reason: "far", metres };
  } catch {
    return { ok: false, reason: "location" };
  }
}
