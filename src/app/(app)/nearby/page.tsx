"use client";

import { ChevronDown, MapPin, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/onboarding/action-button";
import { PageTransition } from "@/components/page-transition";
import { HealthDot, HoursLine, ToiletCard } from "@/components/toilet-card";
import { LiquidSurface } from "@/components/ui/liquid-surface";
import { searchPlaces, type Place } from "@/lib/geocode";
import { useT, type Dict } from "@/lib/i18n";
import { distance, formatDistance, useToilets, type Toilet } from "@/lib/toilets";
import { useHere } from "@/lib/use-here";
import { cn } from "@/lib/utils";

// Without your location, distances are from Deák Ferenc tér.
const CITY_CENTRE = { latitude: 47.4979, longitude: 19.0544 };

/** Lowercase, without accents, so "kor" finds "Kör". */
const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const matches = (t: Toilet, q: string, d: Dict) => fold(`${t.name} ${d.kinds[t.kind]} ${t.note}`).includes(fold(q));

/**
 * While you type, the dock steps aside and (on Android) the page shrinks
 * above the keyboard, so the search bar sits right on top of it.
 */
function useKeyboardMode(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const original = meta?.content;
    root.dataset.sheet = "open";
    if (meta && original && !original.includes("interactive-widget")) {
      meta.content = `${original}, interactive-widget=resizes-content`;
    }
    return () => {
      delete root.dataset.sheet;
      if (meta && original !== undefined) meta.content = original;
    };
  }, [active]);
}

export default function NearbyPage() {
  const { t: d } = useT();
  const here = useHere();
  const toilets = useToilets();
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [origin, setOrigin] = useState<Place | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useKeyboardMode(focused);

  // Addresses as you type (after a short pause), kept to Budapest.
  const q = query.trim();
  useEffect(() => {
    if (q.length < 3) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchPlaces(q, controller.signal)
        .then(setPlaces)
        .catch(() => {
          if (!controller.signal.aborted) setPlaces([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [q]);

  const from = origin ?? here.coords ?? CITY_CENTRE;
  const sorted = toilets
    .filter((t) => !q || matches(t, q, d))
    .map((t) => ({ toilet: t, metres: distance(from, t) }))
    .sort((a, b) => a.metres - b.metres);

  const done = () => {
    input.current?.blur();
    setFocused(false);
  };
  const pickPlace = (place: Place) => {
    setOrigin(place);
    setQuery("");
    setPlaces([]);
    setOpen(null);
    done();
  };
  const pickToilet = (id: string) => {
    setOpen(id);
    done();
    window.setTimeout(() => document.getElementById(`toilet-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 250);
  };

  const showPanel = focused && q.length > 0;
  const shownPlaces = q.length >= 3 ? places : [];

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-md px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-24">
        <header className="pt-8">
          <h1 className="t-display">{d.nearby.title}</h1>
          {origin ? (
            <p className="mt-2 flex items-center gap-2 text-[1.0625rem] text-haze">
              <span className="min-w-0 truncate">
                {d.nearby.closestTo} <span className="text-ink">{origin.label}</span>
              </span>
              <button
                type="button"
                onClick={() => setOrigin(null)}
                aria-label={d.nearby.backToMe}
                className="grid size-8 shrink-0 place-items-center rounded-full bg-dusk text-haze hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </p>
          ) : (
            <p className="mt-2 text-[1.0625rem] text-haze">
              {here.coords ? d.nearby.fromYou : d.nearby.fromCentre}
            </p>
          )}
          {!origin && !here.coords && here.status !== "denied" && here.status !== "checking" && (
            <ActionButton
              variant="secondary"
              className="mt-5 h-12"
              onClick={here.request}
              disabled={here.status === "locating"}
            >
              {here.status === "locating" ? d.nearby.finding : d.nearby.useLocation}
            </ActionButton>
          )}
        </header>

        {toilets.length === 0 ? (
          <p className="mt-10 max-w-[32ch] text-haze">
            {d.nearby.empty}
          </p>
        ) : sorted.length === 0 ? (
          <p className="mt-10 max-w-[32ch] text-haze">{d.nearby.noMatch(q)}</p>
        ) : (
          <ul className="mt-8 divide-y divide-dusk-edge border-y border-dusk-edge">
            {sorted.map(({ toilet, metres }) => {
              const isOpen = open === toilet.id;
              return (
                <li key={toilet.id} id={`toilet-${toilet.id}`}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : toilet.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 py-4 text-left"
                  >
                    <HealthDot toilet={toilet} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{toilet.name}</span>
                      <span className="flex items-center gap-2 text-sm text-haze">
                        {d.kinds[toilet.kind]}
                        <HoursLine toilet={toilet} className="text-xs" />
                      </span>
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

      {/* Search: a glass bar above the dock; while typing it sits on the keyboard */}
      {focused && <div aria-hidden onClick={done} className="fixed inset-0 z-40 bg-black/50 animate-in fade-in" />}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 z-50 flex justify-center transition-[bottom] duration-300 ease-out",
          focused
            ? "bottom-[max(env(safe-area-inset-bottom),0.75rem)]"
            : "bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+5.25rem)]",
        )}
      >
        <div
          className={cn(
            "pointer-events-auto transition-[width] duration-300 ease-out",
            focused ? "w-[min(calc(100vw-2rem),28rem)]" : "w-[min(calc(100vw-5rem),22rem)]",
          )}
        >
          <AnimatePresence>
            {showPanel && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                // Keep the keyboard up while tapping a result.
                onMouseDown={(e) => e.preventDefault()}
                className="mb-2 max-h-[45dvh] overflow-y-auto rounded-[1.5rem] border border-dusk-edge bg-dusk p-2"
              >
                {sorted.slice(0, 3).map(({ toilet, metres }) => (
                  <button
                    key={toilet.id}
                    type="button"
                    onClick={() => pickToilet(toilet.id)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-night/60"
                  >
                    <HealthDot toilet={toilet} />
                    <span className="min-w-0 flex-1 truncate font-semibold">{toilet.name}</span>
                    <span className="text-sm text-haze tabular-nums">{formatDistance(metres)}</span>
                  </button>
                ))}
                {sorted.length > 0 && shownPlaces.length > 0 && <div className="mx-3 my-1 h-px bg-dusk-edge" />}
                {shownPlaces.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => pickPlace(place)}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-night/60"
                  >
                    <MapPin className="size-4 shrink-0 text-haze" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{place.label}</span>
                      <span className="block truncate text-sm text-haze">{place.detail}</span>
                    </span>
                  </button>
                ))}
                {q.length >= 3 && searching && shownPlaces.length === 0 && (
                  <p className="px-3 py-2.5 text-sm text-haze">{d.nearby.looking}</p>
                )}
                {sorted.length === 0 && shownPlaces.length === 0 && !searching && (
                  <p className="px-3 py-2.5 text-sm text-haze">
                    {q.length < 3 ? d.nearby.keepTyping : d.nearby.nothing}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <LiquidSurface radius={999} veil={0.55} className="flex h-14 items-center gap-2 pr-1.5 pl-4">
            <Search className="size-5 shrink-0 text-haze" aria-hidden />
            <input
              ref={input}
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && shownPlaces[0]) pickPlace(shownPlaces[0]);
                if (e.key === "Escape") done();
              }}
              placeholder={d.nearby.search}
              aria-label={d.nearby.search}
              className="h-full min-w-0 flex-1 bg-transparent text-[1rem] outline-none placeholder:text-haze [&::-webkit-search-cancel-button]:hidden"
            />
            {(query || focused) && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (query ? setQuery("") : done())}
                aria-label={query ? d.nearby.clear : d.nearby.close}
                className="grid size-11 shrink-0 place-items-center rounded-full text-haze hover:text-ink"
              >
                <X className="size-5" />
              </button>
            )}
          </LiquidSurface>
        </div>
      </div>
    </PageTransition>
  );
}
