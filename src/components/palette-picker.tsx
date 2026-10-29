"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { PALETTE_IDS, paletteLook, type Flavour, type PaletteId, type PaletteLook } from "@/lib/palettes";
import { cn } from "@/lib/utils";

/*
  The palette picker: a row of small screens you swipe through, each drawn in that palette
  (page, a card with a switch, the status dots, a Nearest button and the bar), so you see
  what you get, not only a few colour dots. The dots keep their meaning in every palette,
  so they use the app's own status colours.
*/

function Preview({ c }: { c: PaletteLook }) {
  return (
    <span aria-hidden className="relative block h-44 w-[7.75rem] overflow-hidden rounded-[1.375rem]" style={{ backgroundColor: c.page }}>
      <span className="absolute top-3.5 left-3 h-2 w-14 rounded-full" style={{ backgroundColor: c.ink }} />
      <span className="absolute inset-x-2.5 top-8 flex flex-col gap-2 rounded-2xl p-2.5" style={{ backgroundColor: c.card, boxShadow: `inset 0 0 0 1px ${c.edge}` }}>
        <span className="flex items-center gap-1.5">
          <span className="size-3.5 rounded-md" style={{ backgroundColor: c.brand }} />
          <span className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: c.ink, opacity: 0.55 }} />
          <span className="relative h-3 w-5.5 rounded-full" style={{ backgroundColor: c.brand }}>
            <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-white" />
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3.5 rounded-md" style={{ backgroundColor: c.edge }} />
          <span className="h-1.5 w-12 rounded-full" style={{ backgroundColor: c.haze, opacity: 0.7 }} />
        </span>
      </span>
      <span className="absolute top-[7.6rem] left-3 flex gap-1">
        <span className="size-2 rounded-full bg-good" />
        <span className="size-2 rounded-full bg-stale" />
        <span className="size-2 rounded-full bg-bad" />
      </span>
      <span className="absolute right-3 bottom-[3.1rem] h-5 w-10 rounded-full" style={{ backgroundColor: c.solid, boxShadow: "0 1px 3px rgb(0 0 0 / 0.2)" }} />
      <span className="absolute inset-x-3 bottom-3 flex h-8 items-center justify-around rounded-full" style={{ backgroundColor: c.glass, boxShadow: `inset 0 0 0 1px ${c.edge}, 0 2px 8px rgb(0 0 0 / 0.18)` }}>
        <span className="grid size-6 place-items-center rounded-full" style={{ backgroundColor: c.ink, opacity: 0.16 }} />
        <span className="size-2 rounded-full" style={{ backgroundColor: c.ink, opacity: 0.5 }} />
        <span className="size-2 rounded-full" style={{ backgroundColor: c.ink, opacity: 0.5 }} />
      </span>
    </span>
  );
}

export function PalettePicker({
  value,
  look,
  flavour,
  names,
  label,
  onChange,
}: {
  value: PaletteId;
  look: "light" | "dark";
  flavour: Flavour;
  names: Record<string, string>;
  label: string;
  onChange: (id: PaletteId) => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  const chosen = useRef<HTMLButtonElement>(null);
  // Keep the chosen palette in the middle of the row: also on first load, when the saved choice
  // only arrives after the first paint (it may be the tenth). Only the row scrolls, not the page.
  useEffect(() => {
    const strip = row.current;
    const item = chosen.current;
    if (strip && item) strip.scrollTo({ left: item.offsetLeft - (strip.clientWidth - item.clientWidth) / 2, behavior: "smooth" });
  }, [value]);

  return (
    <div ref={row} role="radiogroup" aria-label={label} className="relative -mx-5 flex snap-x snap-proximity gap-3 overflow-x-auto px-5 pt-3 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {PALETTE_IDS.map((id) => {
        const on = value === id;
        return (
          <button
            key={id}
            ref={on ? chosen : undefined}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(id)}
            className="flex shrink-0 snap-center flex-col items-center gap-2 active:opacity-80"
          >
            <span className={cn("relative rounded-[1.625rem] p-1 transition-shadow", on ? "shadow-[0_0_0_2px_var(--ink)]" : "shadow-[0_0_0_1px_color-mix(in_oklab,var(--fg)_14%,transparent)]")}>
              <Preview c={paletteLook(id, look, flavour)} />
              {on && (
                <span className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full bg-ink text-night">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </span>
              )}
            </span>
            <span className={cn("text-[0.8125rem] font-semibold", on ? "text-ink" : "text-haze")}>{names[id]}</span>
          </button>
        );
      })}
    </div>
  );
}
