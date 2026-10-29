"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { DockItem } from "@/components/ui/floating-dock";
import { LiquidSurface } from "@/components/ui/liquid-surface";
import { cn } from "@/lib/utils";

/*
  The orb: one round button; tapping it fans the three pages out by your thumb.
  Picked in Settings; it shares the glass and the dark colours of the bar
  (globals.css).
*/

type Item = DockItem & { active: boolean };

const SAFE_BOTTOM = "pb-[max(env(safe-area-inset-bottom),0.75rem)]";

/** A round button for one page. The page you are on has a soft disc behind its icon. */
function NavLink({ item, onGo }: { item: Item; onGo?: () => void }) {
  return (
    <Link
      href={item.href}
      transitionTypes={item.transitionTypes}
      aria-label={item.badge ? `${item.title} (${item.badge})` : item.title}
      aria-current={item.active ? "page" : undefined}
      onClick={onGo}
      data-dock-ink
      data-lit={item.active || undefined}
      className={cn(
        "relative grid size-full place-items-center rounded-full outline-offset-[-3px] focus-visible:outline-2",
        item.active ? "text-ink" : "text-ink/65",
      )}
    >
      {item.active && <span aria-hidden className="dock-disc absolute inset-1 rounded-full bg-fg/14" />}
      <span className="relative size-6 [&_svg]:size-full">{item.icon}</span>
      {!!item.badge && (
        <span aria-hidden className="absolute top-2 right-2 size-2.5 rounded-full bg-brand shadow-[0_0_0_2px_var(--dusk),0_0_8px_1px_var(--brand)]" />
      )}
    </Link>
  );
}

/** The map's own controls dock here (see the map page); each style says where. */
const Accessory = ({ className }: { className: string }) => <div id="dock-accessory" className={cn("pointer-events-auto absolute", className)} />;

const FAN: [number, number][] = [
  [-100, 0],
  [-71, -71],
  [0, -100],
];

export function NavOrb({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const current = items.find((i) => i.active) ?? items[0];
  const unread = items.some((i) => !!i.badge);

  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  return (
    <div
      data-nav-open={open || undefined}
      className={cn("app-dock pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end pr-5 transition-[translate,opacity,visibility] duration-300 ease-out", SAFE_BOTTOM)}
    >
      {open && <button type="button" aria-label="Close" tabIndex={-1} onClick={() => setOpen(false)} className="pointer-events-auto fixed inset-0 -z-10 cursor-default" />}
      <div className="relative size-14">
        <Accessory className="right-0 bottom-full mb-3 transition-opacity duration-200 [[data-nav-open]_&]:pointer-events-none [[data-nav-open]_&]:opacity-0" />
        {items.map((item, i) => (
          <LiquidSurface
            key={item.href}
            radius={999}
            inert={!open}
            className="absolute inset-0 transition-[translate,scale,opacity] duration-300 ease-[cubic-bezier(.3,1.35,.5,1)]"
            style={{ translate: open ? `${FAN[i][0]}px ${FAN[i][1]}px` : "0 0", scale: open ? 1 : 0.5, opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
          >
            <NavLink item={item} onGo={() => setOpen(false)} />
          </LiquidSurface>
        ))}
        <LiquidSurface radius={999} className="pointer-events-auto absolute inset-0">
          <button
            type="button"
            aria-expanded={open}
            aria-label={current.title}
            onClick={() => setOpen((v) => !v)}
            data-dock-ink
            data-lit
            className="relative grid size-full place-items-center rounded-full text-ink"
          >
            <span className={cn("absolute size-6 transition-[opacity,rotate,scale] duration-200 [&_svg]:size-full", open ? "rotate-90 scale-75 opacity-0" : "opacity-100")}>{current.icon}</span>
            <X aria-hidden className={cn("absolute size-6 transition-[opacity,rotate,scale] duration-200", open ? "opacity-100" : "-rotate-90 scale-75 opacity-0")} strokeWidth={1.75} />
            {unread && !open && <span aria-hidden className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-brand shadow-[0_0_0_2px_var(--dusk),0_0_8px_1px_var(--brand)]" />}
          </button>
        </LiquidSurface>
      </div>
    </div>
  );
}
