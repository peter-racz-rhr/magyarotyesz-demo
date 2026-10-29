"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { btn } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";
import { call, useRun, when } from "./admin-api";

type Message = { id: string; at: string; message: string; contact: string; page: string; userId: string | null };

/** The app's feedback box: what people wrote, newest first. Delete one once it is dealt with. */
export function FeedbackPanel({ token, onAuthError, onOpenPerson }: { token: string; onAuthError: (message: string) => void; onOpenPerson: (id: string) => void }) {
  const { busy, error, run } = useRun(onAuthError);
  const [items, setItems] = useState<Message[]>([]);
  const [confirm, setConfirm] = useState<string | null>(null);

  const load = useCallback(
    () =>
      run(async () => {
        setItems((await call<{ items: Message[] }>(token, "/v1/admin/feedback?limit=100")).items);
      }),
    [token, run],
  );
  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const remove = async (id: string) => {
    if (confirm !== id) return setConfirm(id);
    setConfirm(null);
    if (await run(async () => void (await call(token, `/v1/admin/feedback/${id}`, "DELETE")))) void load();
  };

  return (
    <>
      <div className="mt-4 flex items-center gap-2">
        <p className="flex-1 text-sm text-haze">{items.length} {items.length === 1 ? "message" : "messages"}</p>
        <button type="button" onClick={() => load()} disabled={busy} aria-label="Refresh feedback" className={cn(btn.quiet, "size-10")}>
          <RefreshCw className={cn("size-4", busy && "animate-spin")} aria-hidden />
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-stale">
          {error}
        </p>
      )}
      <ul className="mt-2 flex flex-col gap-3">
        {items.length === 0 && !busy && <li className="py-10 text-center text-haze">Nothing here.</li>}
        {items.map((m) => (
          <li key={m.id} className="rounded-2xl border border-dusk-edge p-3.5">
            <p className="text-sm break-words whitespace-pre-wrap">{m.message}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-haze">
              <span>{when(m.at)}</span>
              {m.page && <span>from {m.page}</span>}
              {m.contact && <span className="font-semibold text-ink">{m.contact}</span>}
              {m.userId && (
                <button type="button" onClick={() => onOpenPerson(m.userId!)} className="font-mono text-good underline">
                  {m.userId.slice(0, 11)}
                </button>
              )}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => remove(m.id)}
              className={cn(btn.secondary, btn.sm, "mt-3 px-3 text-bad", confirm === m.id && "border-bad bg-bad/15")}
            >
              <Trash2 className="size-4" aria-hidden /> {confirm === m.id ? "Tap to delete" : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
