import { getSettings } from "./settings";

export type Coordinates = { latitude: number; longitude: number };

const LAST = "magyarotyesz:last-place";
/** Budapest: where the map opens before the phone has ever told us where it is. */
export const DEFAULT_PLACE: Coordinates = { latitude: 47.4979, longitude: 19.0402 };

/** The last position the phone gave (rounded to about 1 km), so the map opens there next time even before asking again. */
export function lastPlace(): Coordinates | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(LAST) ?? "null") as Coordinates | null;
    return saved && Number.isFinite(saved.latitude) && Number.isFinite(saved.longitude) ? saved : null;
  } catch {
    return null;
  }
}
function rememberPlace(p: Coordinates) {
  try {
    window.localStorage.setItem(LAST, JSON.stringify({ latitude: Math.round(p.latitude * 100) / 100, longitude: Math.round(p.longitude * 100) / 100 }));
  } catch {
    // Storage blocked: the map just opens on the default place.
  }
}

/** Whether the browser already has an answer, so we don't ask twice. */
export async function locationPermission(): Promise<PermissionState | "unknown"> {
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    // Older Safari has no Permissions API for geolocation.
    return "unknown";
  }
}

export function requestLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    // Switched off in Profile: the phone's position is never read.
    if (!getSettings().location) {
      reject(new Error("off"));
      return;
    }
    if (!("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const here = { latitude: coords.latitude, longitude: coords.longitude };
        rememberPlace(here);
        resolve(here);
      },
      reject,
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    );
  });
}
