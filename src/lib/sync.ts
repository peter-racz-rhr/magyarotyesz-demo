"use client";

import { useSyncExternalStore } from "react";
import { api, ApiFailure, Offline, REMOTE } from "./api";
import { createLocalStore } from "./local-store";
import type { Alert, Toilet } from "./toilets";

/*
  Offline-first sync with the server.

  - `cache`   : the server's toilets as of the last sync (kept on the phone)
  - `me`      : what the server knows about this phone (what it owns, voted, alerts)
  - `outbox`  : things done on this phone that the server hasn't confirmed yet
  - what you see is the cache with the outbox laid on top, so adding a code
    or voting works instantly, with or without internet, and is sent later.
*/

type ServerToilet = {
  id: string;
  name: string;
  code: string;
  kind: Toilet["kind"];
  access: Toilet["access"];
  price: number | null;
  hours: Toilet["hours"] | null;
  wheelchair: boolean;
  babyChanging: boolean;
  note: string;
  latitude: number;
  longitude: number;
  addedAt: string;
  confirmedAt: string | null;
  reportedAt: string | null;
  confirms: number;
  reports: number;
};

type Cache = { seq: number | null; etag?: string; toilets: ServerToilet[] };
type Me = {
  owns: string[];
  votes: Record<string, boolean>;
  suggestions: Record<string, { id: string; code: string; at: string }[]>;
  alerts: { id: string; toiletId: string; name: string; kind: "report" | "suggestion"; code: string | null; at: string; read: boolean }[];
  addsLeftToday: number;
  /** Running total of people who got in with this phone's codes; kept by the server across code changes. */
  gotIn?: number;
};
export type Location = { latitude: number; longitude: number; accuracy: number };
export type OutAction = {
  id: string;
  type: string;
  at: string;
  location?: Location;
  payload: Record<string, unknown>;
  /** For the "couldn't be sent" message. */
  name?: string;
};
/** Something the server turned down after the phone had already shown it as done. */
export type Notice = { id: string; type: string; code: string; message: string; name?: string; at: string };

const cache = createLocalStore<Cache>("magyarotyesz:server", { seq: null, toilets: [] });
const identity = createLocalStore<{ userId: string; token: string } | null>("magyarotyesz:identity", null);
const meStore = createLocalStore<Me>("magyarotyesz:me", { owns: [], votes: {}, suggestions: {}, alerts: [], addsLeftToday: 10, gotIn: 0 });
export const useGotInTotal = () => meStore.useValue().gotIn ?? 0;
const outbox = createLocalStore<OutAction[]>("magyarotyesz:outbox", []);
const noticeStore = createLocalStore<Notice[]>("magyarotyesz:notices", []);
const clearedAt = createLocalStore<string>("magyarotyesz:alerts-cleared", "");
const seenAlerts = createLocalStore<string[] | null>("magyarotyesz:alerts-seen", null);

export const useNotices = noticeStore.useValue;
export const dismissNotice = (id: string) => noticeStore.set((list) => list.filter((n) => n.id !== id));

/* ---------------------------- status ---------------------------- */

type Status = { syncing: boolean; online: boolean | null; lastSyncAt: string | null };
let status: Status = { syncing: false, online: null, lastSyncAt: null };
const statusListeners = new Set<() => void>();
const setStatus = (change: Partial<Status>) => {
  status = { ...status, ...change };
  statusListeners.forEach((l) => l());
};
const serverStatus: Status = status;
export const useSyncStatus = () =>
  useSyncExternalStore(
    (l) => (statusListeners.add(l), () => void statusListeners.delete(l)),
    () => status,
    () => serverStatus,
  );

export const usePendingCount = () => outbox.useValue().length;
/** Has this phone ever received the server's toilets? */
export const useLoaded = () => cache.useValue().seq !== null;

/* ---------------------------- the view ---------------------------- */

const resetVotes = (t: Toilet, at: string): Toilet => ({ ...t, confirmedAt: at, reportedAt: null, confirms: 1, reports: 0, myVote: "works" });

function fromServer(s: ServerToilet, me: Me): Toilet {
  const mine = me.owns.includes(s.id);
  const vote = me.votes[s.id];
  return {
    id: s.id,
    name: s.name,
    code: s.code,
    kind: s.kind,
    access: s.access,
    price: s.price ?? undefined,
    hours: s.hours ?? undefined,
    wheelchair: s.wheelchair || undefined,
    babyChanging: s.babyChanging || undefined,
    note: s.note,
    latitude: s.latitude,
    longitude: s.longitude,
    addedAt: s.addedAt,
    confirmedAt: s.confirmedAt ?? s.addedAt,
    reportedAt: s.reportedAt,
    confirms: s.confirms,
    reports: s.reports,
    mine,
    myVote: vote === undefined ? undefined : vote ? "works" : "broken",
    suggestions: mine ? (me.suggestions[s.id] ?? []) : undefined,
  };
}

function build(server: ServerToilet[], me: Me, actions: OutAction[]): Toilet[] {
  const map = new Map<string, Toilet>();
  for (const s of server) map.set(s.id, fromServer(s, me));
  const pending = new Set<string>();

  for (const a of actions) {
    // Payloads are built in toilets.ts, so their shapes are known here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = a.payload as Record<string, any>;
    if (a.type === "add_toilet") {
      const price = p.price ?? undefined;
      map.set(p.id, {
        id: p.id,
        name: p.name,
        code: p.code,
        kind: p.kind,
        access: p.access,
        price,
        hours: p.hours ?? undefined,
        wheelchair: p.wheelchair || undefined,
        babyChanging: p.babyChanging || undefined,
        note: p.note,
        latitude: p.latitude,
        longitude: p.longitude,
        addedAt: a.at,
        confirmedAt: a.at,
        reportedAt: null,
        confirms: 1,
        reports: 0,
        mine: true,
        myVote: "works",
        suggestions: [],
      });
      pending.add(p.id);
      continue;
    }
    if (a.type === "mark_alerts_read") continue;
    const t = map.get(p.toiletId);
    if (!t) continue;
    pending.add(t.id);
    if (a.type === "vote") {
      const works = p.works as boolean;
      const was = t.myVote;
      map.set(t.id, {
        ...t,
        confirms: Math.max(0, t.confirms + (works && was !== "works" ? 1 : 0) - (!works && was === "works" ? 1 : 0)),
        reports: Math.max(0, t.reports + (!works && was !== "broken" ? 1 : 0) - (works && was === "broken" ? 1 : 0)),
        ...(works ? { confirmedAt: a.at } : { reportedAt: a.at }),
        myVote: works ? "works" : "broken",
      });
    } else if (a.type === "edit_toilet") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const changes = p.changes as Record<string, any>;
      let next: Toilet = { ...t, ...changes };
      if ("price" in changes) next.price = changes.price ?? undefined;
      if ("hours" in changes) next.hours = changes.hours ?? undefined;
      if (changes.code !== undefined && changes.code !== t.code) {
        next = resetVotes(next, a.at);
        next.suggestions = (t.suggestions ?? []).filter((s) => s.code !== changes.code);
      }
      map.set(t.id, next);
    } else if (a.type === "accept_suggestion") {
      const s = (t.suggestions ?? []).find((x) => x.id === p.suggestionId);
      if (s) map.set(t.id, { ...resetVotes({ ...t, code: s.code }, a.at), suggestions: (t.suggestions ?? []).filter((x) => x.code !== s.code) });
    } else if (a.type === "dismiss_suggestion") {
      map.set(t.id, { ...t, suggestions: (t.suggestions ?? []).filter((x) => x.id !== p.suggestionId) });
    } else if (a.type === "delete_toilet") {
      map.delete(t.id);
    }
  }
  for (const id of pending) {
    const t = map.get(id);
    if (t) map.set(id, { ...t, pending: true });
  }
  return [...map.values()];
}

let lastIn: [Cache, Me, OutAction[]] | null = null;
let lastOut: Toilet[] = [];
const EMPTY: Toilet[] = [];
function view() {
  const c = cache.get();
  const m = meStore.get();
  const o = outbox.get();
  if (lastIn && lastIn[0] === c && lastIn[1] === m && lastIn[2] === o) return lastOut;
  lastIn = [c, m, o];
  lastOut = build(c.toilets, m, o);
  return lastOut;
}
const subscribeAll = (listener: () => void) => {
  const offs = [cache.subscribe, meStore.subscribe, outbox.subscribe].map((s) => s(listener));
  return () => offs.forEach((off) => off());
};
export const getRemoteToilets = view;
export const useRemoteToilets = () => useSyncExternalStore(subscribeAll, view, () => EMPTY);

const alertsView = (): Alert[] => {
  const cleared = clearedAt.get();
  return meStore
    .get()
    .alerts.filter((a) => !cleared || a.at > cleared)
    .map((a) => ({ id: a.id, toiletId: a.toiletId, name: a.name, kind: a.kind, code: a.code ?? undefined, at: a.at, read: a.read }));
};
let lastAlerts: { m: Me; c: string; out: Alert[] } | null = null;
function alerts() {
  const m = meStore.get();
  const c = clearedAt.get();
  if (lastAlerts && lastAlerts.m === m && lastAlerts.c === c) return lastAlerts.out;
  lastAlerts = { m, c, out: alertsView() };
  return lastAlerts.out;
}
const EMPTY_ALERTS: Alert[] = [];
export const useRemoteAlerts = () =>
  useSyncExternalStore(
    (l) => {
      const a = meStore.subscribe(l);
      const b = clearedAt.subscribe(l);
      return () => (a(), b());
    },
    alerts,
    () => EMPTY_ALERTS,
  );
export const markRemoteAlertsRead = () => {
  if (!meStore.get().alerts.some((a) => !a.read)) return;
  meStore.set((m) => ({ ...m, alerts: m.alerts.map((a) => ({ ...a, read: true })) }));
  enqueue("mark_alerts_read", {});
};
export const clearRemoteAlerts = () => {
  const newest = meStore.get().alerts[0]?.at;
  if (newest) clearedAt.set(newest);
};

/** Adds this phone can still send today. */
export const addsLeft = () => Math.max(0, meStore.get().addsLeftToday - outbox.get().filter((a) => a.type === "add_toilet").length);

/* ---------------------------- outbox ---------------------------- */

export function enqueue(type: string, payload: Record<string, unknown>, extra: { location?: Location; name?: string } = {}) {
  const action: OutAction = { id: crypto.randomUUID(), type, at: new Date().toISOString(), payload, ...extra };
  outbox.set((list) => [...list, action]);
  scheduleSync();
  return action;
}

export const clearOutbox = () => outbox.set([]);

/* ---------------------------- syncing ---------------------------- */

let alertHandler: ((fresh: Alert[]) => void) | null = null;
export const onNewAlerts = (handler: ((fresh: Alert[]) => void) | null) => {
  alertHandler = handler;
};

let running: Promise<void> | null = null;
let again = false;
let timer: number | undefined;

export function scheduleSync(delay = 250) {
  if (!REMOTE || typeof window === "undefined") return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void syncNow(), delay);
}

export function syncNow(): Promise<void> {
  if (!REMOTE) return Promise.resolve();
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    setStatus({ syncing: true });
    try {
      await run();
      setStatus({ online: true, lastSyncAt: new Date().toISOString() });
    } catch (error) {
      setStatus({ online: error instanceof Offline ? false : status.online });
    } finally {
      setStatus({ syncing: false });
      running = null;
      if (again) {
        again = false;
        scheduleSync(500);
      }
    }
  })();
  return running;
}

async function ensureIdentity() {
  const known = identity.get();
  if (known) return known;
  const res = await api<{ userId: string; token: string }>("/v1/register", { method: "POST" });
  if (res.notModified) throw new Offline();
  identity.set(res.data);
  return res.data;
}

/** Retryable: no answer, busy, or server trouble. Anything else is a final "no". */
const transient = (e: unknown) => e instanceof Offline || (e instanceof ApiFailure && (e.status === 429 || e.status >= 500));

/**
 * Sends what's waiting. Confirmed items stay in the outbox until the new
 * server data is in too (see `run`), so nothing flickers in between.
 */
async function flush(acked: Set<string>, notices: Notice[]) {
  for (;;) {
    const batch = outbox.get().filter((a) => !acked.has(a.id)).slice(0, 100);
    if (batch.length === 0) return;
    const me = await ensureIdentity();
    let res;
    try {
      res = await api<{ results: { id: string; status: "ok" | "duplicate" | "rejected"; error?: string; message?: string }[] }>("/v1/actions", {
        method: "POST",
        token: me.token,
        body: { actions: batch.map(({ id, type, at, location, payload }) => ({ id, type, at, ...(location ? { location } : {}), payload })) },
      });
    } catch (e) {
      // The server forgot this phone (wiped or restored from an old backup): start a new identity.
      if (e instanceof ApiFailure && e.status === 401) {
        identity.set(null);
        continue;
      }
      throw e;
    }
    if (res.notModified) throw new Offline();
    const byId = new Map(res.data.results.map((r) => [r.id, r]));
    const now = new Date().toISOString();
    for (const a of batch) {
      acked.add(a.id);
      const r = byId.get(a.id);
      if (r?.status === "rejected") {
        notices.push({ id: a.id, type: a.type, code: r.error ?? "rejected", message: r.message ?? "", name: a.name, at: now });
      }
    }
  }
}

async function snapshot() {
  const res = await api<{ seq: number; toilets: ServerToilet[] }>("/v1/snapshot", { etag: cache.get().seq !== null ? cache.get().etag : undefined });
  if (res.notModified) return;
  cache.set({ seq: res.data.seq, etag: res.etag, toilets: res.data.toilets });
}

async function pull() {
  if (cache.get().seq === null) return snapshot();
  for (;;) {
    const since = cache.get().seq!;
    let res;
    try {
      res = await api<{
        seq: number;
        more: boolean;
        changes: ({ type: "upsert"; toilet: ServerToilet } | { type: "delete"; toiletId: string })[];
      }>(`/v1/changes?since=${since}`);
    } catch (e) {
      // The feed no longer reaches back that far, or the server was reset: start over.
      if (e instanceof ApiFailure && (e.status === 410 || e.code === "invalid_cursor")) return snapshot();
      throw e;
    }
    if (res.notModified) return;
    if (res.data.changes.length) {
      const map = new Map(cache.get().toilets.map((t) => [t.id, t]));
      for (const c of res.data.changes) {
        if (c.type === "upsert") map.set(c.toilet.id, c.toilet);
        else map.delete(c.toiletId);
      }
      cache.set({ seq: res.data.seq, toilets: [...map.values()] });
    } else if (res.data.seq !== since) {
      cache.set({ ...cache.get(), seq: res.data.seq, etag: undefined });
    }
    if (!res.data.more) return;
  }
}

async function refreshMe() {
  const known = identity.get();
  if (!known) return;
  let res;
  try {
    res = await api<Me & { userId: string }>("/v1/me", { token: known.token });
  } catch (e) {
    if (e instanceof ApiFailure && e.status === 401) identity.set(null);
    throw e;
  }
  if (res.notModified) return;
  const { owns, votes, suggestions, alerts: list, addsLeftToday, gotIn } = res.data;
  meStore.set({ owns, votes, suggestions, alerts: list, addsLeftToday, gotIn: gotIn ?? 0 });

  // Phone notifications for alerts we haven't shown yet (never for the very first fetch).
  const seen = seenAlerts.get();
  const ids = list.map((a) => a.id);
  seenAlerts.set(ids);
  if (seen && alertHandler) {
    const fresh = alertsView().filter((a) => !a.read && !seen.includes(a.id));
    if (fresh.length) alertHandler(fresh);
  }
}

async function run() {
  const acked = new Set<string>();
  const notices: Notice[] = [];
  let failure: unknown = null;
  try {
    // Send what's waiting first, so the toilets we pull next already include it.
    try {
      await flush(acked, notices);
    } catch (e) {
      if (!transient(e)) throw e;
      failure = e;
    }
    await pull();
    await refreshMe();
  } finally {
    if (acked.size) outbox.set((list) => list.filter((a) => !acked.has(a.id)));
    if (notices.length) noticeStore.set((list) => [...notices, ...list].slice(0, 30));
  }
  if (failure) throw failure;
}
