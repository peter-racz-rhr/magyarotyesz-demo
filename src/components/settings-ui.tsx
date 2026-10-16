"use client";

import { ChevronRight, User } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AVATAR_HUES } from "@/lib/profile";
import { cn } from "@/lib/utils";

/* The pieces Profile and Settings share: a card, a heading above it, and rows with a tinted icon. */

export const CARD = "overflow-hidden rounded-2xl border border-dusk-edge bg-white/[0.035]";
export const ROW = "flex w-full items-center gap-3.5 px-4 py-3 text-left";

/** A heading above a card; the optional count is for things that need attention. */
export function Heading({ id, children, badge, action }: { id: string; children: ReactNode; badge?: number; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 px-1">
      <h2 id={id} className="t-section">
        {children}
      </h2>
      {badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-good px-1.5 text-xs font-bold text-night">{badge}</span> : null}
      <span className="flex-1" />
      {action}
    </div>
  );
}

/** The icon sits in a small tinted square, so a list of settings can be scanned by shape. */
export function Tile({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[0.625rem]",
        tone === "good" ? "bg-good/15 text-good" : tone === "bad" ? "bg-bad/15 text-bad" : "bg-white/[0.07] text-ink/80",
      )}
    >
      {children}
    </span>
  );
}

/** A settings row with an on/off switch. */
export function SwitchRow({
  icon,
  title,
  sub,
  on,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={ROW}>
      <Tile>{icon}</Tile>
      <span className="min-w-0 flex-1">
        <span className="block leading-snug">{title}</span>
        <span className="block text-[0.8125rem] leading-snug text-haze">{sub}</span>
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-good" : "bg-dusk-edge")}>
        <span className={cn("absolute top-1 left-1 size-5 rounded-full bg-ink shadow transition-transform duration-200", on && "translate-x-5")} />
      </span>
    </button>
  );
}

/** A tappable row that goes somewhere (or does something). */
export function LinkRow({ icon, title, sub, onClick, href, chevron = true }: { icon: ReactNode; title: string; sub?: string; onClick?: () => void; href?: string; chevron?: boolean }) {
  const inner = (
    <>
      <Tile>{icon}</Tile>
      <span className="min-w-0 flex-1">
        <span className="block leading-snug">{title}</span>
        {sub && <span className="block text-[0.8125rem] leading-snug text-haze">{sub}</span>}
      </span>
      {chevron && <ChevronRight className="size-5 shrink-0 text-haze" aria-hidden />}
    </>
  );
  return href ? (
    <Link href={href} className={ROW}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={ROW}>
      {inner}
    </button>
  );
}

/** Your circle: the first letter of your name on your colour, or a person if you haven't picked a name. */
export function Avatar({ name, hue = 0, size = 64 }: { name: string; hue?: number; size?: number }) {
  const h = AVATAR_HUES[((hue % AVATAR_HUES.length) + AVATAR_HUES.length) % AVATAR_HUES.length]!;
  const letter = name.trim().slice(0, 1).toUpperCase();
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-bold text-night select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(145deg, hsl(${h} 70% 68%), hsl(${h} 62% 48%))`,
        boxShadow: `0 0 0 3px hsl(${h} 70% 60% / 0.18)`,
      }}
    >
      {letter || <User style={{ width: size * 0.5, height: size * 0.5 }} />}
    </span>
  );
}
