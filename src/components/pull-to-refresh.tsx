"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { syncNow } from "@/lib/sync";
import { cn } from "@/lib/utils";

/*
  Pull down to refresh, like any other app. A small round spinner slides in
  from the top as you pull; let go past the mark and it refreshes everything:
  the shared toilets, your alerts, and (if location is on) where you are.

  On the lists and the profile you pull from the top of the page. The map
  would pan instead, so there the pull starts on the filter bar at the top.
*/

/** Anything that wants to refresh itself too (like the position) listens for this. */
export const REFRESH_EVENT = "magyarotyesz:refresh";

const TRIGGER = 56;
const MAX = 96;

export function PullToRefresh() {
  const { t } = useT();
  const pathname = usePathname();
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const state = useRef({ startY: 0, startX: 0, active: false, pulling: false, pull: 0, busy: false });
  const onMap = pathname === "/map";

  useEffect(() => {
    const s = state.current;
    const eligible = (target: EventTarget | null) => {
      if (s.busy) return false;
      const el = target instanceof Element ? target : null;
      if (el?.closest("[data-pull-zone]")) return true;
      return !onMap && window.scrollY <= 0;
    };

    const start = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (event.touches.length !== 1 || !touch || !eligible(event.target)) return;
      Object.assign(s, { startY: touch.clientY, startX: touch.clientX, active: true, pulling: false });
    };

    const move = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!s.active || !touch) return;
      const dy = touch.clientY - s.startY;
      const dx = touch.clientX - s.startX;
      if (!s.pulling) {
        // Wait until it is clearly a downward pull, not a tap, a sideways swipe or a scroll up.
        if (dy < 10 || Math.abs(dx) > dy) {
          if (dy < -6 || Math.abs(dx) > 14) s.active = false;
          return;
        }
        s.pulling = true;
      }
      if (event.cancelable) event.preventDefault();
      // It gets heavier the further you pull.
      s.pull = Math.min(MAX, dy * 0.55);
      setPull(s.pull);
    };

    const end = async () => {
      if (!s.active) return;
      const done = s.pull >= TRIGGER;
      Object.assign(s, { active: false, pulling: false, pull: 0 });
      if (!done) return setPull(0);
      s.busy = true;
      setBusy(true);
      setPull(0);
      const started = Date.now();
      window.dispatchEvent(new Event(REFRESH_EVENT));
      try {
        await syncNow();
      } catch {
        // Offline: the spinner just ends, the status pill in Profile says why.
      }
      // Long enough to be seen even when there is nothing to fetch.
      await new Promise((resolve) => window.setTimeout(resolve, Math.max(0, 800 - (Date.now() - started))));
      s.busy = false;
      setBusy(false);
    };

    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
    window.addEventListener("touchcancel", end);
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    };
  }, [onMap]);

  const shown = busy || pull > 4;
  const ready = pull >= TRIGGER;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <span className="sr-only">{busy ? t.refresh.refreshing : ""}</span>
      <div
        aria-hidden
        className={cn(
          "mt-2 grid size-10 place-items-center rounded-full border border-fg/10 bg-night/85 text-brand shadow-[0_6px_20px_rgb(0_0_0/0.5)] backdrop-blur-md",
          pull === 0 && "transition-[transform,opacity] duration-300",
        )}
        style={{
          transform: `translateY(${busy ? 14 : Math.max(-56, pull - 56)}px) scale(${busy ? 1 : 0.6 + Math.min(pull / TRIGGER, 1) * 0.4})`,
          opacity: shown ? 1 : 0,
        }}
      >
        <LoaderCircle
          className={cn("size-5", busy && "animate-spin", ready && !busy && "text-ink")}
          style={busy ? undefined : { transform: `rotate(${pull * 5}deg)` }}
        />
      </div>
    </div>
  );
}
