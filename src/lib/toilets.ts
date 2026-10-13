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
  /** Shared from this phone: only the person who shared a code can edit it. */
  mine: boolean;
  /** New codes other people suggested, for the person who shared it to accept. */
  suggestions?: Suggestion[];
};

export type Suggestion = { id: string; code: string; at: string };

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

/**
 * The person who shared it edits it. A new code counts as a fresh
 * confirmation and clears any "doesn't work" report.
 */
export function editToilet(id: string, change: Partial<Pick<Toilet, "name" | "code" | "note">>) {
  update(id, (t) => {
    if (!t.mine) return t;
    const next = { ...t, ...change };
    if (change.code !== undefined && change.code !== t.code) {
      next.confirmedAt = new Date().toISOString();
      next.reportedAt = null;
      next.confirms = t.confirms + 1;
      next.suggestions = (t.suggestions ?? []).filter((s) => s.code !== change.code);
    }
    return next;
  });
}

/** Anyone else can only suggest a new code. */
export const suggestCode = (id: string, code: string) =>
  update(id, (t) => ({
    ...t,
    suggestions: [{ id: crypto.randomUUID(), code, at: new Date().toISOString() }, ...(t.suggestions ?? [])],
  }));

export const dismissSuggestion = (id: string, suggestionId: string) =>
  update(id, (t) => ({ ...t, suggestions: (t.suggestions ?? []).filter((s) => s.id !== suggestionId) }));

export const removeToilet = (id: string) => store.set((list) => list.filter((t) => t.id !== id));

export const clearToilets = () => store.set([]);

/**
 * Demo only: until there are accounts, everything on this phone is yours.
 * These stand in for codes other people shared, so you can try suggesting.
 */
export function addDemoToilets() {
  const day = 24 * 60 * 60 * 1000;
  const at = (daysAgo: number) => new Date(Date.now() - daysAgo * day).toISOString();
  const others: Toilet[] = [
    { name: "Fröccsterasz", code: "2580", kind: "bar", access: "customers", latitude: 47.4983, longitude: 19.0528, confirmedAt: at(1), reportedAt: null },
    { name: "WestEnd City Center", code: "1990#", kind: "mall", access: "free", latitude: 47.5131, longitude: 19.0573, confirmedAt: at(12), reportedAt: null },
    { name: "Café Kör", code: "7741", kind: "cafe", access: "customers", latitude: 47.5008, longitude: 19.0507, confirmedAt: at(9), reportedAt: at(2) },
  ].map((t) => ({
    ...t,
    kind: t.kind as Kind,
    access: t.access as Access,
    id: crypto.randomUUID(),
    note: "",
    addedAt: at(30),
    confirms: 4,
    reports: t.reportedAt ? 1 : 0,
    mine: false,
  }));
  store.set((list) => [...list, ...others]);
}

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
