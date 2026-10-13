"use client";

import { createLocalStore } from "./local-store";

/*
  A toilet and its door code, as people shared it. For the demo everything
  lives on this device; swap the store for a shared database to go live.
*/

export const KINDS = {
  cafe: "Café",
  restaurant: "Restaurant",
  bar: "Bar",
  mall: "Mall",
  station: "Station",
  other: "Other",
} as const;
export type Kind = keyof typeof KINDS;

export type Access = "free" | "customers";
export const ACCESS: Record<Access, string> = {
  free: "Free to use",
  customers: "Customers only",
};

export type Toilet = {
  id: string;
  name: string;
  code: string;
  kind: Kind;
  access: Access;
  note: string;
  latitude: number;
  longitude: number;
  addedAt: string;
  /** Last time someone said the code works. */
  confirmedAt: string;
  /** Last time someone said it doesn't, or null. */
  reportedAt: string | null;
  confirms: number;
  reports: number;
  /** Added on this phone. */
  mine: boolean;
};

const store = createLocalStore<Toilet[]>("magyarotyesz:toilets", []);
export const useToilets = store.useValue;

export function addToilet(
  input: Pick<Toilet, "name" | "code" | "kind" | "access" | "note" | "latitude" | "longitude">,
) {
  const now = new Date().toISOString();
  const toilet: Toilet = {
    ...input,
    id: crypto.randomUUID(),
    addedAt: now,
    confirmedAt: now,
    reportedAt: null,
    confirms: 1,
    reports: 0,
    mine: true,
  };
  store.set((list) => [toilet, ...list]);
  return toilet;
}

const update = (id: string, change: (t: Toilet) => Toilet) =>
  store.set((list) => list.map((t) => (t.id === id ? change(t) : t)));

/** "Still works": the code is fresh again. */
export const confirmCode = (id: string) =>
  update(id, (t) => ({ ...t, confirmedAt: new Date().toISOString(), confirms: t.confirms + 1 }));

/** "Doesn't work". */
export const reportCode = (id: string) =>
  update(id, (t) => ({ ...t, reportedAt: new Date().toISOString(), reports: t.reports + 1 }));

/** Someone typed in the new code: it counts as a fresh confirmation. */
export const replaceCode = (id: string, code: string) =>
  update(id, (t) => ({
    ...t,
    code,
    confirmedAt: new Date().toISOString(),
    reportedAt: null,
    confirms: t.confirms + 1,
  }));

export const removeToilet = (id: string) => store.set((list) => list.filter((t) => t.id !== id));

export const clearToilets = () => store.set([]);

/*
  How much to trust a code:
  - good: someone said it works in the last 7 days
  - stale: it worked once, but not confirmed lately
  - bad: the latest word is that it doesn't work
*/
export type Health = "good" | "stale" | "bad";
const FRESH_DAYS = 7;

export function health(t: Toilet, now = Date.now()): Health {
  if (t.reportedAt && t.reportedAt > t.confirmedAt) return "bad";
  const age = now - new Date(t.confirmedAt).getTime();
  return age < FRESH_DAYS * 24 * 60 * 60 * 1000 ? "good" : "stale";
}

export const HEALTH: Record<Health, { label: string; color: string; text: string }> = {
  good: { label: "Works", color: "var(--good)", text: "text-good" },
  stale: { label: "Not checked lately", color: "var(--stale)", text: "text-stale" },
  bad: { label: "Reported not working", color: "var(--bad)", text: "text-bad" },
};

/** Straight-line distance in metres. */
export function distance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export const formatDistance = (m: number) =>
  m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`;

const relative = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

/** "just now", "5 minutes ago", "yesterday", "3 weeks ago". */
export function ago(iso: string, now = Date.now()) {
  const s = (new Date(iso).getTime() - now) / 1000;
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(s) >= size) return relative.format(Math.round(s / size), unit);
  }
  return "just now";
}
