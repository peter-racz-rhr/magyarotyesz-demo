"use client";

import { Ban, ChevronLeft, RefreshCw, Send, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { btn } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";
import { call, useRun, when, type Person, type PersonDetail } from "./admin-api";
import { PlaceList } from "./place-list";

/*
  People. A person is only an id and the name they picked, so this page shows
  what they added and lets you send them a short text. The text lands in their
  alerts the next time their app syncs; there is no reply.
*/

const MAX = 500;
const QUICK = [
  "Thanks for adding this place!",
  "Your code looks out of date. Could you check it next time you pass by?",
  "Please don't put personal or private codes in the app.",
];

export function PeoplePanel({
  token,
  personId,
  onOpen,
  onAuthError,
}: {
  token: string;
  personId: string | null;
  onOpen: (id: string | null) => void;
  onAuthError: (message: string) => void;
}) {
  return personId ? (
    <PersonPage token={token} id={personId} onBack={() => onOpen(null)} onAuthError={onAuthError} />
  ) : (
    <PeopleList token={token} onOpen={onOpen} onAuthError={onAuthError} />
  );
}

function PeopleList({ token, onOpen, onAuthError }: { token: string; onOpen: (id: string) => void; onAuthError: (message: string) => void }) {
  const { busy, error, run } = useRun(onAuthError);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(
    (q: string) =>
      run(async () => {
        const data = await call<{ items: Person[]; total: number }>(token, `/v1/admin/users?limit=100&q=${encodeURIComponent(q.trim())}`);
        setPeople(data.items);
        setTotal(data.total);
      }),
    [token, run],
  );

  // Typing waits a moment so every key press is not a request.
  useEffect(() => {
    const timer = window.setTimeout(() => void load(query), query ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [query, load]);

  return (
    <>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="search"
          value={query}
          maxLength={40}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or id"
          aria-label="Search people"
          className="h-10 min-w-0 flex-1 rounded-full border border-dusk-edge bg-transparent px-4 text-ink outline-none placeholder:text-haze/60 focus:border-good"
        />
        <button type="button" onClick={() => load(query)} disabled={busy} aria-label="Refresh people" className={cn(btn.quiet, "size-10")}>
          <RefreshCw className={cn("size-4", busy && "animate-spin")} aria-hidden />
        </button>
      </div>
      {total > people.length && <p className="mt-2 text-sm text-haze">Showing the newest {people.length} of {total}. Search to narrow it down.</p>}
      {error && (
        <p role="alert" className="mt-3 text-sm text-stale">
          {error}
        </p>
      )}
      <ul className="mt-4 flex flex-col gap-2">
        {people.length === 0 && !busy && <li className="py-10 text-center text-haze">Nobody here.</li>}
        {people.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => onOpen(p.id)} className="flex w-full items-center gap-3 rounded-2xl border border-dusk-edge p-3.5 text-left hover:border-haze/60">
              <span className="min-w-0 flex-1">
                <span className={cn("block font-semibold break-words", !p.displayName && "text-haze")}>{p.displayName || "(no name)"}</span>
                <span className="block text-sm text-haze">
                  <span className="font-mono">{p.id.slice(0, 11)}</span> · joined {when(p.createdAt)}
                </span>
              </span>
              {p.banned && <span className="shrink-0 rounded-full bg-bad/20 px-2 py-0.5 text-xs text-bad">banned</span>}
              <span className="shrink-0 text-sm text-haze">
                {p.places} {p.places === 1 ? "place" : "places"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function PersonPage({ token, id, onBack, onAuthError }: { token: string; id: string; onBack: () => void; onAuthError: (message: string) => void }) {
  const { busy, error, run } = useRun(onAuthError);
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const load = useCallback(
    () =>
      run(async () => {
        setPerson(await call<PersonDetail>(token, `/v1/admin/users/${id}`));
      }),
    [token, id, run],
  );

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const words = text.trim();
    if (!words) return;
    const ok = await run(async () => {
      await call(token, `/v1/admin/users/${id}/message`, "POST", { text: words });
    });
    if (ok) {
      setText("");
      setSent(true);
      void load();
    }
  };

  const ban = async (key: string, deleteToilets: boolean) => {
    if (confirm !== key) return setConfirm(key);
    setConfirm(null);
    if (await run(async () => void (await call(token, `/v1/admin/users/${id}/ban`, "POST", { deleteToilets })))) void load();
  };
  const unban = async () => {
    if (await run(async () => void (await call(token, `/v1/admin/users/${id}/unban`, "POST")))) void load();
  };

  return (
    <>
      <button type="button" onClick={onBack} className={cn(btn.quiet, btn.sm, "mt-3 -ml-3 px-3")}>
        <ChevronLeft className="size-4" aria-hidden /> People
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-stale">
          {error}
        </p>
      )}
      {!person ? (
        !error && <p className="py-10 text-center text-haze">Loading…</p>
      ) : (
        <>
          <section className="mt-2 rounded-2xl border border-dusk-edge p-4">
            <div className="flex items-start gap-2">
              <h2 className={cn("min-w-0 flex-1 text-xl font-bold break-words", !person.displayName && "text-haze")}>{person.displayName || "(no name)"}</h2>
              {person.banned && <span className="shrink-0 rounded-full bg-bad/20 px-2 py-0.5 text-xs text-bad">banned</span>}
            </div>
            <p className="mt-1 font-mono text-xs break-all text-haze">{person.id}</p>
            {person.email ? (
              <a href={`mailto:${person.email}`} className="mt-1 block text-sm font-semibold break-all text-brand">
                {person.email}
              </a>
            ) : (
              <p className="mt-1 text-sm text-haze">No email (a guest, or signed in before addresses were kept)</p>
            )}
            <p className="mt-2 text-sm text-haze">
              Joined {when(person.createdAt)} · {person.places} {person.places === 1 ? "place" : "places"} · {person.gotIn} got in with their codes
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {person.banned ? (
                <button type="button" disabled={busy} onClick={unban} className={cn(btn.secondary, btn.sm, "px-3")}>
                  <Undo2 className="size-4" aria-hidden /> Unban
                </button>
              ) : (
                <>
                  <button type="button" disabled={busy} onClick={() => ban("ban", false)} className={cn(btn.secondary, btn.sm, "px-3 text-bad", confirm === "ban" && "border-bad bg-bad/15")}>
                    <Ban className="size-4" aria-hidden /> {confirm === "ban" ? "Tap to ban" : "Ban"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => ban("banall", true)}
                    className={cn(btn.secondary, btn.sm, "px-3 text-bad", confirm === "banall" && "border-bad bg-bad/15")}
                  >
                    <Ban className="size-4" aria-hidden /> {confirm === "banall" ? "Tap to ban + delete all" : "Ban + delete all"}
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="mt-5" aria-labelledby="message-heading">
            <h3 id="message-heading" className="text-lg font-bold">
              Send a message
            </h3>
            <p className="mt-1 text-sm text-haze">They see it in their alerts the next time the app syncs. One way: they can&apos;t reply.</p>
            <form onSubmit={send} className="mt-3 flex flex-col gap-2">
              <textarea
                value={text}
                maxLength={MAX}
                rows={4}
                onChange={(e) => {
                  setText(e.target.value);
                  setSent(false);
                }}
                aria-label="Message"
                placeholder="Write a short, friendly text"
                className="w-full rounded-xl border border-dusk-edge bg-transparent px-3 py-2 text-ink outline-none placeholder:text-haze/60 focus:border-good"
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK.map((q) => (
                  <button key={q} type="button" onClick={() => setText(q)} className="h-8 rounded-full border border-dusk-edge px-3 text-xs text-haze">
                    {q.length > 34 ? q.slice(0, 33) + "…" : q}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={busy || !text.trim() || person.banned} className={cn(btn.primary, btn.md)}>
                  <Send className="size-4" aria-hidden /> Send
                </button>
                <span className="text-sm text-haze">
                  {text.length}/{MAX}
                </span>
                {sent && (
                  <span role="status" className="text-sm text-good">
                    Sent
                  </span>
                )}
              </div>
              {person.banned && <p className="text-sm text-haze">Unban them first if you want them to get a message.</p>}
            </form>
            {person.messages.length > 0 && (
              <ul className="mt-4 flex flex-col gap-2">
                {person.messages.map((m) => (
                  <li key={m.id} className="rounded-xl border border-dusk-edge px-3 py-2">
                    <p className="text-sm break-words whitespace-pre-wrap">{m.text}</p>
                    <p className="mt-1 text-xs text-haze">
                      {when(m.at)} · {m.read ? "read" : "not read yet"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6" aria-labelledby="places-heading">
            <h3 id="places-heading" className="text-lg font-bold">
              Places they added ({person.places})
            </h3>
            <PlaceList token={token} items={person.toilets} busy={busy} empty="They haven't added any places." onChanged={() => void load()} onAuthError={onAuthError} />
          </section>
        </>
      )}
    </>
  );
}
