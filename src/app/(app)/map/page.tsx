"use client";

import { requireAccount } from "@/lib/sync";
import "@/lib/maplibre-worker";
import { Accessibility, Baby, BadgeCheck, ChevronUp, Clock, ThumbsUp, LocateFixed, SlidersHorizontal, Users, Zap, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AddedBurst, AddedCheck, DropIn } from "@/components/added-burst";
import { HintChips } from "@/components/hint-chips";
import { LegalLinks } from "@/components/legal-page";
import { PageTransition } from "@/components/page-transition";
import { HealthDot, ToiletCard } from "@/components/toilet-card";
import { btn } from "@/components/ui/buttons";
import { LimitedInput } from "@/components/limited-input";
import { LiquidSurface } from "@/components/ui/liquid-surface";
import { Map, MapMarker, MapPopup, MarkerContent, useMap, type MapRef } from "@/components/ui/map";
import { spotMessage, useT } from "@/lib/i18n";
import { DEFAULT_PLACE, lastPlace, requestLocation } from "@/lib/location";
import { Buildings3D } from "@/components/buildings-3d";
import { checkFields } from "@/lib/moderation";
import { buzz } from "@/lib/haptics";
import { useSettings } from "@/lib/settings";
import { LIMITS, cleanCode, cleanText, tidy, validCode, validName } from "@/lib/limits";
import { checkOnTheSpot } from "@/lib/on-the-spot";
import {
  ACCESS_KEYS,
  DAILY_LIMIT,
  KIND_KEYS,
  addToilet,
  addedToday,
  getToilets,
  distance,
  isOpen,
  trust,
  useToilets,
  type Access,
  type Hours,
  type Kind,
  type Toilet,
  CURRENCIES,
  guessCurrency,
} from "@/lib/toilets";
import { useMapStyle } from "@/lib/map-style";
import { useHere } from "@/lib/use-here";
import { cn } from "@/lib/utils";

const noSubscription = () => () => {};

// Where the map opens before we know where you are: the last place the phone gave, or Budapest.
const startPlace = () => (typeof window === "undefined" ? null : lastPlace()) ?? DEFAULT_PLACE;
// "Usually works": at least this share of people got in.
const TRUSTED = 0.6;

type Draft = { latitude: number; longitude: number };
const FILTER_ICONS: Partial<Record<keyof Filters, ReactNode>> = {
  open: <Clock className="size-4" aria-hidden />,
  free: <BadgeCheck className="size-4" aria-hidden />,
  works: <ThumbsUp className="size-4" aria-hidden />,
  accessible: <Accessibility className="size-4" aria-hidden />,
  baby: <Baby className="size-4" aria-hidden />,
  neutral: <Users className="size-4" aria-hidden />,
};

/** One filter: a chip in the pill, or a full row (with its icon) in the extra-filters card. */
function FilterChip({ on, label, icon, wide, onClick }: { on: boolean; label: string; icon?: ReactNode; wide?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-9 shrink-0 items-center rounded-full text-[0.8125rem] font-medium whitespace-nowrap transition-colors duration-200",
        wide ? "w-full gap-2.5 px-3.5" : "px-3",
        on ? "bg-fg/14 text-ink" : "text-ink/60 active:bg-fg/8",
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {/* A small light when the filter is on: green, like "this one works" */}
      <span aria-hidden className={cn("h-1.5 rounded-full bg-good transition-all duration-200", on ? "ml-2 w-1.5 opacity-100 shadow-[0_0_8px_1px_var(--good)]" : "ml-0 w-0 opacity-0")} />
    </button>
  );
}

/** The "tap the map" tip is shown once per visit, briefly, and only while the map has no places. */
let hintShown = false;

type Filters = { open: boolean; free: boolean; works: boolean; accessible: boolean; baby: boolean; neutral: boolean };

/**
 * Tapping empty map starts adding a toilet there. If a card is open, that
 * tap just closes it; a tap on a dot is left to the dot.
 */
function TapToAdd({ onTap, onDismiss }: { onTap: (draft: Draft) => void; onDismiss: () => void }) {
  const { map } = useMap();
  const onTapRef = useRef(onTap);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onTapRef.current = onTap;
    onDismissRef.current = onDismiss;
  });

  useEffect(() => {
    if (!map) return;
    let popupWasOpen = false;
    const down = () => {
      popupWasOpen = Boolean(document.querySelector(".maplibregl-popup"));
    };
    const click = (event: { lngLat: { lat: number; lng: number }; originalEvent: Event }) => {
      const target = event.originalEvent.target as Element | null;
      if (target?.closest(".maplibregl-marker, .maplibregl-popup")) return;
      if (popupWasOpen) return onDismissRef.current();
      onTapRef.current({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
    };
    map.on("mousedown", down);
    map.on("touchstart", down);
    map.on("click", click);
    return () => {
      map.off("mousedown", down);
      map.off("touchstart", down);
      map.off("click", click);
    };
  }, [map]);

  return null;
}

/** A row of choices that look like pills. */
function Choice<T extends string>({
  keys,
  labels,
  value,
  onChange,
  label,
}: {
  keys: readonly T[];
  labels: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "h-9 rounded-full border px-3.5 text-sm font-semibold transition-colors",
            value === key ? "border-brand bg-brand/15 text-ink" : "border-dusk-edge bg-night text-haze",
          )}
        >
          {labels[key]}
        </button>
      ))}
    </div>
  );
}

/** An on/off pill with an icon. */
function Toggle({ on, onChange, icon, children }: { on: boolean; onChange: (on: boolean) => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors",
        on ? "border-brand bg-brand/15 text-brand" : "border-dusk-edge bg-night text-haze",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** The satellite pictures end at about zoom 19, so the map stops there instead of stretching them. */
function ZoomCap({ max }: { max: number }) {
  const { map } = useMap();
  useEffect(() => {
    if (!map) return;
    map.setMaxZoom(max);
  }, [map, max]);
  return null;
}

/** Pulling further than this (px) counts as a pull, not a tap. */
const PULL_PX = 8;

/**
 * The add sheet's details follow your finger: pull the top of the sheet up
 * and they open as far as you pull; let go past a third of the way and they
 * snap open, otherwise they fold back. Pulling down folds them away, and
 * pulling down with nothing left to fold closes the sheet.
 */
function useSheetPull({ onOpenChange, onClose }: { onOpenChange: (open: boolean) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const open = useRef(false);
  const press = useRef<{ y: number; from: number; moved: boolean } | null>(null);
  const swallow = useRef(false);

  const full = () => inner.current?.scrollHeight ?? 0;
  const height = () => box.current?.getBoundingClientRect().height ?? 0;

  /** Glide to open or folded from wherever it is now. */
  const settle = (to: boolean) => {
    const el = box.current;
    if (!el) return;
    open.current = to;
    onOpenChange(to);
    el.style.transition = "height 280ms cubic-bezier(0.2, 0.8, 0.2, 1)";
    el.style.height = `${height()}px`;
    void el.offsetHeight;
    el.style.height = `${to ? full() : 0}px`;
    const done = () => {
      el.removeEventListener("transitionend", done);
      el.style.transition = "";
      // Open means "as tall as it needs", so choosing Paid or Set hours can grow it.
      if (open.current) el.style.height = "auto";
    };
    el.addEventListener("transitionend", done);
  };

  const grip = {
    onPointerDown: (e: ReactPointerEvent) => {
      // Keep receiving the pull when the finger (or mouse) leaves the handle as the sheet grows.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Not every browser can capture here; the pull still works while it stays over the handle.
      }
      open.current = height() > 0;
      press.current = { y: e.clientY, from: height(), moved: false };
    },
    onPointerMove: (e: ReactPointerEvent) => {
      const state = press.current;
      const el = box.current;
      if (!state || !el) return;
      const dy = e.clientY - state.y;
      if (!state.moved && Math.abs(dy) < PULL_PX) return;
      state.moved = true;
      el.style.transition = "none";
      el.style.height = `${Math.max(0, Math.min(full(), state.from - dy))}px`;
    },
    onPointerUp: (e: ReactPointerEvent) => {
      const state = press.current;
      press.current = null;
      if (!state?.moved) return;
      swallow.current = true;
      window.setTimeout(() => (swallow.current = false), 0);
      const dy = e.clientY - state.y;
      const wasOpen = state.from > 0;
      // Folded and pulled down: that's "close this sheet".
      if (!wasOpen && dy > 60) {
        settle(false);
        onClose();
        return;
      }
      const shown = height() / Math.max(1, full());
      settle(wasOpen ? shown > 0.7 : shown > 0.3);
    },
    onPointerCancel: () => {
      press.current = null;
      settle(open.current);
    },
    onClickCapture: (e: React.MouseEvent) => {
      if (!swallow.current) return;
      e.preventDefault();
      e.stopPropagation();
    },
  };
  return { box, inner, grip };
}

export default function MapPage() {
  const { t } = useT();
  const [start] = useState(startPlace);
  const mapRef = useRef<MapRef>(null);
  const here = useHere();
  const { buildings3d } = useSettings();
  const base = useMapStyle();
  const toilets = useToilets();

  const dockSlot = useSyncExternalStore(
    noSubscription,
    () => document.getElementById("dock-accessory"),
    () => null,
  );
  const [moreFilters, setMoreFilters] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  // The extra-filters card closes when you tap anywhere else.
  useEffect(() => {
    if (!moreFilters) return;
    const close = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreFilters(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [moreFilters]);
  const [filters, setFilters] = useState<Filters>({ open: false, free: false, works: false, accessible: false, baby: false, neutral: false });
  const [focus, setFocus] = useState<Toilet | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hintOn, setHintOn] = useState(() => !hintShown);
  useEffect(() => {
    if (!hintOn) return;
    hintShown = true;
    const timer = window.setTimeout(() => setHintOn(false), 6000);
    return () => window.clearTimeout(timer);
  }, [hintOn]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<Kind | null>(null);
  const [onlyToilet, setOnlyToilet] = useState(false);
  const [access, setAccess] = useState<Access>("customers");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState(guessCurrency);
  const [hoursMode, setHoursMode] = useState<"unknown" | "always" | "set">("unknown");
  const [opens, setOpens] = useState("08:00");
  const [closes, setCloses] = useState("22:00");
  const [wheelchair, setWheelchair] = useState(false);
  const [neutral, setNeutral] = useState(false);
  const [baby, setBaby] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  // A warning buzz when the add form says something is wrong.
  useEffect(() => {
    if (error) buzz("warn");
  }, [error]);
  const [busy, setBusy] = useState(false);
  const [justAdded, setJustAdded] = useState<{ id: string; name: string } | null>(null);

  const visible = toilets.filter(
    (toilet) =>
      (!filters.open || isOpen(toilet) === true) &&
      (!filters.free || toilet.access === "free") &&
      (!filters.works || trust(toilet) >= TRUSTED) &&
      (!filters.accessible || toilet.wheelchair === true) &&
      (!filters.baby || toilet.babyChanging === true) &&
      (!filters.neutral || toilet.genderNeutral === true),
  );
  const filtering = Object.values(filters).some(Boolean);

  // Fly to you once we know where you are.
  const flownRef = useRef(false);
  useEffect(() => {
    if (!here.coords || flownRef.current) return;
    flownRef.current = true;
    mapRef.current?.flyTo({ center: [here.coords.longitude, here.coords.latitude], zoom: 15, duration: 1800 });
  }, [here.coords]);

  // While the add sheet is open the dock steps aside, and on Android the
  // screen shrinks above the keyboard so you can see what you type.
  const sheetOpen = draft !== null;
  useEffect(() => {
    if (!sheetOpen) return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const originalViewport = meta?.content;
    if (meta && originalViewport && !originalViewport.includes("interactive-widget")) {
      meta.content = `${originalViewport}, interactive-widget=resizes-content`;
    }
    return () => {
      if (meta && originalViewport !== undefined) meta.content = originalViewport;
    };
  }, [sheetOpen]);

  // While a card or the add sheet is open, the dock and its buttons step
  // aside so nothing covers it.
  const covered = sheetOpen || focus !== null;
  useEffect(() => {
    if (!covered) return;
    const root = document.documentElement;
    root.dataset.sheet = "open";
    return () => {
      delete root.dataset.sheet;
    };
  }, [covered]);

  /** Open a toilet's card: the dot glides near the top, the card opens below it. */
  const openCard = (toilet: Toilet, zoom?: number) => {
    setFocus(toilet);
    const height = mapRef.current?.getContainer().clientHeight ?? window.innerHeight;
    mapRef.current?.easeTo({
      center: [toilet.longitude, toilet.latitude],
      offset: [0, Math.round(150 - height / 2)],
      ...(zoom ? { zoom } : {}),
      duration: zoom ? 1400 : 500,
    });
  };

  // A shared link (/map?place=...) opens that place as soon as it is known and the map is ready.
  const wanted = useRef<string | null>(null);
  useEffect(() => {
    wanted.current = new URLSearchParams(window.location.search).get("place");
    if (!wanted.current) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      const found = getToilets().find((x) => x.id === wanted.current);
      if (found && mapRef.current) {
        window.clearInterval(timer);
        wanted.current = null;
        window.history.replaceState(null, "", "/map");
        openCard(found, 17);
      } else if (++tries > 40) {
        window.clearInterval(timer);
      }
    }, 400);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // /map?nearest=1 (the "Nearest toilet" app shortcut): once there is a position, or after a few
  // seconds without one, jump to the nearest open toilet that usually works.
  const wantNearest = useRef(false);
  const nearestRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    wantNearest.current = new URLSearchParams(window.location.search).get("nearest") === "1";
  }, []);
  useEffect(() => {
    if (!wantNearest.current || toilets.length === 0 || !mapRef.current) return;
    if (!here.coords && here.status !== "denied" && here.status !== "off") return;
    wantNearest.current = false;
    window.history.replaceState(null, "", "/map");
    void nearestRef.current();
  }, [here.coords, here.status, toilets.length]);

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(null), 3200);
  };

  const [details, setDetails] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeSheet = () => {
    setClosing(true);
    window.setTimeout(() => {
      setDraft(null);
      setClosing(false);
    }, 220);
  };

  const { box: detailsBox, inner: detailsInner, grip } = useSheetPull({ onOpenChange: setDetails, onClose: closeSheet });

  const locate = async () => {
    if (here.status === "off") return flash(t.map.locationOff);
    if (here.coords) {
      mapRef.current?.flyTo({ center: [here.coords.longitude, here.coords.latitude], zoom: 16, duration: 1200 });
    } else {
      flownRef.current = false;
      await here.request();
    }
  };

  /** "I need one now": the closest toilet that's open and usually works. */
  const nearest = async () => {
    let from = here.coords;
    if (!from) {
      try {
        from = await requestLocation();
      } catch {
        from = startPlace();
      }
    }
    // The filters you set count: with "Free" on, the nearest is the nearest free one.
    const best = visible
      .filter((toilet) => isOpen(toilet) !== false && trust(toilet) >= TRUSTED)
      .map((toilet) => ({ toilet, metres: distance(from, toilet) }))
      .sort((a, b) => a.metres - b.metres)[0];
    if (!best) return flash(t.map.nearestNone);
    openCard(best.toilet, 17);
  };
  useEffect(() => {
    nearestRef.current = nearest;
  });

  const startDraft = (next: Draft) => {
    // A guest's tap on the map asks them to sign in first: places need someone behind them.
    if (!draft && !requireAccount()) return;
    if (!draft) {
      setName("");
      setCode("");
      setNote("");
      setKind(null);
      setOnlyToilet(false);
      setAccess("customers");
      setPrice("");
      setHoursMode("unknown");
      setWheelchair(false);
      setBaby(false);
      setNeutral(false);
      setDetails(false);
      setError(null);
    }
    setFocus(null);
    setDraft(next);
    // Keep the pin in view above the sheet.
    mapRef.current?.easeTo({ center: [next.longitude, next.latitude], offset: [0, -200], duration: 500 });
  };

  // Add lights up once the sheet can really be sent: the same rules the checks below enforce.
  const ready =
    validName(tidy(name, LIMITS.name)) &&
    !!kind &&
    (code.trim() ? validCode(cleanCode(code)) && onlyToilet : access !== "customers") &&
    !(access === "paid" && Number(price) > LIMITS.price);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    // "Paid" with no price typed is simply free.
    const paidFor = access === "paid" && Number(price) > 0;
    const cleanName = tidy(name, LIMITS.name);
    const cleanedCode = cleanCode(code);
    if (!cleanName || !validName(cleanName)) return setError(t.add.errName);
    // A free toilet may have no code at all ("no code needed"); anything else needs one.
    const finalAccess = paidFor ? "paid" : access === "paid" ? "free" : access;
    if (!code.trim() && finalAccess === "customers") return setError(t.add.errCode);
    if (code.trim() && !validCode(cleanedCode)) return setError(t.add.errCodeChars);
    if (!kind) return setError(t.add.errKind);
    if (code.trim() && !onlyToilet) return setError(t.add.errOnlyToilet);
    if (!checkFields({ name: cleanName, note: tidy(note, LIMITS.note) }).ok) return setError(t.add.errBad);
    if (access === "paid" && Number(price) > LIMITS.price) return setError(t.add.errPriceMax(LIMITS.price));
    if (addedToday() >= DAILY_LIMIT) return setError(t.add.errLimit);
    setBusy(true);
    setError(null);
    const spot = await checkOnTheSpot(draft);
    setBusy(false);
    if (!spot.ok) return setError(spotMessage(t, spot));

    const hours: Hours | undefined =
      hoursMode === "always" ? "24/7" : hoursMode === "set" ? { open: opens, close: closes } : undefined;
    const toilet = addToilet({
      name: cleanName,
      code: cleanedCode,
      kind,
      access: finalAccess,
      price: paidFor ? Number(price) : undefined,
      currency: paidFor ? currency : undefined,
      hours,
      wheelchair: wheelchair || undefined,
      babyChanging: baby || undefined,
      genderNeutral: neutral || undefined,
      note: tidy(note, LIMITS.note),
      ...draft,
    }, spot.location);
    closeSheet();
    setJustAdded({ id: toilet.id, name: toilet.name });
    // A little celebration buzz on phones that allow it (not iPhones).
    buzz("success");
    window.setTimeout(() => setJustAdded(null), 2600);
  };

  const field =
    "h-12 rounded-2xl border border-dusk-edge bg-night px-4 outline-none placeholder:text-haze/60 focus:border-brand";

  return (
    <PageTransition>
      <main className="fixed inset-x-0 top-0 h-lvh bg-night">
        <Map
          ref={mapRef}
          theme={base.theme}
          styles={base.styles}
          center={here.coords ? [here.coords.longitude, here.coords.latitude] : [start.longitude, start.latitude]}
          zoom={here.coords ? 15 : 12}
          className="h-full w-full"
        >
          <TapToAdd onTap={startDraft} onDismiss={() => setFocus(null)} />
          <ZoomCap max={base.key === "satellite" ? 19 : 22} />
          <Buildings3D enabled={buildings3d && base.key !== "satellite"} variant={base.key === "light" ? "light" : "dark"} />

          {visible.map((toilet) => (
            <MapMarker key={toilet.id} latitude={toilet.latitude} longitude={toilet.longitude}>
              {/* A small dot, coloured by how many got in, with a finger-sized tap area */}
              <MarkerContent>
                <span
                  role="button"
                  aria-label={toilet.name}
                  onClick={() => openCard(toilet)}
                  className="relative grid size-8 place-items-center"
                >
                  {justAdded?.id === toilet.id && <AddedBurst />}
                  {(() => {
                    const dot = <HealthDot toilet={toilet} className={cn(isOpen(toilet) === false && "opacity-45")} />;
                    return justAdded?.id === toilet.id ? <DropIn>{dot}</DropIn> : dot;
                  })()}
                  {/* A paid place carries a small "Ft" tag, so it reads as paid by its shape and letters, not only by colour */}
                  {toilet.access === "paid" && (
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute top-[calc(50%-17px)] left-[calc(50%+3px)] grid h-[14px] place-items-center rounded-[5px] bg-stale px-[3px] text-[0.5625rem] leading-none font-extrabold text-night ring-2 ring-night",
                        isOpen(toilet) === false && "opacity-45",
                      )}
                    >
                      Ft
                    </span>
                  )}
                </span>
              </MarkerContent>
            </MapMarker>
          ))}

          {/* The open card, hanging below its dot; it scrolls if it's taller than the screen */}
          {focus && (
            <MapPopup
              key={focus.id}
              latitude={focus.latitude}
              longitude={focus.longitude}
              anchor="top"
              offset={18}
              closeOnClick={false}
              onClose={() => setFocus((f) => (f?.id === focus.id ? null : f))}
              className="max-h-[calc(100dvh-13rem)] w-[20rem] max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-[1.25rem] border-dusk-edge p-4"
            >
              <ToiletCard toilet={toilets.find((x) => x.id === focus.id) ?? focus} from={here.coords} />
            </MapPopup>
          )}

          {here.coords && (
            <MapMarker latitude={here.coords.latitude} longitude={here.coords.longitude}>
              <MarkerContent>
                <span className="relative block size-4 rounded-full border-2 border-me-edge bg-me ring-4 ring-me-ring" />
              </MarkerContent>
            </MapMarker>
          )}

          {draft && (
            <MapMarker latitude={draft.latitude} longitude={draft.longitude} anchor="bottom">
              <MarkerContent>
                <span className="flex flex-col items-center animate-in fade-in zoom-in-75 slide-in-from-top-3 duration-300">
                  <span className="block size-5 rounded-full bg-good ring-4 ring-night shadow-[0_0_16px_4px_rgba(79,224,138,0.5)]" />
                  <span className="h-4 w-0.5 bg-ink" />
                </span>
              </MarkerContent>
            </MapMarker>
          )}
        </Map>

        {/* Top of the map: the filter pill (glass, like the dock), and under it any notice. */}
        <div data-pull-zone className="pointer-events-none absolute inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-10 flex flex-col gap-2 px-4">
          {!draft && (
            <div className="pointer-events-auto flex justify-end">
              {/* One small button in the corner; all six filters open under it. A green dot says some are on. */}
              <div ref={moreRef} className="relative">
                <LiquidSurface radius={999} className="size-11">
                  <button
                    type="button"
                    aria-label={t.map.moreFilters}
                    aria-expanded={moreFilters}
                    onClick={() => setMoreFilters((v) => !v)}
                    className="relative grid size-full place-items-center rounded-full"
                  >
                    <SlidersHorizontal className="size-[1.125rem]" aria-hidden />
                    {filtering && <span aria-hidden className="absolute top-2.5 right-2.5 size-2 rounded-full bg-good shadow-[0_0_6px_1px_var(--good)]" />}
                  </button>
                </LiquidSurface>
                {moreFilters && (
                  <LiquidSurface radius={22} className="filter-card absolute top-full right-0 z-20 mt-2 flex w-max flex-col gap-0.5 p-1.5 animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150">
                    {(Object.keys(t.map.filters) as (keyof Filters)[]).map((key) => (
                      <FilterChip key={key} wide on={filters[key]} label={t.map.filters[key]} icon={FILTER_ICONS[key]} onClick={() => setFilters((f) => ({ ...f, [key]: !f[key] }))} />
                    ))}
                  </LiquidSurface>
                )}
              </div>
            </div>
          )}
            {(notice || justAdded || (filtering && visible.length === 0) || (toilets.length === 0 && !draft && hintOn)) && (
              <div className="pointer-events-none flex justify-center px-2">
                <LiquidSurface
                  radius={999}
                  veil={0.45}
                  role="status"
                  className="px-5 py-3 text-center text-[0.9375rem] [text-shadow:0_1px_8px_rgb(0_0_0/0.55)] animate-in fade-in slide-in-from-top-2"
                >
                  {notice ??
                    (justAdded
                      ? (
                          <span className="inline-flex items-center gap-2">
                            <AddedCheck />
                            {t.map.added(justAdded.name)}
                          </span>
                        )
                      : filtering && visible.length === 0 && toilets.length > 0
                        ? t.map.noMatch
                        : t.map.hint)}
                </LiquidSurface>
              </div>
            )}
        </div>

        {/* Above the dock: the nearest toilet on the left, center-on-me on the right */}
        {dockSlot &&
          createPortal(
            <div className="flex w-[min(calc(100vw-5rem),22rem)] items-end justify-between">
              <LiquidSurface radius={999} className="h-14">
                <button
                  type="button"
                  onClick={nearest}
                  className="inline-flex h-14 items-center gap-2 px-5 text-[0.9375rem] font-bold [text-shadow:0_1px_8px_rgb(0_0_0/0.5)] [html[data-text=large]_&]:px-4 [html[data-text=xl]_&]:gap-1.5 [html[data-text=xl]_&]:px-3.5 [html[data-text=xl]_&]:text-[0.8125rem]"
                >
                  <Zap className="size-4 fill-brand text-brand" aria-hidden />
                  {t.map.nearest}
                </button>
              </LiquidSurface>
              <LiquidSurface radius={999} className="size-14">
                <button type="button" aria-label={t.map.locate} onClick={locate} className="grid size-full place-items-center rounded-full">
                  <LocateFixed className={cn("size-5", here.status === "locating" && "animate-pulse")} />
                </button>
              </LiquidSurface>
            </div>,
            dockSlot,
          )}

        {/* Add sheet */}
        {draft && (
          <form
            noValidate
            onSubmit={submit}
            className={cn(
              "fixed inset-x-0 bottom-0 z-30 mx-auto max-h-[85dvh] max-w-md overflow-y-auto overscroll-contain rounded-t-[1.75rem] border-t border-dusk-edge bg-dusk px-5 pt-2 pb-[max(env(safe-area-inset-bottom),1rem)]",
              closing
                ? "animate-out fade-out slide-out-to-bottom fill-mode-forwards duration-200 ease-in"
                : "animate-in slide-in-from-bottom duration-300 ease-out",
            )}
          >
            {/* Pull this part up for the extras, down to fold them away */}
            <div {...grip} className="-mx-5 touch-none px-5 select-none">
            <div className="flex justify-center pt-2 pb-3">
              <span aria-hidden className="h-1 w-10 rounded-full bg-dusk-edge" />
            </div>
            {/* Add sits up top so it stays reachable above the keyboard. */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeSheet}
                aria-label={t.add.cancel}
                className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full text-haze hover:text-ink"
              >
                <X className="size-5" />
              </button>
              <h2 className="t-section min-w-0 flex-1 leading-tight break-words">{t.add.title}</h2>
              <button type="submit" disabled={busy} aria-disabled={!ready} className={cn(btn.primary, "h-10 px-5 text-[0.9375rem]", !ready && "opacity-40")}>
                {busy ? "…" : t.add.add}
              </button>
            </div>
            </div>

            <div className="mt-4 flex flex-col gap-5 pb-2">
              {error && (
                <p role="alert" className="text-sm text-bad">
                  {error}
                </p>
              )}

              {/* 1. What and where */}
              <section className="flex flex-col gap-3">
                <LimitedInput
                  aria-label={t.add.place}
                  placeholder={t.add.place}
                  value={name}
                  onValueChange={(v) => {
                    setName(v);
                    setError(null);
                  }}
                  max={LIMITS.name}
                  clean={(v) => cleanText(v, LIMITS.name)}
                  rejectedHint={t.add.textHint}
                  className={cn(field, "w-full")}
                />
                <div className="flex flex-col gap-2">
                  <p className={cn("px-1 text-xs", error === t.add.errKind ? "font-semibold text-bad" : "text-haze")}>{t.add.kind}</p>
                  <Choice label={t.add.kind} keys={KIND_KEYS} labels={t.kinds} value={kind as Kind} onChange={(v) => { setKind(v); setError(null); }} />
                </div>
              </section>

              {/* 2. Who can use it, the price when it costs, and the code */}
              <section className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <p className="px-1 text-xs text-haze">{t.add.who}</p>
                  <Choice label={t.add.who} keys={ACCESS_KEYS} labels={t.access} value={access} onChange={setAccess} />
                </div>
                {access === "paid" && (
                  <label className="flex items-center gap-3 px-1">
                    <span className="text-sm text-haze">{t.add.price}</span>
                    <input
                      inputMode="numeric"
                      value={price}
                      maxLength={String(LIMITS.price).length}
                      onChange={(e) => {
                        setPrice(e.target.value.replace(/\D/g, "").replace(/^0+/, ""));
                        setError(null);
                      }}
                      placeholder={t.add.priceFree}
                      aria-invalid={Number(price) > LIMITS.price}
                      className={cn(field, "h-10 w-24", Number(price) > LIMITS.price && "border-bad focus:border-bad")}
                    />
                    <select
                      aria-label={t.add.currency}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className={cn(field, "h-10 w-auto px-2 text-sm")}
                    >
                      {[...new Set([guessCurrency(), ...CURRENCIES])].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {Number(price) > LIMITS.price && (
                      <span role="alert" className="text-sm text-bad">
                        {t.add.priceMax(LIMITS.price)}
                      </span>
                    )}
                  </label>
                )}
                <LimitedInput
                  aria-label={t.add.code}
                  placeholder={access !== "customers" ? t.add.codeFree : t.add.code}
                  value={code}
                  onValueChange={(v) => {
                    setCode(v);
                    setError(null);
                  }}
                  max={LIMITS.code}
                  clean={cleanCode}
                  rejectedHint={t.add.codeHint}
                  autoComplete="off"
                  autoCapitalize="characters"
                  className={cn(field, "h-14 w-full font-mono text-[1.375rem] tracking-[0.16em] placeholder:font-sans placeholder:text-base placeholder:tracking-normal")}
                />
                {code.trim() && (
                <label className="flex items-start gap-3 rounded-2xl border border-dusk-edge px-3.5 py-3 text-[0.8125rem] leading-snug">
                  <input type="checkbox" checked={onlyToilet} onChange={(e) => { setOnlyToilet(e.target.checked); setError(null); }} className="mt-0.5 size-5 shrink-0 accent-[var(--good)]" />
                  <span>{t.add.onlyToilet}</span>
                </label>
                )}
              </section>

              <p className="px-1 text-xs leading-relaxed text-haze">
                {t.add.agree} <LegalLinks />
              </p>

              {/* 3. Nice to have: pull the sheet up and it opens */}
              <div {...grip} className={cn("-mx-5 -mt-2 touch-none items-center justify-center gap-2 px-5 py-1.5 text-sm text-haze select-none", details ? "hidden" : "flex")}>
                <ChevronUp className="size-4" aria-hidden />
                {t.add.pullUp}
              </div>
              <div ref={detailsBox} inert={!details} style={{ height: 0 }} className="-mx-1 -mt-3 overflow-hidden px-1">
                <div ref={detailsInner} className="flex flex-col gap-3 pb-1">
                  <div>
                    <p className="mb-1.5 px-1 text-sm text-haze">{t.add.hours}</p>
                    <Choice
                      label={t.add.hours}
                      keys={["unknown", "always", "set"] as const}
                      labels={{ unknown: t.add.hoursUnknown, always: t.add.hours247, set: t.add.hoursSet }}
                      value={hoursMode}
                      onChange={setHoursMode}
                    />
                    {hoursMode === "set" && (
                      <div className="mt-2 flex items-center gap-3 text-sm text-haze">
                        <label className="flex items-center gap-2">
                          {t.add.opens}
                          <input type="time" value={opens} onChange={(e) => setOpens(e.target.value)} className={cn(field, "h-10 px-3 text-ink [color-scheme:dark]")} />
                        </label>
                        <label className="flex items-center gap-2">
                          {t.add.closes}
                          <input type="time" value={closes} onChange={(e) => setCloses(e.target.value)} className={cn(field, "h-10 px-3 text-ink [color-scheme:dark]")} />
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Toggle on={wheelchair} onChange={setWheelchair} icon={<Accessibility className="size-4" aria-hidden />}>
                      {t.add.wheelchair}
                    </Toggle>
                    <Toggle on={baby} onChange={setBaby} icon={<Baby className="size-4" aria-hidden />}>
                      {t.add.baby}
                    </Toggle>
                    <Toggle on={neutral} onChange={setNeutral} icon={<Users className="size-4" aria-hidden />}>
                      {t.add.genderNeutral}
                    </Toggle>
                  </div>
                  <LimitedInput
                    aria-label={t.add.note}
                    placeholder={t.add.note}
                    value={note}
                    onValueChange={setNote}
                    max={LIMITS.note}
                    clean={(v) => cleanText(v, LIMITS.note)}
                    rejectedHint={t.add.textHint}
                    className={cn(field, "w-full")}
                  />
                  <HintChips note={note} onChange={setNote} />
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </PageTransition>
  );
}
