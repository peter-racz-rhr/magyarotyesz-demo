"use client";

import { Map } from "@/components/ui/map";
import { useT } from "@/lib/i18n";
import { useMapStyle, type MapStyleChoice } from "@/lib/map-style";
import { updateSettings, useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

const KEYS: MapStyleChoice[] = ["auto", "dark", "light", "satellite"];

/** A small live map that shows the look you pick, with the three choices on frosted glass at its foot. */
export function MapStylePicker() {
  const { t } = useT();
  const { mapStyle } = useSettings();
  const base = useMapStyle();
  const onLight = base.key === "light";
  return (
    <div className="relative h-[13.75rem] overflow-hidden rounded-[22px] bg-black">
      <Map
        theme={base.theme}
        styles={base.styles}
        center={[19.054, 47.4975]}
        zoom={15.4}
        interactive={false}
        className="h-full w-full"
      />
      <div
        role="radiogroup"
        aria-label={t.settings.mapStyles}
        className={cn("absolute inset-x-3 bottom-3 z-20 flex rounded-[18px] p-1 shadow-[0_8px_30px_rgb(0_0_0/0.35)] ring-1 backdrop-blur-xl", onLight ? "bg-white/55 ring-black/10" : "bg-white/25 ring-white/40")}
      >
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={mapStyle === key}
            onClick={() => updateSettings({ mapStyle: key })}
            className={cn(
              "h-10 min-w-0 flex-1 rounded-[14px] px-1 text-[0.6875rem] font-bold tracking-[0.07em] uppercase transition-colors",
              mapStyle === key ? "bg-white text-[#121212] shadow-[0_2px_10px_rgb(0_0_0/0.25)]" : onLight ? "text-[#121212]/80 active:bg-black/10" : "text-white/90 active:bg-white/15",
            )}
          >
            <span className="block truncate">{t.settings.mapStyleNames[key]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
