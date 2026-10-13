"use client";

import "@/lib/maplibre-worker";
import { LocateFixed, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { PageTransition } from "@/components/page-transition";
import { HealthDot, ToiletCard } from "@/components/toilet-card";
import { LiquidIconButton } from "@/components/ui/liquid-icon-button";
import { LiquidSurface } from "@/components/ui/liquid-surface";
import { Map, MapMarker, MarkerContent, MarkerPopup, useMap, type MapRef } from "@/components/ui/map";
import { ACCESS, KINDS, addToilet, useToilets, type Access, type Kind } from "@/lib/toilets";
import { useHere } from "@/lib/use-here";
import { cn } from "@/lib/utils";

const noSubscription = () => () => {};

// Budapest, until we know where you are.
const BUDAPEST: [number, number] = [19.0402, 47.4979];

type Draft = { latitude: number; longitude: number };

/**
 * Tapping empty map starts adding a toilet there. A tap that lands on a
 * dot, or that only closes an open card, is left alone.
 */
function TapToAdd({ onTap }: { onTap: (draft: Draft) => void }) {
  const { map } = useMap();
  const onTapRef = useRef(onTap);
  useEffect(() => {
    onTapRef.current = onTap;
  });

  useEffect(() => {
    if (!map) return;
    let popupWasOpen = false;
    const down = () => {
      popupWasOpen = Boolean(document.querySelector(".maplibregl-popup"));
    };
    const click = (event: { lngLat: { lat: number; lng: number }; originalEvent: Event }) => {
      const target = event.originalEvent.target as Element | null;
      if (popupWasOpen || target?.closest(".maplibregl-marker, .maplibregl-popup")) return;
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
  options,
  value,
  onChange,
  label,
}: {
  options: Record<T, string>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {(Object.keys(options) as T[]).map((key) => (
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
          {options[key]}
        </button>
      ))}
    </div>
  );
}

export default function MapPage() {
  const mapRef = useRef<MapRef>(null);
  const here = useHere();
  const toilets = useToilets();

  const dockSlot = useSyncExternalStore(
    noSubscription,
    () => document.getElementById("dock-accessory"),
    () => null,
  );
  const [draft, setDraft] = useState<Draft | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<Kind>("cafe");
  const [access, setAccess] = useState<Access>("customers");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<{ id: string; name: string } | null>(null);

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
    const root = document.documentElement;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    const originalViewport = meta?.content;
    root.dataset.sheet = "open";
    if (meta && originalViewport && !originalViewport.includes("interactive-widget")) {
      meta.content = `${originalViewport}, interactive-widget=resizes-content`;
    }
    return () => {
      delete root.dataset.sheet;
      if (meta && originalViewport !== undefined) meta.content = originalViewport;
    };
  }, [sheetOpen]);

  const [closing, setClosing] = useState(false);
  const closeSheet = () => {
    setClosing(true);
    window.setTimeout(() => {
      setDraft(null);
      setClosing(false);
    }, 220);
  };

  const locate = async () => {
    if (here.coords) {
      mapRef.current?.flyTo({ center: [here.coords.longitude, here.coords.latitude], zoom: 16, duration: 1200 });
    } else {
      flownRef.current = false;
      await here.request();
    }
  };

  const startDraft = (next: Draft) => {
    if (!draft) {
      setName("");
      setCode("");
      setNote("");
      setKind("cafe");
      setAccess("customers");
      setError(null);
    }
    setDraft(next);
    // Keep the pin in view above the sheet.
    mapRef.current?.easeTo({ center: [next.longitude, next.latitude], offset: [0, -170], duration: 500 });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    if (!name.trim()) return setError("What's the place called?");
    if (!code.trim()) return setError("Add the code, that's the whole point.");
    const toilet = addToilet({ name: name.trim(), code: code.trim(), kind, access, note: note.trim(), ...draft });
    closeSheet();
    setJustAdded({ id: toilet.id, name: toilet.name });
    window.setTimeout(() => setJustAdded(null), 2600);
  };

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
          <TapToAdd onTap={startDraft} />

          {toilets.map((toilet) => (
            <MapMarker key={toilet.id} latitude={toilet.latitude} longitude={toilet.longitude}>
              {/* A small dot, coloured by how much to trust the code, with a finger-sized tap area */}
              <MarkerContent>
                <span role="button" aria-label={`Open ${toilet.name}`} className="relative grid size-8 place-items-center">
                  {justAdded?.id === toilet.id && (
                    <span aria-hidden className="absolute size-2.5 animate-ping rounded-full bg-good/70" />
                  )}
                  <HealthDot
                    toilet={toilet}
                    className={cn(justAdded?.id === toilet.id && "animate-in zoom-in-0 duration-500 ease-out")}
                  />
                </span>
              </MarkerContent>
              <MarkerPopup className="w-[19rem] rounded-[1.25rem] border-dusk-edge p-4">
                <ToiletCard toilet={toilet} />
              </MarkerPopup>
            </MapMarker>
          ))}

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

        {/* Center on me, right above the dock's right edge */}
        {dockSlot &&
          createPortal(
            <LiquidIconButton label="Show where I am" shape="circle" size="lg" onClick={locate}>
              <LocateFixed className={cn("size-5", here.status === "locating" && "animate-pulse")} />
            </LiquidIconButton>,
            dockSlot,
          )}

        {toilets.length === 0 && !draft && (
          <div className="pointer-events-none absolute inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-10 flex justify-center px-6">
            <LiquidSurface radius={999} veil={0.45} className="px-5 py-3 text-center text-[0.9375rem] [text-shadow:0_1px_8px_rgb(0_0_0/0.55)]">
              Know a code? Tap the map where it is.
            </LiquidSurface>
          </div>
        )}

        {justAdded && (
          <div className="absolute inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-20 flex justify-center px-6">
            <LiquidSurface
              radius={999}
              veil={0.45}
              role="status"
              className="px-5 py-3 text-center [text-shadow:0_1px_8px_rgb(0_0_0/0.55)] animate-in fade-in slide-in-from-top-2"
            >
              Added {justAdded.name}. Thank you.
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
            <div aria-hidden className="mx-auto mb-2 h-1 w-10 rounded-full bg-dusk-edge" />
            {/* Add sits up top so it stays reachable above the keyboard. */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeSheet}
                aria-label="Cancel"
                className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full text-haze hover:text-ink"
              >
                <X className="size-5" />
              </button>
              <h2 className="t-section min-w-0 flex-1 truncate">Add a toilet</h2>
              <button
                type="submit"
                className="h-10 shrink-0 rounded-full bg-ink px-5 text-[0.9375rem] font-semibold text-night transition-transform active:scale-[0.97]"
              >
                Add
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <input
                aria-label="Place"
                placeholder="Place, like Café Gerlóczy"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-2xl border border-dusk-edge bg-night px-4 outline-none placeholder:text-haze/60 focus:border-good"
              />
              <input
                aria-label="Code"
                placeholder="Code, like 4821#"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                className="h-14 rounded-2xl border border-dusk-edge bg-night px-4 font-mono text-[1.375rem] tracking-[0.16em] outline-none placeholder:font-sans placeholder:text-base placeholder:tracking-normal placeholder:text-haze/60 focus:border-good"
              />
              <Choice label="Kind of place" options={KINDS} value={kind} onChange={setKind} />
              <Choice label="Who can use it" options={ACCESS} value={access} onChange={setAccess} />
              <input
                aria-label="Note"
                placeholder="Note (optional): which floor, where the door is"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-12 rounded-2xl border border-dusk-edge bg-night px-4 outline-none placeholder:text-haze/60 focus:border-good"
              />
              {error && (
                <p role="alert" className="text-sm text-bad">
                  {error}
                </p>
              )}
            </div>
          </form>
        )}
      </main>
    </PageTransition>
  );
}
