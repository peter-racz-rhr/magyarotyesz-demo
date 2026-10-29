"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/*
  Swipe in from the left edge to go back, with the page following your finger: it shrinks,
  rounds its corners and slides away from the edge, like Android's own back preview. Let go
  past a third of the way (or with a quick flick) and it goes back; otherwise it springs back.
  Only on the pages you reached by going deeper: the three main pages are the top level.
*/
const TOP_LEVEL = new Set(["/", "/map", "/nearby", "/profile", "/welcome"]);
const EDGE = 32;
const COMMIT = 0.33;

export function BackSwipe() {
  const path = usePathname();

  useEffect(() => {
    if (TOP_LEVEL.has(path)) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const body = document.body;
    const root = document.documentElement;
    let start: { x: number; y: number; t: number } | null = null;
    let dragging = false;

    const clear = () => {
      body.style.transition = "";
      body.style.transform = "";
      body.style.borderRadius = "";
      body.style.opacity = "";
      body.style.overflow = "";
      body.style.transformOrigin = "";
      root.style.removeProperty("background-color");
    };
    const pose = (p: number) => {
      body.style.transform = `translateX(${p * 28}px) scale(${1 - p * 0.1})`;
      body.style.borderRadius = `${p * 30}px`;
      body.style.overflow = "hidden";
      // Shrink around the middle of what is on screen, not of the whole (taller) page.
      body.style.transformOrigin = `50% ${window.scrollY + window.innerHeight / 2}px`;
      root.style.backgroundColor = "#000";
    };

    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (e.touches.length !== 1 || touch.clientX > EDGE || window.history.length < 2) return;
      start = { x: touch.clientX, y: touch.clientY, t: performance.now() };
      dragging = false;
      body.style.transition = "none";
    };
    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const touch = e.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (!dragging) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) { start = null; clear(); return; }
        if (dx < 8) return;
        dragging = true;
      }
      if (e.cancelable) e.preventDefault();
      if (!reduce) pose(Math.min(1, Math.max(0, dx / (window.innerWidth * 0.6))));
    };
    const onEnd = (e: TouchEvent) => {
      if (!start) return;
      const dx = (e.changedTouches[0]?.clientX ?? start.x) - start.x;
      const speed = dx / Math.max(1, performance.now() - start.t);
      const go = dragging && (dx > window.innerWidth * COMMIT || (speed > 0.6 && dx > 40));
      start = null;
      if (!dragging) { clear(); return; }
      dragging = false;
      if (go) {
        if (reduce) { clear(); window.history.back(); return; }
        body.style.transition = "transform 160ms ease-in, opacity 160ms ease-in";
        pose(1);
        body.style.opacity = "0";
        window.setTimeout(() => {
          window.history.back();
          window.setTimeout(clear, 60);
        }, 150);
      } else {
        body.style.transition = "transform 240ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 240ms";
        pose(0);
        window.setTimeout(clear, 260);
      }
    };
    const onCancel = () => {
      if (!start) return;
      start = null;
      dragging = false;
      clear();
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onCancel);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onCancel);
      clear();
    };
  }, [path]);

  return null;
}
