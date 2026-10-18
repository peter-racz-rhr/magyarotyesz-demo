"use client";

import { Ban, Eye, EyeOff, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { btn } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";
import { call, useRun, when, who, type Item } from "./admin-api";

/*
  The places and what you can do to them: hide, restore, delete, and ban the
  owner. Used by the list of places and by one person's page. `onOpenOwner` is
  left out on a person's own page, where the owner is already the one shown.
*/

export function PlaceList({
  token,
  items,
  busy: outerBusy = false,
  empty = "Nothing here.",
  onChanged,
  onAuthError,
  onOpenOwner,
}: {
  token: string;
  items: Item[];
  busy?: boolean;
  empty?: string;
  onChanged: () => void;
  onAuthError: (message: string) => void;
  onOpenOwner?: (id: string) => void;
}) {
  const { busy, error, run } = useRun(onAuthError);
  // The one destructive action waiting for a second tap.
  const [confirm, setConfirm] = useState<string | null>(null);
  // Shown to the owner in their alerts when a place is hidden or deleted (the DSA wants a reason).
  const [reason, setReason] = useState("");
  const locked = busy || outerBusy;

  const act = async (key: string, path: string, method: string, body?: unknown) => {
    // Destructive buttons ask twice: the first tap arms, the second does it.
    if ((key.startsWith("del") || key.startsWith("banall")) && confirm !== key) return setConfirm(key);
    setConfirm(null);
    if (await run(() => call(token, path, method, body))) onChanged();
  };

  return (
    <>
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
        {items.length === 0 && !locked && <li className="py-10 text-center text-haze">{empty}</li>}
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
              {Object.entries(t.reportCounts).map(([why, n]) => (
                <span key={why} className="rounded-full border border-dusk-edge px-2 py-0.5 text-haze">
                  {why} × {n}
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
              {onOpenOwner && (
                <span className="text-haze">
                  owner{" "}
                  {t.ownerId ? (
                    <button type="button" onClick={() => onOpenOwner(t.ownerId!)} className="text-good underline">
                      {who(t.ownerName, t.ownerId)}
                    </button>
                  ) : (
                    "?"
                  )}
                  {t.ownerBanned && " (banned)"}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {t.hidden ? (
                <button type="button" disabled={locked} onClick={() => act("r" + t.id, `/v1/admin/toilets/${t.id}/restore`, "POST")} className={cn(btn.secondary, btn.sm, "px-3")}>
                  <Eye className="size-4" aria-hidden /> Restore
                </button>
              ) : (
                <button type="button" disabled={locked} onClick={() => act("h" + t.id, `/v1/admin/toilets/${t.id}/hide`, "POST", { reason: reason.trim() })} className={cn(btn.secondary, btn.sm, "px-3")}>
                  <EyeOff className="size-4" aria-hidden /> Hide
                </button>
              )}
              <button
                type="button"
                disabled={locked}
                onClick={() => act("del" + t.id, `/v1/admin/toilets/${t.id}${reason.trim() ? `?reason=${encodeURIComponent(reason.trim())}` : ""}`, "DELETE")}
                className={cn(btn.secondary, btn.sm, "px-3 text-bad", confirm === "del" + t.id && "border-bad bg-bad/15")}
              >
                <Trash2 className="size-4" aria-hidden /> {confirm === "del" + t.id ? "Tap to delete" : "Delete"}
              </button>
              {onOpenOwner &&
                t.ownerId &&
                (t.ownerBanned ? (
                  <button type="button" disabled={locked} onClick={() => act("unban" + t.id, `/v1/admin/users/${t.ownerId}/unban`, "POST")} className={cn(btn.secondary, btn.sm, "px-3")}>
                    <Undo2 className="size-4" aria-hidden /> Unban owner
                  </button>
                ) : (
                  <>
                    <button type="button" disabled={locked} onClick={() => act("ban" + t.id, `/v1/admin/users/${t.ownerId}/ban`, "POST", { deleteToilets: false })} className={cn(btn.secondary, btn.sm, "px-3")}>
                      <Ban className="size-4" aria-hidden /> Ban owner
                    </button>
                    <button
                      type="button"
                      disabled={locked}
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
    </>
  );
}
