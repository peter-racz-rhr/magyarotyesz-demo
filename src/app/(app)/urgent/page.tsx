"use client";

import { ArrowLeft, Eye, Navigation, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BACK, PageTransition } from "@/components/page-transition";
import { HoursLine } from "@/components/toilet-card";
import { useT } from "@/lib/i18n";
import { distance, formatDistance, formatPrice, directionsUrl, isOpen, trust, useToilets, walkIfNear } from "@/lib/toilets";
import { useHere } from "@/lib/use-here";
import { cn } from "@/lib/utils";

/** The same bar the map's "Nearest" uses: a code most people can get in with. */
const TRUSTED = 0.6;

/**
 * "I need a toilet now": one place, as big as the screen allows. The closest open one that usually
 * works, with the walk, the way there and the code under one tap each. Free places and ones with no
 * code come first (a few hundred metres count for them), since nobody wants to buy a coffee in a hurry.
 */
export default function UrgentPage() {
  const { t, lang } = useT();
  const here = useHere();
  const toilets = useToilets();
  const [skip, setSkip] = useState(0);
  const [shown, setShown] = useState(false);

  const from = here.coords;
  const ranked = from
    ? toilets
        .filter((x) => isOpen(x) !== false && trust(x) >= TRUSTED)
        .map((x) => ({ toilet: x, metres: distance(from, x), cost: distance(from, x) + (x.access === "customers" ? 400 : x.access === "paid" ? 150 : 0) }))
        .sort((a, b) => a.cost - b.cost)
    : [];
  const pick = ranked.length ? ranked[skip % ranked.length] : null;

  return (
    <PageTransition>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
        <div className="flex h-11 items-center">
          <Link href="/map" transitionTypes={BACK} className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full pr-3 pl-1.5 text-[0.9375rem] text-brand active:opacity-60">
            <ArrowLeft className="size-[1.125rem]" strokeWidth={2} aria-hidden /> {t.urgent.back}
          </Link>
        </div>
        <h1 className="mt-2 text-[2.25rem] leading-[1.05] font-bold tracking-tight">{t.urgent.title}</h1>

        {!from ? (
          <div className="mt-10">
            <p className="text-[1.125rem] leading-snug text-haze">{here.status === "locating" || here.status === "checking" ? t.urgent.finding : t.urgent.noLocation}</p>
            {here.status !== "locating" && here.status !== "checking" && (
              <button type="button" onClick={here.request} className="mt-6 h-16 w-full rounded-full bg-ink text-[1.125rem] font-bold text-night">
                {t.urgent.allow}
              </button>
            )}
          </div>
        ) : !pick ? (
          <p className="mt-10 text-[1.125rem] leading-snug text-haze">{t.urgent.none}</p>
        ) : (
          <section className="mt-8 flex flex-1 flex-col" aria-live="polite">
            <p className="text-[1.5rem] leading-tight font-semibold break-words">{pick.toilet.name}</p>
            <p className="mt-1 text-[1.0625rem] text-haze">
              {t.kinds[pick.toilet.kind]} · {pick.toilet.access === "paid" && pick.toilet.price ? `${t.access.paid} ${formatPrice(pick.toilet.price, pick.toilet.currency, lang)}` : t.access[pick.toilet.access]}
            </p>
            <HoursLine toilet={pick.toilet} className="mt-0.5 text-[1.0625rem]" />

            <p className="mt-6 text-[4.25rem] leading-none font-extrabold tracking-tight tabular-nums">{formatDistance(pick.metres)}</p>
            {walkIfNear(pick.metres) !== null && <p className="mt-1 text-[1.5rem] font-semibold text-brand">{t.card.walk(walkIfNear(pick.metres)!)}</p>}

            {pick.toilet.code !== "" ? (
              <button
                type="button"
                onClick={() => setShown((s) => !s)}
                className="mt-6 flex h-20 w-full items-center justify-center rounded-3xl border-2 border-good/50 bg-good/[0.08] px-4"
              >
                {shown ? (
                  <span className={cn("font-mono font-bold tracking-[0.1em] break-all tabular-nums", pick.toilet.code.length > 9 ? "text-[1.75rem]" : "text-[2.5rem]")}>{pick.toilet.code}</span>
                ) : (
                  <span className="inline-flex items-center gap-2.5 text-[1.25rem] font-bold">
                    <Eye className="size-6 text-good" aria-hidden /> {t.urgent.tapCode}
                  </span>
                )}
              </button>
            ) : (
              <p className="mt-6 rounded-3xl border-2 border-good/50 bg-good/[0.08] px-4 py-5 text-center text-[1.25rem] font-bold">{t.card.freeNoCode}</p>
            )}

            {pick.toilet.note && <p className="mt-4 text-[1.0625rem] leading-snug break-words text-ink/85 [overflow-wrap:anywhere]">{pick.toilet.note}</p>}

            <div className="mt-auto flex flex-col gap-3 pt-8">
              <a
                href={directionsUrl(pick.toilet)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-[4.5rem] items-center justify-center gap-3 rounded-full bg-brand text-[1.375rem] font-bold text-night active:opacity-85"
              >
                <Navigation className="size-6" aria-hidden /> {t.urgent.go}
              </a>
              {ranked.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setSkip((n) => n + 1);
                    setShown(false);
                  }}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-dusk-edge text-[1.0625rem] font-semibold active:bg-fg/10"
                >
                  <RefreshCw className="size-5" aria-hidden /> {t.urgent.another}
                </button>
              )}
            </div>
          </section>
        )}
      </main>
    </PageTransition>
  );
}
