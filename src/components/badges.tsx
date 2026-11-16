"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import { CARD } from "@/components/settings-ui";
import { ALL_BADGES, earned, SHOWN_MAX, shownBadges, type Badge, type BadgeId } from "@/lib/badges";
import { useT, type Dict } from "@/lib/i18n";
import { updateSettings, useSettings } from "@/lib/settings";
import { LEVEL_STEPS } from "@/lib/toilets";
import { cn } from "@/lib/utils";

const nameOf = (t: Dict, b: Badge) => (b.rank !== undefined ? t.profile.levels[b.rank] : t.profile.supporter);

/** The badges under your name on Profile (the ones you picked, or your best rank and Supporter). */
export function BadgeShelf({ gotIn, supporter }: { gotIn: number; supporter: boolean }) {
  const { t } = useT();
  const { badges } = useSettings();
  const list = shownBadges(badges, gotIn, supporter);
  if (!list.length) return null;
  return (
    <ul className="mt-2 flex max-w-full flex-wrap justify-center gap-1.5">
      {list.map((b) => (
        <li key={b.id} className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.8125rem] font-semibold" style={{ color: b.color, background: `${b.color}22` }}>
          <b.Icon className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{nameOf(t, b)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Every badge in the app, what you have, and how to get the rest. Tapping one you have shows or hides it under your name. */
export function BadgesSection({ gotIn, supporter }: { gotIn: number; supporter: boolean }) {
  const { t } = useT();
  const { badges } = useSettings();
  const [focus, setFocus] = useState<BadgeId | null>(null);
  const [full, setFull] = useState(false);
  const shown = shownBadges(badges, gotIn, supporter).map((b) => b.id);

  const tap = (b: Badge) => {
    setFocus(b.id);
    setFull(false);
    if (!earned(b, gotIn, supporter)) return;
    if (shown.includes(b.id)) return updateSettings({ badges: shown.filter((id) => id !== b.id).join(",") || "none" });
    if (shown.length >= SHOWN_MAX) return setFull(true);
    updateSettings({ badges: [...shown, b.id].join(",") });
  };

  const focused = ALL_BADGES.find((b) => b.id === focus);
  const how = (b: Badge) => (b.rank === undefined ? t.profile.badgeSupporterHow : b.rank === 0 ? t.profile.badgeFirst : t.profile.badgeHow(LEVEL_STEPS[b.rank]));

  return (
    <section aria-labelledby="badges-heading" className={cn(CARD, "mt-3 px-4 py-3.5")}>
      <h2 id="badges-heading" className="text-[0.9375rem] font-semibold">
        {t.profile.badgesTitle}
      </h2>
      <p className="mt-0.5 text-[0.8125rem] leading-snug text-haze">{t.profile.badgesHint}</p>
      <ul className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3">
        {ALL_BADGES.map((b) => {
          const have = earned(b, gotIn, supporter);
          const on = shown.includes(b.id);
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => tap(b)}
                aria-pressed={have ? on : undefined}
                aria-label={`${nameOf(t, b)}: ${have ? (on ? t.profile.badgeShown : t.profile.badgeTapToShow) : `${t.profile.badgeLocked}. ${how(b)}`}`}
                className="flex w-full flex-col items-center gap-1.5 active:scale-95"
              >
                <span
                  className={cn("relative grid size-12 place-items-center rounded-full transition-shadow", !have && "opacity-40 grayscale", focus === b.id && "ring-2 ring-ink/60")}
                  style={{ color: b.color, background: `${b.color}22`, boxShadow: on ? `0 0 0 2px ${b.color}` : undefined }}
                >
                  <b.Icon className="size-6" strokeWidth={1.9} aria-hidden />
                  {!have && (
                    <span className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-night text-haze">
                      <Lock className="size-3" aria-hidden />
                    </span>
                  )}
                </span>
                <span className={cn("w-full text-center text-[0.75rem] leading-tight break-words", have ? "font-semibold" : "text-haze")}>{nameOf(t, b)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {focused && (
        <p role="status" className="mt-3 rounded-xl bg-fg/[0.05] px-3 py-2 text-[0.8125rem] leading-snug">
          <span className="font-semibold" style={{ color: focused.color }}>
            {nameOf(t, focused)}
          </span>{" "}
          · {full ? t.profile.badgeFull : earned(focused, gotIn, supporter) ? (shown.includes(focused.id) ? t.profile.badgeShown : t.profile.badgeTapToShow) : how(focused)}
        </p>
      )}
    </section>
  );
}
