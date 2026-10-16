"use client";

import { Ban, EyeOff, Eye, LogOut, RefreshCw, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { btn } from "@/components/ui/buttons";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";

/*
  Moderation page: look at what was added or reported, then hide, delete or
  ban. English only, not linked from the app. The token lives in this tab's
  sessionStorage and goes only to the magyarotyesz server (X-Admin-Token); the
  server must have ADMIN_FROM_BROWSER=true for the browser to be allowed.
*/

type Scope = "recent" | "reported" | "hidden" | "flagged";
type Item = {
  id: string;
  name: string;
  code: string;
  kind: string;
  access: string;
  price: number | null;
  note: string;
  latitude: number;
  longitude: number;
  addedAt: string;
  hidden: boolean;
  ownerId: string | null;
  ownerBanned: boolean;
  reportCounts: Record<string, number>;
  reportTotal: number;
  flagged: string | null;
};
type Counts = { visible: number; hidden: number; reported: number; flagged: number; users: number; banned: number };

const KEY = "magyarotyesz:admin-token";
const SCOPES: { key: Scope; label: string }[] = [
  { key: "recent", label: "Recent" },
  { key: "reported", label: "Reported" },
  { key: "flagged", label: "Flagged" },
  { key: "hidden", label: "Hidden" },
];

class AdminError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(token: string, path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_BASE + path, {
      method,
      cache: "no-store",
      headers: { "X-Admin-Token": token, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AdminError(0, "Can't reach the server. Offline, or the server doesn't allow the admin page (ADMIN_FROM_BROWSER=true).");
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
  if (!response.ok) {
    throw new AdminError(response.status, response.status === 401 ? "Wrong token." : data.message ?? data.error ?? `Error ${response.status}`);
  }
  return data as T;
}

const read = () => {
  try {
    return window.sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};
const remember = (token: string | null) => {
  try {
    if (token) window.sessionStorage.setItem(KEY, token);
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // Private mode: you sign in again after a reload.
  }
};

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [booted, setBooted] = useState(false);
  const [scope, setScope] = useState<Scope>("recent");
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // The one destructive action waiting for a second tap.
  const [confirm, setConfirm] = useState<string | null>(null);
  // Shown to the owner in their alerts when a place is hidden or deleted (the DSA wants a reason).
  const [reason, setReason] = useState("");

  const signOut = useCallback((message = "") => {
    remember(null);
    setToken(null);
    setItems([]);
    setCounts(null);
    setError(message);
  }, []);

  const load = useCallback(
    async (tok: string, which: Scope) => {
      setBusy(true);
      try {
        const data = await call<{ items: Item[]; counts: Counts }>(tok, `/v1/admin/toilets?scope=${which}&limit=100`);
        setItems(data.items);
        setCounts(data.counts);
        setError("");
      } catch (e) {
        if (e instanceof AdminError && (e.status === 401 || e.status === 429)) signOut(e.message);
        else setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setBusy(false);
      }
    },
    [signOut],
  );

  useEffect(() => {
    // sessionStorage only exists in the browser, so it is read after the first paint.
    queueMicrotask(() => {
      const saved = read();
      if (saved) setToken(saved);
      setBooted(true);
    });
  }, []);

  useEffect(() => {
    if (token) queueMicrotask(() => void load(token, scope));
  }, [token, scope, load]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const tok = input.trim();
    if (!tok) return;
    setBusy(true);
    try {
      await call(tok, "/v1/admin/check");
      remember(tok);
      setInput("");
      setError("");
      setToken(tok);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const act = async (key: string, path: string, method: string, body?: unknown) => {
    if (!token) return;
    // Destructive buttons ask twice: the first tap arms, the second does it.
    if (key.startsWith("del") || key.startsWith("banall")) {
      if (confirm !== key) return setConfirm(key);
    }
    setConfirm(null);
    setBusy(true);
    try {
      await call(token, path, method, body);
      await load(token, scope);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  };

  if (!booted) return null;

  if (!token) {
    return (
      <main className="mx-auto max-w-sm px-5 pt-24">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-1 text-sm text-haze">magyarotyesz moderation. Enter the admin token from the server.</p>
        <form onSubmit={signIn} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-label="Admin token"
            placeholder="Admin token"
            className="h-11 w-full rounded-full border border-dusk-edge bg-night px-4 outline-none placeholder:text-haze/60 focus:border-good"
          />
          <button type="submit" disabled={busy || !input.trim()} className={cn(btn.primary, btn.md)}>
            {busy ? "Checking…" : "Sign in"}
          </button>
          {!API_BASE && <p className="text-sm text-stale">This build has no server (NEXT_PUBLIC_API_URL is empty).</p>}
          {error && (
            <p role="alert" className="text-sm text-stale">
              {error}
            </p>
          )}
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pt-6 pb-20">
      <header className="flex items-center gap-2">
        <h1 className="flex-1 text-2xl font-bold">Admin</h1>
        <button type="button" onClick={() => load(token, scope)} disabled={busy} aria-label="Refresh" className={cn(btn.quiet, "size-10")}>
          <RefreshCw className={cn("size-4", busy && "animate-spin")} aria-hidden />
        </button>
        <button type="button" onClick={() => signOut()} aria-label="Sign out" className={cn(btn.quiet, "size-10")}>
          <LogOut className="size-4" aria-hidden />
        </button>
      </header>
      {counts && (
        <p className="mt-1 text-sm text-haze">
          {counts.visible} live · {counts.hidden} hidden · {counts.reported} reported · {counts.users} users · {counts.banned} banned
        </p>
      )}

      <div role="tablist" className="mt-4 flex flex-wrap gap-1.5">
        {SCOPES.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={scope === s.key}
            type="button"
            onClick={() => setScope(s.key)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-4 text-sm",
              scope === s.key ? "border-good bg-good/15 text-ink" : "border-dusk-edge text-haze",
            )}
          >
            {s.label}
            {counts && s.key !== "recent" && ` ${counts[s.key]}`}
          </button>
        ))}
      </div>

      <label className="mt-3 block text-sm text-haze">
        Reason for hide / delete (the owner sees it)
        <input
          value={reason}
          maxLength={200}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. opens a building gate, not a toilet"
          className="mt-1 h-10 w-full rounded-lg border border-dusk-edge bg-transparent px-3 text-ink"
        />
      </label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {["Not a toilet", "Private or unsafe code", "Offensive content", "Venue asked for removal"].map((r) => (
          <button key={r} type="button" onClick={() => setReason(r)} className="h-8 rounded-full border border-dusk-edge px-3 text-xs text-haze">
            {r}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-stale">
          {error}
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {items.length === 0 && !busy && <li className="py-10 text-center text-haze">Nothing here.</li>}
        {items.map((t) => (
          <li key={t.id} className="rounded-2xl border border-dusk-edge p-3.5">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold break-words">{t.name}</p>
                <p className="text-sm text-haze">
                  {t.kind} · {t.access}
                  {t.price ? ` ${t.price} Ft` : ""} · {when(t.addedAt)}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-night px-2 py-1 font-mono text-sm tracking-widest">{t.code}</span>
            </div>
            {t.note && <p className="mt-2 text-sm break-words text-ink/85">{t.note}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              {t.hidden && <span className="rounded-full bg-stale/20 px-2 py-0.5 text-stale">hidden</span>}
              {t.flagged && <span className="rounded-full bg-bad/20 px-2 py-0.5 text-bad">filter: {t.flagged}</span>}
              {Object.entries(t.reportCounts).map(([reason, n]) => (
                <span key={reason} className="rounded-full border border-dusk-edge px-2 py-0.5 text-haze">
                  {reason} × {n}
                </span>
              ))}
              <a
                href={`https://www.google.com/maps?q=${t.latitude},${t.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-dusk-edge px-2 py-0.5 text-good underline"
              >
                map
              </a>
              <span className="text-haze">
                owner {t.ownerId ? t.ownerId.slice(0, 9) : "?"}
                {t.ownerBanned && " (banned)"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {t.hidden ? (
                <button type="button" disabled={busy} onClick={() => act("r" + t.id, `/v1/admin/toilets/${t.id}/restore`, "POST")} className={cn(btn.secondary, btn.sm, "px-3")}>
                  <Eye className="size-4" aria-hidden /> Restore
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => act("h" + t.id, `/v1/admin/toilets/${t.id}/hide`, "POST", { reason: reason.trim() })} className={cn(btn.secondary, btn.sm, "px-3")}>
                  <EyeOff className="size-4" aria-hidden /> Hide
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => act("del" + t.id, `/v1/admin/toilets/${t.id}${reason.trim() ? `?reason=${encodeURIComponent(reason.trim())}` : ""}`, "DELETE")}
                className={cn(btn.secondary, btn.sm, "px-3 text-bad", confirm === "del" + t.id && "border-bad bg-bad/15")}
              >
                <Trash2 className="size-4" aria-hidden /> {confirm === "del" + t.id ? "Tap to delete" : "Delete"}
              </button>
              {t.ownerId &&
                (t.ownerBanned ? (
                  <button type="button" disabled={busy} onClick={() => act("unban" + t.id, `/v1/admin/users/${t.ownerId}/unban`, "POST")} className={cn(btn.secondary, btn.sm, "px-3")}>
                    <Undo2 className="size-4" aria-hidden /> Unban owner
                  </button>
                ) : (
                  <>
                    <button type="button" disabled={busy} onClick={() => act("ban" + t.id, `/v1/admin/users/${t.ownerId}/ban`, "POST", { deleteToilets: false })} className={cn(btn.secondary, btn.sm, "px-3")}>
                      <Ban className="size-4" aria-hidden /> Ban owner
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act("banall" + t.id, `/v1/admin/users/${t.ownerId}/ban`, "POST", { deleteToilets: true })}
                      className={cn(btn.secondary, btn.sm, "px-3 text-bad", confirm === "banall" + t.id && "border-bad bg-bad/15")}
                    >
                      <Ban className="size-4" aria-hidden /> {confirm === "banall" + t.id ? "Tap to ban + delete all" : "Ban + delete all"}
                    </button>
                  </>
                ))}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
