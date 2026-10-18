"use client";

import { LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { btn } from "@/components/ui/buttons";
import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";
import { call, read, remember, useRun, type Counts, type Item } from "./admin-api";
import { PeoplePanel } from "./people-panel";
import { PlaceList } from "./place-list";

/*
  Moderation page: look at what was added or reported, then hide, delete or
  ban, see who added what, and send a person a short text. English only, not
  linked from the app. The token lives in this tab's sessionStorage and goes
  only to the magyarotyesz server (X-Admin-Token); the server must have
  ADMIN_FROM_BROWSER=true for the browser to be allowed.
*/

type Scope = "recent" | "reported" | "hidden" | "flagged";
const SCOPES: { key: Scope; label: string }[] = [
  { key: "recent", label: "Recent" },
  { key: "reported", label: "Reported" },
  { key: "flagged", label: "Flagged" },
  { key: "hidden", label: "Hidden" },
];

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [booted, setBooted] = useState(false);
  const [tab, setTab] = useState<"places" | "people">("places");
  const [personId, setPersonId] = useState<string | null>(null);
  const [scope, setScope] = useState<Scope>("recent");
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [signInError, setSignInError] = useState("");

  const signOut = useCallback((message = "") => {
    remember(null);
    setToken(null);
    setItems([]);
    setCounts(null);
    setPersonId(null);
    setSignInError(message);
  }, []);

  const { busy, error, run } = useRun(signOut);

  const load = useCallback(
    (tok: string, which: Scope) =>
      run(async () => {
        const data = await call<{ items: Item[]; counts: Counts }>(tok, `/v1/admin/toilets?scope=${which}&limit=100`);
        setItems(data.items);
        setCounts(data.counts);
      }),
    [run],
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
    if (token && tab === "places") queueMicrotask(() => void load(token, scope));
  }, [token, tab, scope, load]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const tok = input.trim();
    if (!tok) return;
    try {
      await call(tok, "/v1/admin/check");
      remember(tok);
      setInput("");
      setSignInError("");
      setToken(tok);
    } catch (e) {
      setSignInError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const openPerson = (id: string | null) => {
    setPersonId(id);
    setTab("people");
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
          <button type="submit" disabled={!input.trim()} className={cn(btn.primary, btn.md)}>
            Sign in
          </button>
          {!API_BASE && <p className="text-sm text-stale">This build has no server (NEXT_PUBLIC_API_URL is empty).</p>}
          {signInError && (
            <p role="alert" className="text-sm text-stale">
              {signInError}
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
        {tab === "places" && (
          <button type="button" onClick={() => load(token, scope)} disabled={busy} aria-label="Refresh" className={cn(btn.quiet, "size-10")}>
            <RefreshCw className={cn("size-4", busy && "animate-spin")} aria-hidden />
          </button>
        )}
        <button type="button" onClick={() => signOut()} aria-label="Sign out" className={cn(btn.quiet, "size-10")}>
          <LogOut className="size-4" aria-hidden />
        </button>
      </header>
      {counts && (
        <p className="mt-1 text-sm text-haze">
          {counts.visible} live · {counts.hidden} hidden · {counts.reported} reported · {counts.users} users · {counts.banned} banned
        </p>
      )}

      <div role="tablist" aria-label="Section" className="mt-4 flex gap-1.5">
        {(["places", "people"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            type="button"
            onClick={() => {
              setTab(key);
              if (key === "people") setPersonId(null);
            }}
            className={cn("h-9 rounded-full border px-5 text-sm font-semibold", tab === key ? "border-ink bg-ink text-night" : "border-dusk-edge text-haze")}
          >
            {key === "places" ? "Places" : "People"}
          </button>
        ))}
      </div>

      {tab === "people" ? (
        <PeoplePanel token={token} personId={personId} onOpen={setPersonId} onAuthError={signOut} />
      ) : (
        <>
          <div role="tablist" aria-label="Which places" className="mt-3 flex flex-wrap gap-1.5">
            {SCOPES.map((s) => (
              <button
                key={s.key}
                role="tab"
                aria-selected={scope === s.key}
                type="button"
                onClick={() => setScope(s.key)}
                className={cn("h-9 shrink-0 rounded-full border px-4 text-sm", scope === s.key ? "border-good bg-good/15 text-ink" : "border-dusk-edge text-haze")}
              >
                {s.label}
                {counts && s.key !== "recent" && ` ${counts[s.key]}`}
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-stale">
              {error}
            </p>
          )}
          <PlaceList token={token} items={items} busy={busy} onChanged={() => void load(token, scope)} onAuthError={signOut} onOpenOwner={openPerson} />
        </>
      )}
    </main>
  );
}

