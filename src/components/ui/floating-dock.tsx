"use client";
/**
 * Aceternity UI Floating Dock, adapted for this app:
 * - the magnifying dock is used on phones too, driven by pointer events so
 *   it follows a dragging thumb as well as a mouse;
 * - items are Next links with an active state for the current tab.
 * Original: https://ui.aceternity.com/components/floating-dock
 **/

import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export type DockItem = {
  title: string;
  icon: React.ReactNode;
  href: string;
  /** Passed to the link so pages can animate in the right direction. */
  transitionTypes?: string[];
  /** Unread count: shows a small green dot on the icon. */
  badge?: number;
};

/** Further than this (px) and a press counts as a slide, not a tap. */
const SLIDE_PX = 10;

export const FloatingDock = ({
  items,
  activeHref,
  className,
}: {
  items: DockItem[];
  activeHref?: string;
  className?: string;
}) => {
  const router = useRouter();
  const nav = useRef<HTMLElement>(null);
  const pointerX = useMotionValue(Infinity);
  const drag = useRef<{ startX: number; moved: boolean } | null>(null);
  const swallowClick = useRef(false);
  // The tab the lit disc sits on while a finger is sliding along the dock.
  const [sliding, setSliding] = useState<number | null>(null);
  // Mirrors `sliding` so a release in the same frame as the last move still sees it.
  const slidingNow = useRef<number | null>(null);
  const slideTo = (index: number | null) => {
    slidingNow.current = index;
    setSliding(index);
  };

  const activeIndex = items.findIndex((item) => item.href === activeHref);

  /** Which tab is closest to this x position. */
  const nearest = (x: number) => {
    const cells = nav.current?.querySelectorAll<HTMLElement>("[data-dock-item]") ?? [];
    let best = 0;
    let bestGap = Infinity;
    cells.forEach((cell, index) => {
      const box = cell.getBoundingClientRect();
      const gap = Math.abs(x - (box.left + box.width / 2));
      if (gap < bestGap) {
        best = index;
        bestGap = gap;
      }
    });
    return best;
  };

  const release = () => pointerX.set(Infinity);

  const finish = (commit: boolean) => {
    const slid = drag.current?.moved ?? false;
    drag.current = null;
    release();
    if (!slid) return;
    // The click that follows a slide must not also open whatever is under the finger.
    swallowClick.current = true;
    window.setTimeout(() => (swallowClick.current = false), 0);
    const target = slidingNow.current !== null ? items[slidingNow.current] : undefined;
    slideTo(null);
    if (commit && target && target.href !== activeHref) {
      router.push(target.href, { transitionTypes: target.transitionTypes });
    }
  };

  return (
    <motion.nav
      ref={nav}
      aria-label="Main"
      onPointerDown={(e) => {
        drag.current = { startX: e.clientX, moved: false };
      }}
      onPointerMove={(e) => {
        pointerX.set(e.clientX);
        const state = drag.current;
        if (!state || (e.pointerType === "mouse" && e.buttons === 0)) return;
        if (!state.moved && Math.abs(e.clientX - state.startX) < SLIDE_PX) return;
        state.moved = true;
        const index = nearest(e.clientX);
        if (index !== slidingNow.current) {
          slideTo(index);
          if (getSettings().haptics) navigator.vibrate?.(8);
        }
      }}
      onPointerUp={() => finish(true)}
      onPointerCancel={() => finish(false)}
      onPointerLeave={() => {
        if (drag.current) finish(false);
        else release();
      }}
      onClickCapture={(e) => {
        if (!swallowClick.current) return;
        e.preventDefault();
        e.stopPropagation();
      }}
      className={cn(
        "mx-auto flex h-[4.5rem] touch-none items-stretch gap-0.5 rounded-full border border-dusk-edge bg-dusk/85 p-1.5 backdrop-blur-xl",
        className,
      )}
    >
      {items.map((item, index) => (
        <IconContainer
          pointerX={pointerX}
          key={item.title}
          active={item.href === activeHref}
          lit={index === (sliding ?? activeIndex)}
          sliding={sliding !== null}
          {...item}
        />
      ))}
    </motion.nav>
  );
};

const spring = { mass: 0.1, stiffness: 150, damping: 12 };

function IconContainer({
  pointerX,
  title,
  icon,
  href,
  transitionTypes,
  active,
  lit,
  sliding,
  badge,
}: DockItem & {
  pointerX: MotionValue<number>;
  /** The current page. */
  active: boolean;
  /** Where the disc is now: the current page, or the tab under a sliding finger. */
  lit: boolean;
  sliding: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Distance from the finger to the middle of this tab's cell.
  const distance = useTransform(pointerX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const iconSize = useSpring(
    useTransform(distance, [-110, 0, 110], [22, 30, 22]),
    spring,
  );

  const [pressed, setPressed] = useState(false);

  return (
    <Link
      data-dock-item
      href={href}
      transitionTypes={transitionTypes}
      aria-label={badge ? `${title} (${badge})` : title}
      aria-current={active ? "page" : undefined}
      onPointerEnter={() => setPressed(true)}
      onPointerLeave={() => setPressed(false)}
      onPointerUp={() => setPressed(false)}
      className="min-w-0 flex-1 rounded-full outline-offset-[-3px] focus-visible:outline-2"
    >
      <div
        ref={ref}
        data-dock-ink
        data-lit={lit || undefined}
        className={cn(
          "relative flex h-full w-full items-center justify-center rounded-full transition-colors",
          // Outline icons straight on the glass; the current tab gets a soft lit oval.
          lit ? "text-ink" : "text-ink/65",
        )}
      >
        {/* One shared oval that glides to whichever tab is current. It fills the
            tab's whole cell, edge to edge, so no empty strip is left around it. */}
        {lit && (
          <motion.span
            layoutId="dock-active-disc"
            aria-hidden
            className={cn("dock-disc absolute inset-0 rounded-full transition-colors", sliding ? "bg-fg/22" : "bg-fg/14")}
            transition={{ type: "spring", duration: 0.55, bounce: 0.12 }}
          />
        )}
        <AnimatePresence>
          {(pressed || (sliding && lit)) && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className="pointer-events-none absolute -top-9 left-1/2 w-fit rounded-lg border border-dusk-edge bg-dusk px-2.5 py-1 text-xs whitespace-pre text-ink"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: iconSize, height: iconSize }}
          className="relative flex items-center justify-center [&_svg]:size-full"
        >
          {icon}
          {!!badge && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-brand shadow-[0_0_0_2px_var(--dusk),0_0_8px_1px_var(--brand)]"
            />
          )}
        </motion.div>
      </div>
    </Link>
  );
}
