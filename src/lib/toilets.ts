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
  /** This phone's own vote: one per person, and changing it moves it. */
  myVote?: "works" | "broken";
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
    myVote: "works",
  };
  store.set((list) => [toilet, ...list]);
  return toilet;
}

const update = (id: string, change: (t: Toilet) => Toilet) =>
  store.set((list) => list.map((t) => (t.id === id ? change(t) : t)));

/** "Still works": the code is fresh again. One vote per phone; switching moves it. */
export const confirmCode = (id: string) =>
  update(id, (t) => ({
    ...t,
    confirmedAt: new Date().toISOString(),
    confirms: t.myVote === "works" ? t.confirms : t.confirms + 1,
    reports: t.myVote === "broken" ? Math.max(0, t.reports - 1) : t.reports,
    myVote: "works",
  }));

/** "Doesn't work". */
export const reportCode = (id: string) =>
  update(id, (t) => ({
    ...t,
    reportedAt: new Date().toISOString(),
    reports: t.myVote === "broken" ? t.reports : t.reports + 1,
    confirms: t.myVote === "works" ? Math.max(0, t.confirms - 1) : t.confirms,
    myVote: "broken",
  }));

/**
 * The person who shared it edits it. A new code counts as a fresh
 * confirmation and clears any "doesn't work" report.
 */
export function editToilet(id: string, change: Partial<Pick<Toilet, "name" | "code" | "note">>) {
  update(id, (t) => {
    if (!t.mine) return t;
    const next = { ...t, ...change };
    if (change.code !== undefined && change.code !== t.code) {
      // A new code starts fresh: the old votes were about the old one.
      next.confirmedAt = new Date().toISOString();
      next.reportedAt = null;
      next.confirms = 1;
      next.reports = 0;
      next.myVote = "works";
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
    { name: "Fröccsterasz", code: "2580", kind: "bar", access: "customers", latitude: 47.4983, longitude: 19.0528, confirmedAt: at(1), reportedAt: at(20), confirms: 9, reports: 1 },
    { name: "WestEnd City Center", code: "1990#", kind: "mall", access: "free", latitude: 47.5131, longitude: 19.0573, confirmedAt: at(3), reportedAt: at(2), confirms: 5, reports: 4 },
    { name: "Café Kör", code: "7741", kind: "cafe", access: "customers", latitude: 47.5008, longitude: 19.0507, confirmedAt: at(9), reportedAt: at(1), confirms: 1, reports: 6 },
  ].map((t) => ({
    ...t,
    kind: t.kind as Kind,
    access: t.access as Access,
    id: crypto.randomUUID(),
    note: "",
    addedAt: at(30),
    mine: false,
  }));
  store.set((list) => [...list, ...others]);
}

/**
 * How much to trust a code, from 0 to 1: the share of people who said it
 * works. Nobody voted yet = in the middle.
 */
export function trust(t: Toilet) {
  const votes = t.confirms + t.reports;
  return votes === 0 ? 0.5 : t.confirms / votes;
}

/** Red (nobody gets in) through orange to green (everybody does). */
export function trustColor(t: Toilet) {
  const s = trust(t);
  return s < 0.5
    ? `color-mix(in oklch, var(--stale) ${Math.round(s * 200)}%, var(--bad))`
    : `color-mix(in oklch, var(--good) ${Math.round((s - 0.5) * 200)}%, var(--stale))`;
}

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
