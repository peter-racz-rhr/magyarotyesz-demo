"use client";

import { useEffect } from "react";

type Update = (() => void | Promise<void>) | null | undefined;

/**
 * While a page slides in, the browser gives it a layer of its own that paints
 * above the rest of the screen, and glass can't blur a layer that sits above
 * it: the page's text showed straight through the nav bar and the search bar.
 *
 * - `data-vt` is on the whole time a transition runs; the search bar uses it
 *   to get a solid backing for those moments (globals.css).
 * - `data-vt-new` goes on once the new page is in place. Only then does the
 *   dock get a layer of its own: a layer that exists only in the new state is
 *   stacked above the new page's, which keeps the dock on top.
 */
export function ViewTransitionDock() {
  useEffect(() => {
    const doc = document as Document & { startViewTransition?: (...args: never[]) => ViewTransition };
    const original = doc.startViewTransition;
    if (!original) return;
    const root = document.documentElement;
    let running = 0;

    const wrap = (update: Update) => async () => {
      try {
        await update?.();
      } finally {
        root.dataset.vtNew = "";
      }
    };
    const end = () => {
      running = Math.max(0, running - 1);
      if (running > 0) return;
      delete root.dataset.vt;
      delete root.dataset.vtNew;
    };

    doc.startViewTransition = function (this: Document, ...args: never[]) {
      running += 1;
      root.dataset.vt = "";
      const first = args[0] as unknown;
      let next: unknown[] = args;
      if (typeof first === "function") next = [wrap(first as Update), ...args.slice(1)];
      else if (first && typeof first === "object") next = [{ ...(first as object), update: wrap((first as { update?: Update }).update) }];
      const transition = original.apply(this, next as never[]);
      transition.finished.then(end, end);
      return transition;
    };
    return () => {
      doc.startViewTransition = original;
      delete root.dataset.vt;
      delete root.dataset.vtNew;
    };
  }, []);

  return null;
}
