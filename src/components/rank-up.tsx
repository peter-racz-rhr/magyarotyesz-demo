"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { RANK_BADGES } from "@/lib/badges";
import { buzz } from "@/lib/haptics";
import { useT } from "@/lib/i18n";
import { useGotIn } from "@/lib/rank";
import { useSettings } from "@/lib/settings";
import { LEVEL_STEPS, levelFor } from "@/lib/toilets";

/*
  The rank-up moment: when enough people have got in with your codes to reach the next rank, the whole
  screen lights up in that rank's colour: a glow blooms, rings spread, sparks fly, the badge drops in with a
  bounce, the old rank name slides out and the new one in, and a bar fills toward the next goal, so the
  next rank is already in sight. It plays once per rank, on any page. Preview: add ?rankup=1 (up to 5) to a
  page's address. Reduced motion, or "Celebration animation" off, gets a calm fade.
*/

const KEY = "magyarotyesz:rank-seen";
const PREVIEW_EVENT = "lookey:rankup-preview";
const noSubscribe = () => () => {};

/** Play the rank-up animation for a rank (1-3) without changing anything: the Profile page's preview button. */
export function previewRankUp(index: number) {
  window.dispatchEvent(new CustomEvent(PREVIEW_EVENT, { detail: index }));
}
// The badges themselves live in lib/badges, shared with the Profile's badges section.
const RANKS: { icon: ReactNode; color: string }[] = RANK_BADGES.map(({ Icon, color }) => ({ icon: <Icon className="size-12" strokeWidth={1.75} />, color }));
const EASE = [0.22, 1, 0.36, 1] as const;
// Fixed "random" spread so the sparks look the same every time and render the same on both sides.
const SPARKS = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2 + (i % 3) * 0.17;
  const far = 150 + ((i * 53) % 110);
  return { x: Math.cos(angle) * far, y: Math.sin(angle) * far, size: 5 + ((i * 7) % 6), spin: ((i * 97) % 360) - 180, delay: (i % 7) * 0.025 };
});

function read(): number | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}
function write(index: number) {
  try {
    window.localStorage.setItem(KEY, String(index));
  } catch {
    // Private mode: it may show again next time.
  }
}

export function RankUp() {
  const gotIn = useGotIn();
  const [shown, setShown] = useState<number | null>(null);
  // False while the page hydrates (when stored values aren't read yet), true after.
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);

  useEffect(() => {
    // While the page hydrates the count reads 0 for a moment before the saved one: wait for the real one, or a
    // 0 would be remembered and the rank-up would replay on every start.
    if (!hydrated) return;
    const preview = Number(new URLSearchParams(window.location.search).get("rankup"));
    if (preview >= 1 && preview < LEVEL_STEPS.length) {
      queueMicrotask(() => setShown(preview));
      return;
    }
    const index = levelFor(gotIn).index;
    const seen = read();
    // First run: remember where you are without celebrating the past. Never remember a lower rank (places
    // removed keep the rank you saw).
    if (seen === null) write(index);
    else if (index > seen) {
      write(index);
      queueMicrotask(() => setShown(index));
    }
  }, [gotIn, hydrated]);

  useEffect(() => {
    const play = (e: Event) => {
      const index = (e as CustomEvent<number>).detail;
      if (index >= 1 && index < LEVEL_STEPS.length) setShown(index);
    };
    window.addEventListener(PREVIEW_EVENT, play);
    return () => window.removeEventListener(PREVIEW_EVENT, play);
  }, []);

  return <AnimatePresence>{shown !== null && <Overlay index={shown} gotIn={Math.max(gotIn, LEVEL_STEPS[shown])} onClose={() => setShown(null)} />}</AnimatePresence>;
}

function Overlay({ index, gotIn, onClose }: { index: number; gotIn: number; onClose: () => void }) {
  const { t } = useT();
  const { animations } = useSettings();
  const reducedMotion = useReducedMotion();
  const calm = Boolean(reducedMotion) || !animations;
  const rank = RANKS[index];
  const level = levelFor(gotIn);
  const goal = level.next;
  const progress = goal ? Math.min(1, (gotIn - level.from) / (goal - level.from)) : 1;
  const [word, setWord] = useState(false);

  useEffect(() => {
    buzz("success");
    const a = window.setTimeout(() => buzz("done"), 520);
    const b = window.setTimeout(() => setWord(true), 700);
    return () => (window.clearTimeout(a), window.clearTimeout(b));
  }, []);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${t.rank.title}: ${t.profile.levels[index]}`}
      className="fixed inset-0 z-[90] grid place-items-center overflow-hidden bg-black/80 px-8 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: calm ? 0.2 : 0.35 }}
      onClick={onClose}
    >
      {/* Three rows: the title above, the badge exactly in the middle of the screen, everything else below. */}
      <div className="relative grid h-full w-full max-w-xs grid-rows-[1fr_auto_1fr] justify-items-center text-center">
        <motion.p
          className="mb-5 self-end text-[0.8125rem] font-bold tracking-[0.4em] uppercase"
          style={{ color: rank.color }}
          initial={{ opacity: 0, y: calm ? 0 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: calm ? 0 : 0.15, duration: 0.4 }}
        >
          {t.rank.title}
        </motion.p>
        {/* The glow, rings and sparks start from the badge; they never catch a tap (the glow covers the button). */}
        <div className="relative grid place-items-center">
          {!calm && (
            <>
              <motion.div
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-1/2 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ background: `radial-gradient(closest-side, ${rank.color}66, transparent)` }}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: [0.2, 1.15, 1], opacity: [0, 1, 0.75] }}
                transition={{ duration: 1.4, ease: EASE }}
              />
              {[0, 0.22, 0.44].map((delay) => (
                <motion.span
                  key={delay}
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                  style={{ borderColor: rank.color }}
                  initial={{ scale: 0.4, opacity: 0.9 }}
                  animate={{ scale: 4.2, opacity: 0 }}
                  transition={{ duration: 1.6, delay: 0.3 + delay, ease: EASE }}
                />
              ))}
              {SPARKS.map((s, i) => (
                <motion.span
                  key={i}
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-1/2 rounded-[2px]"
                  style={{ width: s.size, height: s.size * 1.6, background: i % 4 === 0 ? "#fff" : rank.color }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
                  animate={{ x: s.x, y: s.y + 90, opacity: [1, 1, 0], scale: 1, rotate: s.spin }}
                  transition={{ duration: 1.5, delay: 0.45 + s.delay, ease: EASE }}
                />
              ))}
            </>
          )}
          <motion.div
            className="relative grid size-32 place-items-center rounded-full"
            style={{ background: `radial-gradient(circle at 35% 30%, ${rank.color}55, ${rank.color}18)`, boxShadow: `0 0 0 2px ${rank.color}, 0 0 60px 8px ${rank.color}66`, color: rank.color }}
            initial={{ scale: calm ? 1 : 0, rotate: calm ? 0 : -25, opacity: calm ? 0 : 1 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={calm ? { duration: 0.3 } : { type: "spring", stiffness: 260, damping: 13, delay: 0.25 }}
          >
            {rank.icon}
          </motion.div>
        </div>
        <div className="flex w-full flex-col items-center self-start">
          <div className="relative mt-5 h-[1.45em] w-full overflow-hidden text-[clamp(1.5rem,9vw,2.25rem)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={word ? "new" : "old"}
                className="absolute inset-0 leading-[1.45] font-extrabold tracking-tight"
                style={word ? { color: "#fff" } : { color: "rgba(255,255,255,0.45)" }}
                initial={{ y: calm ? 0 : 36, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: calm ? 0 : -36, opacity: 0 }}
                transition={{ duration: calm ? 0.2 : 0.35, ease: EASE }}
              >
                {t.profile.levels[word || index === 0 ? index : index - 1]}
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.p className="mt-3 text-[1rem] leading-snug text-white/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: calm ? 0 : 1.1 }}>
            {t.rank.people(gotIn)}
          </motion.p>

          <motion.div className="mt-6 w-full" initial={{ opacity: 0, y: calm ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: calm ? 0 : 1.3, duration: 0.4 }}>
            <div className="h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label={t.rank.next}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: rank.color }}
                initial={{ width: calm ? `${progress * 100}%` : "0%" }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ delay: calm ? 0 : 1.5, duration: calm ? 0 : 0.9, ease: EASE }}
              />
            </div>
            <p className="mt-2 text-[0.875rem] text-white/60">{goal ? t.profile.levelNext(goal - gotIn, t.profile.levels[index + 1]) : t.profile.levelTop}</p>
          </motion.div>

          <motion.button
            type="button"
            onClick={onClose}
            className="mt-8 h-12 w-full rounded-full bg-white text-[1rem] font-bold text-black active:scale-[0.97]"
            initial={{ opacity: 0, y: calm ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: calm ? 0 : 1.7, duration: 0.4 }}
          >
            {t.rank.cta}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
