"use client";

import { createLocalStore } from "./local-store";

/*
  A toilet and its door code, as people shared it. For the demo everything
  lives on this device; swap the stores for a shared database to go live.
*/

export const KIND_KEYS = ["cafe", "restaurant", "bar", "mall", "station", "other"] as const;
export type Kind = (typeof KIND_KEYS)[number];

export const ACCESS_KEYS = ["free", "customers", "paid"] as const;
export type Access = (typeof ACCESS_KEYS)[number];

/** "HH:MM" opening and closing time, or open round the clock. */
export type Hours = { open: string; close: string } | "24/7";

export type Toilet = {
  id: string;
  name: string;
  code: string;
  kind: Kind;
  access: Access;
  /** For paid toilets, in forints. */
  price?: number;
  hours?: Hours;
  wheelchair?: boolean;
  babyChanging?: boolean;
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

export type ToiletInput = Pick<
  Toilet,
  "name" | "code" | "kind" | "access" | "price" | "hours" | "wheelchair" | "babyChanging" | "note" | "latitude" | "longitude"
>;

const store = createLocalStore<Toilet[]>("magyarotyesz:toilets", []);
export const useToilets = store.useValue;
export const getToilets = store.get;

/* Against spam: one phone can add at most this many codes a day. */
export const DAILY_LIMIT = 10;
const addLog = createLocalStore<string[]>("magyarotyesz:adds", []);

export function addedToday(now = Date.now()) {
  return addLog.get().filter((at) => now - new Date(at).getTime() < 24 * 60 * 60 * 1000).length;
}

export function addToilet(input: ToiletInput) {
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
  addLog.set((log) => [now, ...log].slice(0, 50));
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
 * The person who shared it edits it. A new code starts the votes fresh:
 * the old ones were about the old code.
 */
export function editToilet(
  id: string,
  change: Partial<Pick<Toilet, "name" | "code" | "note" | "access" | "price" | "hours" | "wheelchair" | "babyChanging">>,
) {
  update(id, (t) => {
    if (!t.mine) return t;
    const next = { ...t, ...change };
    if (change.code !== undefined && change.code !== t.code) {
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

/* ------------------------------------------------------------------ */
/* Alerts: what happened to the codes you shared                       */
/* ------------------------------------------------------------------ */

export type Alert = {
  id: string;
  toiletId: string;
  name: string;
  kind: "report" | "suggestion";
  code?: string;
  at: string;
  read: boolean;
};

const alertStore = createLocalStore<Alert[]>("magyarotyesz:alerts", []);
export const useAlerts = alertStore.useValue;
export const markAlertsRead = () => alertStore.set((list) => list.map((a) => ({ ...a, read: true })));
export const clearAlerts = () => alertStore.set([]);

/**
 * Demo only: there is nobody else yet, so this plays someone else finding
 * that one of your codes stopped working and suggesting the new one.
 * Returns the alerts it made, so the caller can also notify the phone.
 */
export function simulateActivity(): Alert[] {
  const mine = store.get().filter((t) => t.mine);
  if (mine.length === 0) return [];
  const target = mine[Math.floor(Math.random() * mine.length)];
  const now = new Date().toISOString();
  const code = String(Math.floor(1000 + Math.random() * 9000)) + (target.code.endsWith("#") ? "#" : "");
  update(target.id, (t) => ({
    ...t,
    reportedAt: now,
    reports: t.reports + 1,
    suggestions: [{ id: crypto.randomUUID(), code, at: now }, ...(t.suggestions ?? [])],
  }));
  const made: Alert[] = [
    { id: crypto.randomUUID(), toiletId: target.id, name: target.name, kind: "report", at: now, read: false },
    { id: crypto.randomUUID(), toiletId: target.id, name: target.name, kind: "suggestion", code, at: now, read: false },
  ];
  alertStore.set((list) => [...made, ...list].slice(0, 50));
  return made;
}

/**
 * Demo only: until there are accounts, everything on this phone is yours.
 * These stand in for codes other people shared, so you can try suggesting.
 */
export function addDemoToilets() {
  const day = 24 * 60 * 60 * 1000;
  const at = (daysAgo: number) => new Date(Date.now() - daysAgo * day).toISOString();
  const base = { note: "", addedAt: at(30), mine: false };
  const others: Toilet[] = [
    { ...base, id: crypto.randomUUID(), name: "Fröccsterasz", code: "2580", kind: "bar", access: "customers", hours: { open: "12:00", close: "02:00" }, latitude: 47.4983, longitude: 19.0528, confirmedAt: at(1), reportedAt: at(20), confirms: 9, reports: 1 },
    { ...base, id: crypto.randomUUID(), name: "WestEnd City Center", code: "1990#", kind: "mall", access: "free", hours: { open: "08:00", close: "22:00" }, wheelchair: true, babyChanging: true, latitude: 47.5131, longitude: 19.0573, confirmedAt: at(3), reportedAt: at(2), confirms: 5, reports: 4 },
    { ...base, id: crypto.randomUUID(), name: "Café Kör", code: "7741", kind: "cafe", access: "customers", hours: { open: "10:00", close: "22:00" }, latitude: 47.5008, longitude: 19.0507, confirmedAt: at(9), reportedAt: at(1), confirms: 1, reports: 6 },
    { ...base, id: crypto.randomUUID(), name: "Nyilvános WC, Deák tér", code: "300 Ft", kind: "station", access: "paid", price: 300, hours: "24/7", wheelchair: true, latitude: 47.4972, longitude: 19.0546, confirmedAt: at(2), reportedAt: null, confirms: 6, reports: 0 },
  ];
  store.set((list) => [...list, ...others]);
}

/* ------------------------------------------------------------------ */
/* Trust, opening hours, distance, time                                */
/* ------------------------------------------------------------------ */

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

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Whether it's open now: true, false, or null when nobody said. Closing
 * times after midnight (12:00–02:00) work too.
 */
export function isOpen(t: Toilet, now = new Date()): boolean | null {
  if (!t.hours) return null;
  if (t.hours === "24/7") return true;
  const at = now.getHours() * 60 + now.getMinutes();
  const open = minutes(t.hours.open);
  const close = minutes(t.hours.close);
  if (open === close) return true;
  return open < close ? at >= open && at < close : at >= open || at < close;
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

/** "just now", "5 minutes ago", "yesterday", "3 weeks ago" (or in Hungarian). */
export function ago(iso: string, lang: "en" | "hu" = "en", now = Date.now()) {
  const relative = new Intl.RelativeTimeFormat(lang === "hu" ? "hu" : "en-GB", { numeric: "auto" });
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
  return lang === "hu" ? "épp most" : "just now";
}

/** Walking directions in Google Maps (opens the app on phones that have it). */
export const directionsUrl = (t: Toilet) =>
  `https://www.google.com/maps/dir/?api=1&destination=${t.latitude},${t.longitude}&travelmode=walking`;
