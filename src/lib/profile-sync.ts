"use client";

import { api, REMOTE } from "./api";
import { createLocalStore } from "./local-store";
import { getSaved, setSaved, subscribeSaved } from "./saved";
import { getSettings, subscribeSettings, updateSettings, type Settings } from "./settings";
import { getIdentityToken, hasAccount, subscribeMe, syncNow } from "./sync";

/*
  Keeps the rest of the profile with the account: the photo, the avatar colour, the saved places and the app's
  look-and-feel settings. A change here is sent a moment later; signing in on a new phone (or after reinstalling)
  brings it all back. Only with a Google or email account. Things that belong to this phone (location,
  notifications) stay here.
*/

const SYNCED = ["lang", "theme", "textSize", "palette", "flavour", "navStyle", "glass", "mapStyle", "showCodes", "haptics", "animations", "buildings3d"] as const satisfies readonly (keyof Settings)[];
const MAX_PHOTO = 200_000;

type Remote = { photo: string; avatar: number; saved: string[]; settings: Record<string, string | boolean | number>; updatedAt: string };
/** What was last agreed with the server, and whether this phone has changed something since. */
const meta = createLocalStore<{ syncedAt: string; dirty: boolean }>("magyarotyesz:profile-sync", { syncedAt: "", dirty: false });

const local = () => {
  const s = getSettings();
  return {
    photo: s.photo.length <= MAX_PHOTO ? s.photo : "",
    avatar: s.avatar,
    saved: getSaved().slice(0, 500),
    settings: Object.fromEntries(SYNCED.map((k) => [k, s[k]])) as Record<string, string | boolean | number>,
  };
};

let applying = false;
let lastSignature = "";
let pushTimer = 0;
let pulledAt = 0;

async function push() {
  const token = getIdentityToken();
  if (!token || !hasAccount()) return;
  try {
    const res = await api<{ profile: Remote }>("/v1/me/profile", { method: "PUT", token, body: local() });
    if (!res.notModified) meta.set({ syncedAt: res.data.profile.updatedAt, dirty: false });
  } catch {
    // Offline or refused: stays "dirty" and goes with the next change or pull.
  }
}
const schedulePush = () => {
  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => void push(), 2000);
};

function apply(remote: Remote) {
  applying = true;
  try {
    const settings: Partial<Settings> = {};
    for (const key of SYNCED) if (key in remote.settings) (settings as Record<string, unknown>)[key] = remote.settings[key];
    updateSettings({ ...settings, photo: remote.photo, avatar: remote.avatar });
    setSaved(remote.saved);
  } finally {
    applying = false;
  }
  lastSignature = JSON.stringify(local());
  meta.set({ syncedAt: remote.updatedAt, dirty: false });
}

/** Ask the server for the profile: newer there and nothing changed here, take it; changed here, send ours. */
async function pull() {
  const token = getIdentityToken();
  if (!token || !hasAccount()) return;
  pulledAt = Date.now();
  try {
    const res = await api<{ profile: Remote | null }>("/v1/me/profile", { token });
    if (res.notModified) return;
    const remote = res.data.profile;
    const { syncedAt, dirty } = meta.get();
    if (!remote || dirty) return void push();
    if (remote.updatedAt !== syncedAt) apply(remote);
  } catch {
    // Try again later.
  }
}

/** Fetch the profile now (right after signing in, so the next screen already shows the restored photo and name). */
export const pullProfileNow = async () => {
  // The name comes with the rest of the profile from the server (/v1/me); the photo and settings from here.
  await syncNow().catch(() => {});
  await pull();
};

/** Started once by the sync runner. Returns a stop function. */
export function startProfileSync() {
  if (!REMOTE) return () => {};
  lastSignature = JSON.stringify(local());
  const changed = () => {
    if (applying) return;
    const signature = JSON.stringify(local());
    if (signature === lastSignature) return;
    lastSignature = signature;
    meta.set((m) => ({ ...m, dirty: true }));
    if (hasAccount()) schedulePush();
  };
  // Just signed in, or the app started with an account: fetch (at most every few minutes).
  let had = hasAccount();
  const account = () => {
    const now = hasAccount();
    if (now && (!had || Date.now() - pulledAt > 5 * 60_000)) void pull();
    had = now;
  };
  const offs = [subscribeSettings(changed), subscribeSaved(changed), subscribeMe(account)];
  if (had) void pull();
  return () => {
    offs.forEach((off) => off());
    window.clearTimeout(pushTimer);
  };
}
