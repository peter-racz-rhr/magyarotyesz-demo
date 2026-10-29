"use client";

import { Crown, Leaf, ShieldCheck, Star } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { buzz } from "@/lib/haptics";
import { useT } from "@/lib/i18n";
import { useGotIn } from "@/lib/rank";
import { useSettings } from "@/lib/settings";
import { LEVEL_STEPS, levelFor } from "@/lib/toilets";

/*
  The rank-up moment: when enough people have got in with your codes to reach the next rank, the whole
  screen lights up in that rank's colour: a glow blooms, rings spread, sparks fly, the badge drops in with a
  bounce, the old rank name slides out and the new one in, and a bar fills toward the next goal, so the
  next rank is already in sight. It plays once per rank, on any page. Preview: add ?rankup=1 (or 2, 3) to a
  page's address. Reduced motion, or "Celebration animation" off, gets a calm fade.
*/

const KEY = "magyarotyesz:rank-seen";
const RANKS: { icon: ReactNode; color: string }[] = [
  { icon: <Leaf className="size-12" strokeWidth={1.75} />, color: "#9aa3ad" },
  { icon: <Star className="size-12" strokeWidth={1.75} />, color: "#4fe08a" },
  { icon: <ShieldCheck className="size-12" strokeWidth={1.75} />, color: "#5db4f0" },
  { icon: <Crown className="size-12" strokeWidth={1.75} />, color: "#ffc247" },
];
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

  useEffect(() => {
    const preview = Number(new URLSearchParams(window.location.search).get("rankup"));
    if (preview >= 1 && preview < LEVEL_STEPS.length) {
      queueMicrotask(() => setShown(preview));
      return;
    }
    const index = levelFor(gotIn).index;
    const seen = read();
    // First run: remember where you are without celebrating the past. Lower (places removed): just remember.
    if (seen === null || index < seen) write(index);
    else if (index > seen) {
      write(index);
      queueMicrotask(() => setShown(index));
    }
  }, [gotIn]);

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
      {!calm && (
        <>
          <motion.div
            aria-hidden
            className="absolute size-[34rem] rounded-full"
            style={{ background: `radial-gradient(closest-side, ${rank.color}66, transparent)` }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.15, 1], opacity: [0, 1, 0.75] }}
            transition={{ duration: 1.4, ease: EASE }}
          />
          {[0, 0.22, 0.44].map((delay) => (
            <motion.span
              key={delay}
              aria-hidden
              className="absolute size-40 rounded-full border-2"
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
              className="absolute rounded-[2px]"
              style={{ width: s.size, height: s.size * 1.6, background: i % 4 === 0 ? "#fff" : rank.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.4, rotate: 0 }}
              animate={{ x: s.x, y: s.y + 90, opacity: [1, 1, 0], scale: 1, rotate: s.spin }}
              transition={{ duration: 1.5, delay: 0.45 + s.delay, ease: EASE }}
            />
          ))}
        </>
      )}

      <div className="relative flex w-full max-w-xs flex-col items-center text-center" onClick={(e) => e.stopPropagation()}>
        <motion.p
          className="text-[0.8125rem] font-bold tracking-[0.4em] uppercase"
          style={{ color: rank.color }}
          initial={{ opacity: 0, y: calm ? 0 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: calm ? 0 : 0.15, duration: 0.4 }}
        >
          {t.rank.title}
        </motion.p>

        <motion.div
          className="mt-5 grid size-32 place-items-center rounded-full"
          style={{ background: `radial-gradient(circle at 35% 30%, ${rank.color}55, ${rank.color}18)`, boxShadow: `0 0 0 2px ${rank.color}, 0 0 60px 8px ${rank.color}66`, color: rank.color }}
          initial={{ scale: calm ? 1 : 0, rotate: calm ? 0 : -25, opacity: calm ? 0 : 1 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={calm ? { duration: 0.3 } : { type: "spring", stiffness: 260, damping: 13, delay: 0.25 }}
        >
          {rank.icon}
        </motion.div>

        <div className="relative mt-6 h-12 w-full overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={word ? "new" : "old"}
              className="absolute inset-0 text-[2.25rem] leading-none font-extrabold tracking-tight"
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
    </motion.div>
  );
}
