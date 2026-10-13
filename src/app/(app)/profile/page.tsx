"use client";

import { ChevronRight, RotateCcw, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BACK, PageTransition } from "@/components/page-transition";
import { HealthDot } from "@/components/toilet-card";
import { replayIntro } from "@/lib/onboarding";
import { KINDS, addDemoToilets, ago, clearToilets, removeToilet, useToilets } from "@/lib/toilets";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function ProfilePage() {
  const router = useRouter();
  const toilets = useToilets();
  const [confirmClear, setConfirmClear] = useState(false);
  const mine = toilets.filter((t) => t.mine);
  const checks = toilets.reduce((n, t) => n + t.confirms + t.reports, 0);

  const showIntro = () => {
    replayIntro();
    router.replace("/", { transitionTypes: BACK });
  };

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-md px-6 pt-[max(env(safe-area-inset-top),1rem)]">
        <header className="pt-8">
          <h1 className="t-display">You</h1>
          <p className="mt-3 text-[1.0625rem] text-haze">
            {plural(mine.length, "code shared", "codes shared")} · {plural(checks, "check", "checks")} on this phone
          </p>
        </header>

        <section className="mt-10" aria-labelledby="mine-heading">
          <h2 id="mine-heading" className="t-section">
            Codes you shared
          </h2>
          {mine.length === 0 ? (
            <p className="mt-2 max-w-[32ch] text-haze">
              None yet. Next time you get in somewhere, tap the map and share the code.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-dusk-edge border-y border-dusk-edge">
              {mine.map((toilet) => (
                <li key={toilet.id} className="flex items-center gap-3 py-3.5">
                  <HealthDot toilet={toilet} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{toilet.name}</span>
                    <span className="block text-sm text-haze">
                      {KINDS[toilet.kind]} · added {ago(toilet.addedAt)}
                    </span>
                  </span>
                  <span className="font-mono tracking-[0.12em] text-ink/80">{toilet.code}</span>
                  <button
                    type="button"
                    onClick={() => removeToilet(toilet.id)}
                    aria-label={`Remove ${toilet.name}`}
                    className="-mr-2 grid size-10 place-items-center rounded-full text-haze hover:text-bad"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12" aria-labelledby="settings-heading">
          <h2 id="settings-heading" className="t-section">
            Settings
          </h2>
          <ul className="mt-2 divide-y divide-dusk-edge border-y border-dusk-edge">
            <li>
              <button type="button" onClick={showIntro} className="flex w-full items-center gap-4 py-4 text-left">
                <RotateCcw className="size-5 shrink-0 text-haze" aria-hidden />
                <span className="flex-1">
                  <span className="block">Show the intro again</span>
                  <span className="block text-sm text-haze">Your codes stay.</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-haze" aria-hidden />
              </button>
            </li>
            {!toilets.some((t) => !t.mine) && (
              <li>
                <button type="button" onClick={addDemoToilets} className="flex w-full items-center gap-4 py-4 text-left">
                  <Users className="size-5 shrink-0 text-haze" aria-hidden />
                  <span className="flex-1">
                    <span className="block">Add codes from other people</span>
                    <span className="block text-sm text-haze">
                      Demo: three codes near Deák tér you didn&apos;t share, to try suggesting a new code.
                    </span>
                  </span>
                </button>
              </li>
            )}
            <li>
              {confirmClear ? (
                <div className="flex items-center gap-3 py-3">
                  <span className="flex-1 text-sm">Delete every code on this phone?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="h-10 rounded-full px-4 text-sm font-semibold text-haze"
                  >
                    Keep
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearToilets();
                      setConfirmClear(false);
                    }}
                    className="h-10 rounded-full bg-bad px-4 text-sm font-semibold text-night"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex w-full items-center gap-4 py-4 text-left text-bad"
                >
                  <Trash2 className="size-5 shrink-0" aria-hidden />
                  <span className="flex-1">Delete all codes</span>
                </button>
              )}
            </li>
          </ul>
        </section>

        <footer className="mt-10 pb-6 text-[0.8125rem] leading-relaxed text-haze">
          Demo: codes are saved on this phone only. Map © CARTO, © OpenStreetMap contributors.
        </footer>
      </main>
    </PageTransition>
  );
}
