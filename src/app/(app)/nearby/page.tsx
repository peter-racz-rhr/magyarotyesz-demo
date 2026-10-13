"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ActionButton } from "@/components/onboarding/action-button";
import { PageTransition } from "@/components/page-transition";
import { HealthDot, ToiletCard } from "@/components/toilet-card";
import { KINDS, distance, formatDistance, useToilets } from "@/lib/toilets";
import { useHere } from "@/lib/use-here";
import { cn } from "@/lib/utils";

// Without your location, distances are from Deák Ferenc tér.
const CITY_CENTRE = { latitude: 47.4979, longitude: 19.0544 };

export default function NearbyPage() {
  const here = useHere();
  const toilets = useToilets();
  const [open, setOpen] = useState<string | null>(null);
  const from = here.coords ?? CITY_CENTRE;

  const sorted = toilets
    .map((t) => ({ toilet: t, metres: distance(from, t) }))
    .sort((a, b) => a.metres - b.metres);

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-md px-6 pt-[max(env(safe-area-inset-top),1rem)]">
        <header className="pt-8">
          <h1 className="t-display">Nearby</h1>
          <p className="mt-2 text-[1.0625rem] text-haze">
            {here.coords ? "Closest first, from where you are." : "Closest first, from Deák Ferenc tér."}
          </p>
          {!here.coords && here.status !== "denied" && here.status !== "checking" && (
            <ActionButton
              variant="secondary"
              className="mt-5 h-12"
              onClick={here.request}
              disabled={here.status === "locating"}
            >
              {here.status === "locating" ? "Finding you…" : "Use my location"}
            </ActionButton>
          )}
        </header>

        {sorted.length === 0 ? (
          <p className="mt-10 max-w-[32ch] text-haze">
            No codes yet. Add the first one from the map: tap where the toilet is.
          </p>
        ) : (
          <ul className="mt-8 divide-y divide-dusk-edge border-y border-dusk-edge">
            {sorted.map(({ toilet, metres }) => {
              const isOpen = open === toilet.id;
              return (
                <li key={toilet.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : toilet.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 py-4 text-left"
                  >
                    <HealthDot toilet={toilet} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{toilet.name}</span>
                      <span className="block text-sm text-haze">{KINDS[toilet.kind]}</span>
                    </span>
                    <span className="text-haze tabular-nums">{formatDistance(metres)}</span>
                    <ChevronDown
                      className={cn("size-5 shrink-0 text-haze transition-transform duration-300", isOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", duration: 0.45, bounce: 0 }}
                        className="overflow-hidden"
                      >
                        <ToiletCard toilet={toilet} inList className="pb-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </PageTransition>
  );
}
