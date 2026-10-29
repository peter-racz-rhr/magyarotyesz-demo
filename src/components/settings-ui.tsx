"use client";

import { ChevronRight, User } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AVATAR_HUES } from "@/lib/profile";
import { cn } from "@/lib/utils";

/*
  Grouped lists in the style of the phone's own Settings: one rounded block
  per group, one-line rows of a fixed height, a small coloured icon at the
  start, dividers that begin after the icon, and any explanation kept in a
  quiet footnote under the group instead of inside the rows.
*/

export const CARD = "overflow-hidden rounded-[22px] bg-fg/[0.055]";
/** Every row is the same height, so a list reads as a list. */
export const ROW = "flex min-h-[3.25rem] w-full items-center gap-3.5 px-4 py-2.5 text-left text-[1rem] transition-colors duration-200 active:bg-fg/[0.09] active:duration-0";
/** The divider starts under the text, not under the icon. */
const DIVIDE = "[&>li+li]:relative [&>li+li]:before:absolute [&>li+li]:before:top-0 [&>li+li]:before:right-0 [&>li+li]:before:left-[3.875rem] [&>li+li]:before:h-px [&>li+li]:before:bg-fg/[0.07]";

/** A group: a small heading, the block of rows, and an optional footnote. */
export function Group({
  id,
  title,
  footer,
  tone,
  action,
  badge,
  children,
  plain = false,
}: {
  id: string;
  title?: string;
  footer?: ReactNode;
  tone?: "warn";
  action?: ReactNode;
  badge?: number;
  children: ReactNode;
  /** For lists whose rows have no leading icon: the divider starts at the edge. */
  plain?: boolean;
}) {
  return (
    <section aria-labelledby={title ? id : undefined} className="mt-8">
      {title && (
        <div className="mb-2 flex items-center gap-2 px-5">
          <h2 id={id} className="text-[0.9375rem] font-semibold text-haze">
            {title}
          </h2>
          {badge ? <span className="grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-brand px-1 text-[0.6875rem] font-bold text-night">{badge}</span> : null}
          <span className="flex-1" />
          {action}
        </div>
      )}
      <ul className={cn(CARD, plain ? "[&>li+li]:border-t [&>li+li]:border-fg/[0.07]" : DIVIDE)}>{children}</ul>
      {footer && <p className={cn("mt-2 px-5 text-[0.8125rem] leading-relaxed", tone === "warn" ? "text-stale" : "text-haze")}>{footer}</p>}
    </section>
  );
}

/** Kept for the Profile page's own headings. */
export function Heading({ id, children, badge, action }: { id: string; children: ReactNode; badge?: number; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 px-5">
      <h2 id={id} className="text-[0.9375rem] font-semibold text-haze">
        {children}
      </h2>
      {badge ? <span className="grid h-[1.125rem] min-w-[1.125rem] place-items-center rounded-full bg-brand px-1 text-[0.6875rem] font-bold text-night">{badge}</span> : null}
      <span className="flex-1" />
      {action}
    </div>
  );
}

/** The small coloured square with a white glyph that starts a row. */
export function Tile({ children, hue = 220, tone }: { children: ReactNode; hue?: number; tone?: "bad" | "grey" }) {
  const bg = tone === "bad" ? "hsl(2 66% 50%)" : tone === "grey" ? "hsl(220 8% 38%)" : `hsl(${hue} 58% 46%)`;
  return (
    <span aria-hidden className="grid size-[1.875rem] shrink-0 place-items-center rounded-[8px] text-white [&>svg]:size-[1.125rem] [&>svg]:stroke-[1.9]" style={{ background: bg }}>
      {children}
    </span>
  );
}

/** A row with an on/off switch. */
export function SwitchRow({ icon, hue, title, on, onChange }: { icon: ReactNode; hue?: number; title: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <li>
      <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={ROW}>
        <Tile hue={hue}>{icon}</Tile>
        <span className="min-w-0 flex-1 break-words">{title}</span>
        <span className={cn("relative h-[1.75rem] w-[3rem] shrink-0 rounded-full transition-colors duration-200", on ? "bg-brand" : "bg-fg/[0.16]")}>
          <span className={cn("absolute top-[0.125rem] left-[0.125rem] size-[1.5rem] rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.4)] transition-transform duration-200", on && "translate-x-[1.25rem]")} />
        </span>
      </button>
    </li>
  );
}

/** A row that goes somewhere (or does something); `value` is a short answer on the right. */
export function LinkRow({
  icon,
  hue,
  tone,
  title,
  value,
  onClick,
  href,
  chevron = true,
  danger = false,
}: {
  icon: ReactNode;
  hue?: number;
  tone?: "bad" | "grey";
  title: string;
  value?: string;
  onClick?: () => void;
  href?: string;
  chevron?: boolean;
  danger?: boolean;
}) {
  const inner = (
    <>
      <Tile hue={hue} tone={tone}>
        {icon}
      </Tile>
      <span className={cn("min-w-0 flex-1 break-words", danger && "text-bad")}>{title}</span>
      {value && <span className="max-w-[40%] text-[0.9375rem] text-haze">{value}</span>}
      {chevron && <ChevronRight className="-mr-1 size-[1.125rem] shrink-0 text-fg/25" aria-hidden />}
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className={ROW}>
          {inner}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={ROW}>
          {inner}
        </button>
      )}
    </li>
  );
}

/** Your circle: your photo, or the first letter of your name on your colour, or a person. */
export function Avatar({ name, hue = 0, size = 64, photo }: { name: string; hue?: number; size?: number; photo?: string }) {
  const h = AVATAR_HUES[((hue % AVATAR_HUES.length) + AVATAR_HUES.length) % AVATAR_HUES.length]!;
  const letter = name.trim().slice(0, 1).toUpperCase();
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a small picture kept on this phone as a data address
      <img src={photo} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover select-none" style={{ width: size, height: size, boxShadow: "0 0 0 1px rgb(255 255 255 / 0.1)" }} draggable={false} />
    );
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-semibold text-night select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(150deg, hsl(${h} 70% 70%), hsl(${h} 60% 46%))`,
        boxShadow: "0 0 0 1px rgb(255 255 255 / 0.12)",
      }}
    >
      {letter || <User strokeWidth={1.75} style={{ width: size * 0.5, height: size * 0.5 }} />}
    </span>
  );
}
