"use client";

import { ArrowLeft, Crown, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BACK, PageTransition } from "@/components/page-transition";
import { CARD } from "@/components/settings-ui";
import { REMOTE } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { lastPlace } from "@/lib/location";
import { useSettings } from "@/lib/settings";
import { fetchLeaderboard, setOnBoard, useOnBoard, type Board, type BoardList } from "@/lib/sync";
import { useHere } from "@/lib/use-here";
import { cn } from "@/lib/utils";

/** Gold, silver and bronze for the first three rows. */
const MEDALS = ["text-[#f9e2af]", "text-[#bac2de]", "text-[#fab387]"];

/**
 * The top lists: who helps the most people get in, near you and in the whole world.
 * Only people who turned on "Show my name" are listed; the switch is at the top.
 */
export default function LeadersPage() {
  const { t } = useT();
  const here = useHere();
  const { name } = useSettings();
  const onBoard = useOnBoard();
  const [tab, setTab] = useState<"near" | "world">("near");
  const [board, setBoard] = useState<Board | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "offline">("loading");
  const [retry, setRetry] = useState(0);

  const point = here.coords ?? (here.status === "checking" || here.status === "locating" ? null : lastPlace());
  const lat = point ? Math.round(point.latitude * 100) / 100 : null;
  const lon = point ? Math.round(point.longitude * 100) / 100 : null;

  useEffect(() => {
    if (!REMOTE) return;
    let live = true;
    fetchLeaderboard(lat !== null && lon !== null ? { latitude: lat, longitude: lon } : null).then((b) => {
      if (!live) return;
      setBoard(b);
      setState(b ? "ready" : "offline");
    });
    return () => {
      live = false;
    };
  }, [lat, lon, retry, onBoard]);

  const list = tab === "near" ? board?.near : board?.world;

  return (
    <PageTransition>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
        <div className="flex h-11 items-center">
          <Link href="/profile" transitionTypes={BACK} className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full pr-3 pl-1.5 text-[0.9375rem] text-brand active:opacity-60">
            <ArrowLeft className="size-[1.125rem]" strokeWidth={2} aria-hidden /> {t.urgent.back}
          </Link>
        </div>
        <h1 className="mt-2 text-[2.25rem] leading-[1.05] font-bold tracking-tight break-words">{t.board.title}</h1>

        {!REMOTE ? (
          <p className="mt-8 text-[1.0625rem] leading-snug text-haze">{t.board.demo}</p>
        ) : (
          <>
            {/* Opt in: off by default, since the profile promises the name stays private */}
            <div className={cn(CARD, "mt-6 px-4 py-3.5")}>
              {name.trim() ? (
                <label className="flex cursor-pointer items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[1rem] font-semibold break-words">{t.board.showMe}</span>
                    <span className="mt-0.5 block text-[0.8125rem] leading-snug text-haze">{t.board.showMeHint}</span>
                  </span>
                  <input type="checkbox" role="switch" checked={onBoard} onChange={(e) => setOnBoard(e.target.checked)} className="peer sr-only" />
                  <span aria-hidden className="relative h-7 w-12 shrink-0 rounded-full bg-fg/20 transition-colors peer-checked:bg-good peer-focus-visible:ring-2 peer-focus-visible:ring-brand after:absolute after:top-0.5 after:left-0.5 after:size-6 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
                </label>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="min-w-0 flex-1 text-[0.9375rem] leading-snug">{t.board.needName}</p>
                  <Link href="/profile" className="inline-flex h-9 items-center rounded-full bg-fg/[0.08] px-4 text-[0.875rem] font-semibold active:bg-fg/[0.14]">
                    {t.board.addName}
                  </Link>
                </div>
              )}
            </div>

            <div role="tablist" className="mt-5 grid grid-cols-2 gap-1 rounded-full bg-fg/[0.07] p-1">
              {(["near", "world"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn("h-10 min-w-0 truncate rounded-full px-3 text-[0.9375rem] font-semibold transition-colors", tab === key ? "bg-ink text-night" : "text-haze")}
                >
                  {t.board[key]}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[0.8125rem] leading-snug text-haze">{tab === "near" ? t.board.nearHint(board?.radiusKm ?? 15) : t.board.worldHint}</p>

            {state === "loading" ? (
              <div className="mt-6 space-y-2" aria-hidden>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={cn(CARD, "h-16 animate-pulse")} />
                ))}
              </div>
            ) : state === "offline" ? (
              <div className="mt-8">
                <p className="text-[1.0625rem] leading-snug text-haze">{t.board.offline}</p>
                <button type="button" onClick={() => setRetry((n) => n + 1)} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full border border-dusk-edge px-5 text-[0.9375rem] font-semibold active:bg-fg/10">
                  <RefreshCw className="size-4" aria-hidden /> {t.board.retry}
                </button>
              </div>
            ) : tab === "near" && !board?.near ? (
              <div className="mt-8">
                <p className="text-[1.0625rem] leading-snug text-haze">{t.board.noPlace}</p>
                <button type="button" onClick={here.request} className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[0.9375rem] font-semibold text-night">
                  <MapPin className="size-4" aria-hidden /> {t.board.allow}
                </button>
              </div>
            ) : (
              <Rows list={list!} near={tab === "near"} />
            )}
          </>
        )}
      </main>
    </PageTransition>
  );
}

function Rows({ list, near }: { list: BoardList; near: boolean }) {
  const { t } = useT();
  if (!list.top.length && !list.you) return <p className="mt-8 text-[1.0625rem] leading-snug text-haze">{t.board.empty}</p>;
  const outside = list.you && list.you.rank > list.top.length ? list.you : null;
  return (
    <ol className="mt-5 space-y-2">
      {list.top.map((row, i) => (
        <Row key={`${i}-${row.name}`} rank={i + 1} name={row.name} score={t.board.score(row.score, near)} places={t.board.places(row.places)} you={row.you} />
      ))}
      {outside && (
        <>
          <li aria-hidden className="py-1 text-center text-haze">
            ⋯
          </li>
          <Row rank={outside.rank} name={outside.name} score={t.board.score(outside.score, near)} places={t.board.places(outside.places)} you />
        </>
      )}
    </ol>
  );
}

function Row({ rank, name, score, places, you }: { rank: number; name: string; score: string; places: string; you: boolean }) {
  const { t } = useT();
  return (
    <li className={cn(CARD, "flex items-center gap-3 px-4 py-3", you && "ring-2 ring-brand")}>
      <span className={cn("grid w-8 shrink-0 place-items-center text-[1.125rem] font-bold tabular-nums", MEDALS[rank - 1] ?? "text-haze")}>
        {rank === 1 ? <Crown className="size-6" aria-label="1" /> : rank}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1rem] font-semibold break-words">
          {name}
          {you && <span className="ml-2 rounded-full bg-brand/20 px-2 py-0.5 align-middle text-[0.6875rem] font-bold text-brand uppercase">{t.board.you}</span>}
        </span>
        <span className="block text-[0.8125rem] text-haze">{places}</span>
      </span>
      <span className="shrink-0 text-right text-[0.9375rem] font-bold tabular-nums">{score}</span>
    </li>
  );
}
