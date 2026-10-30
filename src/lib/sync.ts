"use client";

import { useSyncExternalStore } from "react";
import { api, ApiFailure, Offline, REMOTE } from "./api";
import { createLocalStore } from "./local-store";
import { buzz } from "./haptics";
import { acceptedTerms } from "./onboarding";
import { getSettings, updateSettings } from "./settings";
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
  currency?: string;
  hours: Toilet["hours"] | null;
  wheelchair: boolean;
  babyChanging: boolean;
  /** Left out by older servers. */
  genderNeutral?: boolean;
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
  alerts: { id: string; toiletId: string; name: string; kind: "report" | "suggestion" | "removed" | "message" | "answer" | "blocked"; code: string | null; at: string; read: boolean; reason?: string; text?: string }[];
  addsLeftToday: number;
  /** Running total of people who got in with this phone's codes; kept by the server across code changes. */
  gotIn?: number;
  displayName?: string;
  /** Whether the name is shown on the public top lists. */
  onBoard?: boolean;
  /** Whether a Google account and/or an email address is linked to this profile. */
  account?: { google: boolean; email: boolean };
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

const cache = createLocalStore<Cache>("magyarotyesz:server", { seq: null, toilets: [] }, { lazy: true });
const identity = createLocalStore<{ userId: string; token: string } | null>("magyarotyesz:identity", null);
const meStore = createLocalStore<Me>("magyarotyesz:me", { owns: [], votes: {}, suggestions: {}, alerts: [], addsLeftToday: 10, gotIn: 0 });
export const useUserId = () => identity.useValue()?.userId ?? null;
export const useAccount = () => meStore.useValue().account ?? { google: false, email: false };
export const useGotInTotal = () => meStore.useValue().gotIn ?? 0;
export const useOnBoard = () => meStore.useValue().onBoard ?? false;
/** Whether this profile has a Google or email account (as last told by the server). */
export const hasAccount = () => { const a = meStore.get().account; return !!(a?.google || a?.email); };
export const subscribeMe = meStore.subscribe;
const outbox = createLocalStore<OutAction[]>("magyarotyesz:outbox", []);
/** The name we last tried to send, so a name the server turned down is not sent over and over. */
const profileTried = createLocalStore<string>("magyarotyesz:profile-tried", "");
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
    currency: s.currency,
    hours: s.hours ?? undefined,
    wheelchair: s.wheelchair || undefined,
    babyChanging: s.babyChanging || undefined,
    genderNeutral: s.genderNeutral || undefined,
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
        currency: p.currency,
        hours: p.hours ?? undefined,
        wheelchair: p.wheelchair || undefined,
        babyChanging: p.babyChanging || undefined,
        genderNeutral: p.genderNeutral || undefined,
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
    .map((a) => ({ id: a.id, toiletId: a.toiletId, name: a.name, kind: a.kind, code: a.code ?? undefined, at: a.at, read: a.read, reason: a.reason, text: a.text }));
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
      await reportTerms();
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

/* ------------------------- backup and export ------------------------- */

/** The secret token of this phone's profile, or null before it has one (used to sign a message to the server). */
export const getIdentityToken = () => identity.get()?.token ?? null;

/** Whether this phone has a profile on the server yet (it gets one with its first action). */
export const hasIdentity = () => identity.get() !== null;

/**
 * The profile as one piece of text: id and secret token. Whoever holds it can act as this profile,
 * so it is only shown when asked for.
 */
export const backupCode = () => {
  const me = identity.get();
  return me ? `mo1.${me.userId}.${me.token}` : null;
};

const CODE = /^mo1\.(u_[A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{20,})$/;

/** Takes a code (or a link that ends in one) and makes this phone that profile, if the server knows it. */
export async function restoreBackup(text: string): Promise<"ok" | "invalid" | "unknown" | "offline"> {
  const raw = decodeURIComponent(text.trim().split("restore=").pop() ?? "").trim();
  const match = raw.match(CODE);
  if (!match) return "invalid";
  const [, userId, token] = match;
  try {
    await api<Me>("/v1/me", { token });
  } catch (e) {
    if (e instanceof ApiFailure && e.status === 401) return "unknown";
    return "offline";
  }
  // Unsent changes belonged to the old profile and would be refused for the new one.
  outbox.set([]);
  noticeStore.set([]);
  meStore.set({ owns: [], votes: {}, suggestions: {}, alerts: [], addsLeftToday: 10, gotIn: 0 });
  identity.set({ userId: userId!, token: token! });
  // The name and photo shown now are the old profile's: the server's name comes back with the next sync.
  updateSettings({ name: "", photo: "" });
  void syncNow();
  return "ok";
}

/** A new backup code: the old one (and any other phone using it) stops working at once. */
export async function rotateBackup(): Promise<"ok" | "unknown" | "offline"> {
  const me = identity.get();
  if (!me) return "unknown";
  try {
    const res = await api<{ userId: string; token: string }>("/v1/me/rotate-token", { method: "POST", token: me.token });
    if (res.notModified) return "offline";
    identity.set({ userId: res.data.userId, token: res.data.token });
    return "ok";
  } catch (e) {
    if (e instanceof ApiFailure && e.status === 401) return "unknown";
    return "offline";
  }
}

/* ------------------------- accounts: Google and email ------------------------- */

/** signInToShare: guests can look and report, but adding places, codes and votes need an account. */
export type AuthOptions = { google: string | null; email: boolean; signInToShare?: boolean };
const authOptionsStore = createLocalStore<AuthOptions | null>("magyarotyesz:auth-options", null);
/** Which sign-in methods the server offers (null until it answered once). */
export const useAuthOptions = authOptionsStore.useValue;
export async function loadAuthOptions(): Promise<AuthOptions | null> {
  if (!REMOTE) return null;
  try {
    const res = await api<AuthOptions>("/v1/auth/config");
    if (!res.notModified) authOptionsStore.set(res.data);
    return authOptionsStore.get();
  } catch {
    return authOptionsStore.get();
  }
}

type SignInResult = { userId: string; token: string | null; created: boolean; linked: boolean };
export type SignInOutcome = "ok" | "bad_code" | "banned" | "conflict" | "offline" | "failed";

/** Takes the server's answer to a sign-in: a new token for another profile signs this browser into it; a link keeps ours. */
function takeSignIn(result: SignInResult, kind: "google" | "email") {
  if (result.token) identity.set({ userId: result.userId, token: result.token });
  // Shown as signed in right away; the next sync brings the rest of the profile.
  meStore.set((me) => ({ ...me, account: { ...(me.account ?? { google: false, email: false }), [kind]: true } }));
  scheduleSync(100);
}

/** Whether this phone may add places, codes and votes now: always without a server or when the server lets guests share. */
export function canShare() {
  if (!REMOTE || !authOptionsStore.get()?.signInToShare) return true;
  const account = meStore.get().account;
  return !!(account?.google || account?.email);
}
export function useCanShare() {
  const options = authOptionsStore.useValue();
  const account = meStore.useValue().account;
  return !REMOTE || !options?.signInToShare || !!(account?.google || account?.email);
}

/* The "sign in to share" sheet: anything a guest can't do opens it instead. */
const askListeners = new Set<() => void>();
let asking = false;
export const useSignInAsked = () => useSyncExternalStore((cb) => (askListeners.add(cb), () => askListeners.delete(cb)), () => asking, () => false);
export function setSignInAsked(open: boolean) {
  asking = open;
  askListeners.forEach((l) => l());
}
/** True when the action may go ahead; otherwise opens the sign-in sheet and returns false. */
export function requireAccount() {
  if (canShare()) return true;
  setSignInAsked(true);
  return false;
}
function outcomeOf(e: unknown): SignInOutcome {
  if (e instanceof Offline) return "offline";
  if (e instanceof ApiFailure) return e.code === "bad_code" ? "bad_code" : e.code === "banned" ? "banned" : e.code === "already_linked" ? "conflict" : "failed";
  return "failed";
}

/** With a Google token: an access token from our own button (or an ID token from Google's). Links to this profile if it has one and the Google account is new. */
export async function signInWithGoogle(token: { accessToken: string } | { idToken: string }): Promise<SignInOutcome> {
  try {
    const res = await api<SignInResult>("/v1/auth/google", { method: "POST", token: identity.get()?.token, body: token });
    if (res.notModified) return "offline";
    takeSignIn(res.data, "google");
    return "ok";
  } catch (e) {
    return outcomeOf(e);
  }
}

/** Step one of email sign-in: the server mails a six-digit code. */
export async function startEmailSignIn(email: string): Promise<"ok" | "offline" | "failed" | "limited"> {
  try {
    await api("/v1/auth/email/start", { method: "POST", body: { email } });
    return "ok";
  } catch (e) {
    if (e instanceof Offline) return "offline";
    return e instanceof ApiFailure && e.status === 429 ? "limited" : "failed";
  }
}

/** Step two: the code. */
export async function finishEmailSignIn(email: string, code: string): Promise<SignInOutcome> {
  try {
    const res = await api<SignInResult>("/v1/auth/email/verify", { method: "POST", token: identity.get()?.token, body: { email, code } });
    if (res.notModified) return "offline";
    takeSignIn(res.data, "email");
    return "ok";
  } catch (e) {
    return outcomeOf(e);
  }
}

/** Everything the server holds for this profile (for "Download my data"). Null when there is none yet or no answer. */
export async function fetchMyData(): Promise<unknown | null> {
  const me = identity.get();
  if (!me) return null;
  try {
    const res = await api<unknown>("/v1/me/export", { token: me.token });
    return res.notModified ? null : res.data;
  } catch {
    return null;
  }
}

/* ------------------------------ top lists ------------------------------ */

export type BoardRow = { name: string; score: number; places: number; you: boolean };
export type BoardList = { top: BoardRow[]; you: (BoardRow & { rank: number }) | null };
export type Board = { radiusKm: number; onBoard: boolean; named: boolean; world: BoardList; near: BoardList | null };

/** The world and near-you lists. Null when offline or there is no server. */
export async function fetchLeaderboard(near: { latitude: number; longitude: number } | null): Promise<Board | null> {
  if (!REMOTE) return null;
  const query = near ? `?lat=${near.latitude.toFixed(3)}&lon=${near.longitude.toFixed(3)}` : "";
  try {
    const res = await api<Board>("/v1/leaderboard" + query, { token: identity.get()?.token });
    return res.notModified ? null : res.data;
  } catch {
    return null;
  }
}

/** Show (or hide) this profile's name on the top lists. Needs a name; goes out with the next sync. */
export function setOnBoard(on: boolean) {
  const name = getSettings().name.trim();
  if (!name) return;
  meStore.set((me) => ({ ...me, onBoard: on }));
  enqueue("set_profile", { displayName: name, onBoard: on });
}

/** Tell the server which version of the terms this profile agreed to (once per version; kept as proof of acceptance). */
async function reportTerms() {
  const me = identity.get();
  const accepted = acceptedTerms();
  if (!me || !accepted) return;
  try {
    if (window.localStorage.getItem("magyarotyesz:terms-sent") === accepted.v) return;
    await api("/v1/me/terms", { method: "POST", token: me.token, body: { version: accepted.v } });
    window.localStorage.setItem("magyarotyesz:terms-sent", accepted.v);
  } catch {
    // Offline or an unknown profile: tried again with the next sync.
  }
}

/** A short code (the start of the token's hash) shown in Settings: someone who writes by email can prove the profile is theirs. */
export async function verifyCode(): Promise<string | null> {
  const me = identity.get();
  if (!me || !window.crypto?.subtle) return null;
  const hash = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(me.token));
  return [...new Uint8Array(hash).slice(0, 4)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** "Delete my data": the server forgets this profile and everything it added, then this phone is emptied. */
export async function deleteMyData(): Promise<"ok" | "offline" | "failed"> {
  const me = identity.get();
  if (me) {
    try {
      await api("/v1/me", { method: "DELETE", token: me.token });
    } catch (e) {
      // 401: the server no longer knows this profile, so there is nothing left to delete there.
      if (!(e instanceof ApiFailure && e.status === 401)) return e instanceof Offline ? "offline" : "failed";
    }
  }
  buzz("done");
  try {
    for (const key of Object.keys(window.localStorage)) if (key.startsWith("magyarotyesz:")) window.localStorage.removeItem(key);
  } catch {
    // Storage blocked: nothing was saved there anyway.
  }
  window.location.assign("/");
  return "ok";
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
    const batch = outbox.get().filter((a) => !acked.has(a.id)).slice(0, 20);
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
      // A server that is a version behind doesn't know "set_profile" yet: the name stays on this phone and goes
      // out by itself once the server is updated (see `me`), so there is nothing to scare anyone with.
      const oldServer = a.type === "set_profile" && r?.error === "validation" && /unknown action/i.test(r.message ?? "");
      if (r?.status === "rejected" && !oldServer) {
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
  const { owns, votes, suggestions, alerts: list, addsLeftToday, gotIn, displayName, onBoard, account } = res.data;
  // A name chosen on another visit (same id) shows up here too; one typed on this phone wins.
  if (displayName && !getSettings().name) updateSettings({ name: displayName });
  // A choice still waiting in the outbox wins over what the server last knew.
  const pendingBoard = outbox.get().findLast((a) => a.type === "set_profile" && typeof a.payload.onBoard === "boolean")?.payload.onBoard as boolean | undefined;
  meStore.set({ owns, votes, suggestions, alerts: list, addsLeftToday, gotIn: gotIn ?? 0, onBoard: pendingBoard ?? onBoard ?? false, account });
  // The server knows about names (it sent the field) but not ours: send it once.
  const mine = getSettings().name;
  if (displayName !== undefined && mine && mine !== displayName && profileTried.get() !== mine && !outbox.get().some((a) => a.type === "set_profile")) {
    profileTried.set(mine);
    enqueue("set_profile", { displayName: mine });
  }

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
