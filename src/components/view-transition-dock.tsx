"use client";

import { useEffect } from "react";

/**
 * While a page slides in, it gets a layer of its own that paints above the
 * rest of the screen, so its text used to show straight through the glass
 * nav bar (a layer above the glass can't be blurred by it). globals.css cuts
 * that layer off at the dock; the old page, though, sits shifted up by how far
 * it was scrolled, so the CSS needs that number: it is written to
 * `--vt-scroll` just before every transition starts.
 */
export function ViewTransitionDock() {
  useEffect(() => {
    const doc = document as Document & { startViewTransition?: (...args: never[]) => ViewTransition };
    const original = doc.startViewTransition;
    if (!original) return;
    const root = document.documentElement;
    doc.startViewTransition = function (this: Document, ...args: never[]) {
      root.style.setProperty("--vt-scroll", `${window.scrollY}px`);
      return original.apply(this, args);
    };
    return () => {
      doc.startViewTransition = original;
      root.style.removeProperty("--vt-scroll");
    };
  }, []);

  return null;
}
