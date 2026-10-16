"use client";

import "@/lib/maplibre-worker";
import { Accessibility, Baby, ChevronUp, LocateFixed, Zap, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AddedBurst, AddedCheck, DropIn } from "@/components/added-burst";
import { LegalLinks } from "@/components/legal-page";
import { PageTransition } from "@/components/page-transition";
import { HealthDot, ToiletCard } from "@/components/toilet-card";
import { btn } from "@/components/ui/buttons";
import { LimitedInput } from "@/components/limited-input";
import { LiquidIconButton } from "@/components/ui/liquid-icon-button";
import { LiquidSurface } from "@/components/ui/liquid-surface";
import { Map, MapMarker, MapPopup, MarkerContent, useMap, type MapRef } from "@/components/ui/map";
import { spotMessage, useT } from "@/lib/i18n";
import { requestLocation } from "@/lib/location";
import { Buildings3D } from "@/components/buildings-3d";
import { checkFields } from "@/lib/moderation";
import { useSettings } from "@/lib/settings";
import { LIMITS, cleanCode, cleanText, tidy, validCode, validName } from "@/lib/limits";
import { checkOnTheSpot } from "@/lib/on-the-spot";
import {
  ACCESS_KEYS,
  DAILY_LIMIT,
  KIND_KEYS,
  addToilet,
  addedToday,
  inBudapest,
  distance,
  isOpen,
  trust,
  useToilets,
  type Access,
  type Hours,
  type Kind,
  type Toilet,
} from "@/lib/toilets";
import { useHere } from "@/lib/use-here";
import { cn } from "@/lib/utils";

const noSubscription = () => () => {};

// Budapest, until we know where you are.
const BUDAPEST: [number, number] = [19.0402, 47.4979];
// "Usually works": at least this share of people got in.
const TRUSTED = 0.6;

type Draft = { latitude: number; longitude: number };
type Filters = { open: boolean; free: boolean; works: boolean };

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
            value === key ? "border-ink bg-ink text-night" : "border-dusk-edge bg-night text-haze",
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
        on ? "border-good bg-good/15 text-good" : "border-dusk-edge bg-night text-haze",
      )}
    >
      {icon}
      {children}
    </button>
  );
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
  const mapRef = useRef<MapRef>(null);
  const here = useHere();
  const { buildings3d } = useSettings();
  const toilets = useToilets();

  const dockSlot = useSyncExternalStore(
    noSubscription,
    () => document.getElementById("dock-accessory"),
    () => null,
  );
  const [filters, setFilters] = useState<Filters>({ open: false, free: false, works: false });
  const [focus, setFocus] = useState<Toilet | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<Kind>("other");
  const [access, setAccess] = useState<Access>("customers");
  const [price, setPrice] = useState("");
  const [hoursMode, setHoursMode] = useState<"unknown" | "always" | "set">("unknown");
  const [opens, setOpens] = useState("08:00");
  const [closes, setCloses] = useState("22:00");
  const [wheelchair, setWheelchair] = useState(false);
  const [baby, setBaby] = useState(false);
  const [note, setNote] = useState("");
  const [details, setDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justAdded, setJustAdded] = useState<{ id: string; name: string } | null>(null);

  const visible = toilets.filter(
    (toilet) =>
      (!filters.open || isOpen(toilet) === true) &&
      (!filters.free || toilet.access === "free") &&
      (!filters.works || trust(toilet) >= TRUSTED),
  );
  const filtering = filters.open || filters.free || filters.works;

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

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(null), 3200);
  };

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
        from = { latitude: BUDAPEST[1], longitude: BUDAPEST[0] };
      }
    }
    const best = toilets
      .filter((toilet) => isOpen(toilet) !== false && trust(toilet) >= TRUSTED)
      .map((toilet) => ({ toilet, metres: distance(from, toilet) }))
      .sort((a, b) => a.metres - b.metres)[0];
    if (!best) return flash(t.map.nearestNone);
    openCard(best.toilet, 17);
  };

  const startDraft = (next: Draft) => {
    if (!draft) {
      setName("");
      setCode("");
      setNote("");
      setKind("other");
      setAccess("customers");
      setPrice("");
      setHoursMode("unknown");
      setWheelchair(false);
      setBaby(false);
      setDetails(false);
      setError(null);
    }
    setFocus(null);
    setDraft(next);
    // Keep the pin in view above the sheet.
    mapRef.current?.easeTo({ center: [next.longitude, next.latitude], offset: [0, -200], duration: 500 });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    // "Paid" with no price typed is simply free.
    const paidFor = access === "paid" && Number(price) > 0;
    const cleanName = tidy(name, LIMITS.name);
    const cleanedCode = cleanCode(code);
    if (!cleanName || !validName(cleanName)) return setError(t.add.errName);
    if (!code.trim()) return setError(t.add.errCode);
    if (!validCode(cleanedCode)) return setError(t.add.errCodeChars);
    if (!checkFields({ name: cleanName, note: tidy(note, LIMITS.note) }).ok) return setError(t.add.errBad);
    if (access === "paid" && Number(price) > LIMITS.price) return setError(t.add.errPriceMax(LIMITS.price));
    if (!inBudapest(draft)) return setError(t.add.errCity);
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
      access: paidFor ? "paid" : access === "paid" ? "free" : access,
      price: paidFor ? Number(price) : undefined,
      hours,
      wheelchair: wheelchair || undefined,
      babyChanging: baby || undefined,
      note: tidy(note, LIMITS.note),
      ...draft,
    }, spot.location);
    closeSheet();
    setJustAdded({ id: toilet.id, name: toilet.name });
    // A tiny tap on phones that allow it (not iPhones).
    try {
      navigator.vibrate?.(18);
    } catch {
      // No haptics: the animation is enough.
    }
    window.setTimeout(() => setJustAdded(null), 2600);
  };

  const field =
    "h-12 rounded-2xl border border-dusk-edge bg-night px-4 outline-none placeholder:text-haze/60 focus:border-good";

  return (
    <PageTransition>
      <main className="fixed inset-x-0 top-0 h-lvh bg-night">
        <Map
          ref={mapRef}
          theme="dark"
          center={here.coords ? [here.coords.longitude, here.coords.latitude] : BUDAPEST}
          zoom={here.coords ? 15 : 12}
          className="h-full w-full"
        >
          <TapToAdd onTap={startDraft} onDismiss={() => setFocus(null)} />
          <Buildings3D enabled={buildings3d} />

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
              <ToiletCard toilet={toilets.find((x) => x.id === focus.id) ?? focus} />
            </MapPopup>
          )}

          {here.coords && (
            <MapMarker latitude={here.coords.latitude} longitude={here.coords.longitude}>
              <MarkerContent>
                <span className="relative block size-4 rounded-full bg-ink ring-4 ring-good/30" />
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

        {/* Filters: one glass bar, the same material as the dock. It sits in
            the middle when it fits and scrolls sideways when it doesn't. */}
        {!draft && (
          <div className="absolute inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-10 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <LiquidSurface radius={999} veil={0.5} className="mx-auto flex w-max gap-0.5 p-1">
              {(Object.keys(t.map.filters) as (keyof Filters)[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={filters[key]}
                  onClick={() => setFilters((f) => ({ ...f, [key]: !f[key] }))}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors duration-200",
                    filters[key] ? "bg-white/14 text-ink" : "text-ink/60 active:bg-white/8",
                  )}
                >
                  {/* A small light when the filter is on: green, like "this one works" */}
                  <span
                    aria-hidden
                    className={cn(
                      "h-1.5 rounded-full bg-good transition-all duration-200",
                      filters[key] ? "mr-2 w-1.5 opacity-100 shadow-[0_0_8px_1px_var(--good)]" : "mr-0 w-0 opacity-0",
                    )}
                  />
                  {t.map.filters[key]}
                </button>
              ))}
            </LiquidSurface>
          </div>
        )}

        {/* Above the dock: the nearest toilet on the left, center-on-me on the right */}
        {dockSlot &&
          createPortal(
            <div className="flex w-[min(calc(100vw-5rem),22rem)] items-end justify-between">
              <LiquidSurface radius={999} className="h-14">
                <button
                  type="button"
                  onClick={nearest}
                  className="inline-flex h-14 items-center gap-2 px-5 text-[0.9375rem] font-bold [text-shadow:0_1px_8px_rgb(0_0_0/0.5)]"
                >
                  <Zap className="size-4 fill-good text-good" aria-hidden />
                  {t.map.nearest}
                </button>
              </LiquidSurface>
              <LiquidIconButton label={t.map.locate} shape="circle" size="lg" onClick={locate}>
                <LocateFixed className={cn("size-5", here.status === "locating" && "animate-pulse")} />
              </LiquidIconButton>
            </div>,
            dockSlot,
          )}

        {(notice || justAdded || (filtering && visible.length === 0) || (toilets.length === 0 && !draft)) && (
          <div className="pointer-events-none absolute inset-x-0 top-[calc(max(env(safe-area-inset-top),0.75rem)+3rem)] z-20 flex justify-center px-6">
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
            {/* Pull this part up for the details, down to fold them away */}
            <div {...grip} className="-mx-5 touch-none px-5">
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
                <h2 className="t-section min-w-0 flex-1 truncate">{t.add.title}</h2>
                <button type="submit" disabled={busy} className={cn(btn.primary, "h-10 px-5 text-[0.9375rem]")}>
                  {busy ? "…" : t.add.add}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              {error && (
                <p role="alert" className="text-sm text-bad">
                  {error}
                </p>
              )}
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
              <LimitedInput
                aria-label={t.add.code}
                placeholder={t.add.code}
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
              <p className="px-1 text-xs leading-relaxed text-haze">
                {t.add.agree} <LegalLinks />
              </p>
              {/* Everything else is optional: pull the sheet up and it opens */}
              <div {...grip} className={cn("-mx-5 flex touch-none items-center justify-center gap-2 px-5 py-1.5 text-sm text-haze transition-opacity", details && "hidden")}>
                <ChevronUp className="size-4" aria-hidden />
                {t.add.pullUp}
              </div>
              <div ref={detailsBox} inert={!details} style={{ height: 0 }} className="-mx-1 overflow-hidden px-1">
              <div ref={detailsInner} className="flex flex-col gap-3 pb-1">
              <Choice label={t.add.kind} keys={KIND_KEYS} labels={t.kinds} value={kind} onChange={setKind} />
              <Choice label={t.add.who} keys={ACCESS_KEYS} labels={t.access} value={access} onChange={setAccess} />
              {access === "paid" && (
                <label className="flex items-center gap-3">
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
                  <span className="text-sm text-haze">Ft</span>
                  {Number(price) > LIMITS.price && (
                    <span role="alert" className="text-sm text-bad">
                      {t.add.priceMax(LIMITS.price)}
                    </span>
                  )}
                </label>
              )}

              <div>
                <p className="mb-1.5 text-sm text-haze">{t.add.hours}</p>
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
              </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </PageTransition>
  );
}
