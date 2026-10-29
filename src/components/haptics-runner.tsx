"use client";

import { useEffect } from "react";
import { buzz } from "@/lib/haptics";

const TAPPABLE = 'button, a[href], summary, [role="button"], [role="switch"], [role="radio"], [role="tab"], [role="checkbox"], [role="menuitem"]';

/** One small buzz for every tap on a button, link or switch (when Settings > Vibration is on). Renders nothing. */
export function HapticsRunner() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target.closest<HTMLElement>(TAPPABLE) : null;
      if (!target || target.matches(":disabled, [aria-disabled='true']")) return;
      // Not for the map itself, only for buttons on top of it; a click without a finger (keyboard) is fine too.
      buzz("tap");
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
