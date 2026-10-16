"use client";

import { REMOTE } from "./api";
import type { Location } from "./sync";
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
  return new Promise<Location>((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("unsupported"));
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  });
}

/** Anything vaguer than this and a position says little about which door you're at. */
export const MAX_ACCURACY = 100;

export type SpotCheck =
  | { ok: true; location?: Location }
  | { ok: false; reason: "location" }
  | { ok: false; reason: "off" }
  | { ok: false; reason: "vague"; metres: number }
  | { ok: false; reason: "far"; metres: number };

/**
 * Connected mode always checks (the server does too, and needs the position
 * sent along); the demo can switch the check off in Profile.
 */
export async function checkOnTheSpot(place: { latitude: number; longitude: number }): Promise<SpotCheck> {
  if (!REMOTE && !getSettings().nearbyCheck) return { ok: true };
  if (!getSettings().location) return { ok: false, reason: "off" };
  try {
    const location = await whereAmI();
    if (location.accuracy > MAX_ACCURACY) return { ok: false, reason: "vague", metres: Math.round(location.accuracy) };
    const metres = distance(location, place);
    return metres <= NEAR_METRES ? { ok: true, location } : { ok: false, reason: "far", metres };
  } catch {
    return { ok: false, reason: "location" };
  }
}
