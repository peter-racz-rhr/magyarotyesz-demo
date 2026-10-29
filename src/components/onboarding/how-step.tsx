"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Eye, MapPin, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "@/components/onboarding/action-button";
import { Wordmark } from "@/components/wordmark";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
  Three small pictures that show the whole app in ten seconds: find a green dot on the map, tap to
  show the code, tell the next person it worked. Each one plays again when you swipe or tap to it.
*/

const ROADS = ["M-10 70 L330 40", "M-10 150 L330 190", "M110 -10 L150 260", "M230 -10 L200 260"];

function MiniMap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-60 w-full overflow-hidden rounded-[1.75rem] bg-fg/[0.06]">
      <svg aria-hidden viewBox="0 0 320 240" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        {ROADS.map((d) => (
          <path key={d} d={d} stroke="currentColor" className="text-fg/[0.12]" strokeWidth="10" strokeLinecap="round" fill="none" />
        ))}
      </svg>
      {children}
    </div>
  );
}

const Dot = ({ x, y, className }: { x: string; y: string; className?: string }) => (
  <span aria-hidden className={cn("absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-good shadow-[0_0_0_3px_var(--night)]", className)} style={{ left: x, top: y }} />
);

function FindPicture({ reduce }: { reduce: boolean | null }) {
  const { t } = useT();
  return (
    <MiniMap>
      <Dot x="22%" y="30%" />
      <Dot x="80%" y="26%" />
      <Dot x="84%" y="76%" />
      {/* the nearest one: a ring, a dashed way there, and how long it takes */}
      <motion.span
        aria-hidden
        className="absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-good"
        style={{ left: "58%", top: "62%" }}
        animate={reduce ? undefined : { scale: [0.7, 1.25, 0.7], opacity: [0.9, 0.2, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
      <Dot x="58%" y="62%" className="size-4" />
      <svg aria-hidden viewBox="0 0 320 240" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        <motion.path
          d="M96 172 C130 160 150 150 186 150"
          stroke="var(--brand)"
          strokeWidth="3"
          strokeDasharray="2 7"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, delay: 0.3 }}
        />
      </svg>
      <span aria-hidden className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#1a6fe6] shadow-[0_0_0_6px_rgb(26_111_230/0.28)]" style={{ left: "30%", top: "72%" }} />
      <motion.span
        className="absolute rounded-full bg-ink px-3 py-1 text-xs font-bold text-night"
        style={{ left: "38%", top: "48%" }}
        initial={{ opacity: reduce ? 1 : 0, y: reduce ? 0 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.4 }}
      >
        {t.card.walk(4)}
      </motion.span>
    </MiniMap>
  );
}

function CodePicture({ reduce }: { reduce: boolean | null }) {
  const { t } = useT();
  const [shown, setShown] = useState(!!reduce);
  return (
    <div className="flex h-60 w-full flex-col justify-center gap-3 rounded-[1.75rem] bg-fg/[0.06] p-5">
      <p className="text-[1.0625rem] font-semibold">Café Gerlóczy</p>
      <motion.button
        type="button"
        onClick={() => setShown((s) => !s)}
        onAnimationComplete={() => setShown(true)}
        animate={{ scale: reduce ? 1 : [1, 1, 0.96, 1] }}
        transition={{ duration: 1.4, times: [0, 0.6, 0.8, 1] }}
        className="flex h-16 items-center justify-center rounded-2xl border border-good/40 bg-good/[0.07]"
      >
        <AnimatePresence mode="wait" initial={false}>
          {shown ? (
            <motion.span key="c" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-mono text-[1.75rem] font-bold tracking-[0.1em]">
              4821#
            </motion.span>
          ) : (
            <motion.span key="h" exit={{ opacity: 0 }} className="inline-flex items-center gap-2 text-base font-semibold">
              <Eye className="size-5 text-good" aria-hidden /> {t.card.tapToShow}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <p className="text-xs text-haze">{t.card.votes(14, 1)}</p>
    </div>
  );
}

function PassItOnPicture({ reduce }: { reduce: boolean | null }) {
  const { t } = useT();
  return (
    <MiniMap>
      <Dot x="24%" y="34%" />
      <Dot x="78%" y="30%" />
      {/* a new pin drops where you tapped */}
      <motion.span
        aria-hidden
        className="absolute -translate-x-1/2 -translate-y-full text-brand"
        style={{ left: "52%", top: "58%" }}
        initial={{ y: reduce ? 0 : -60, opacity: reduce ? 1 : 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.3 }}
      >
        <MapPin className="size-10 fill-current text-brand" strokeWidth={1.4} />
      </motion.span>
      <motion.span
        className="absolute inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-night"
        style={{ left: "50%", bottom: "1.1rem", translateX: "-50%" }}
        initial={{ opacity: reduce ? 1 : 0, scale: reduce ? 1 : 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 300, damping: 18 }}
      >
        <ThumbsUp className="size-4" aria-hidden /> {t.check.yes}
      </motion.span>
    </MiniMap>
  );
}

export function HowStep({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const slides = t.welcome.how.slides;
  const last = index === slides.length - 1;
  const pictures = [FindPicture, CodePicture, PassItOnPicture];
  const Picture = pictures[index];

  return (
    <div className="flex h-full flex-col px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <div className="flex h-12 items-center">
        <Wordmark className="text-[1.375rem] font-bold tracking-[-0.04em]" />
        <span className="flex-1" />
        <button type="button" onClick={onDone} className="h-11 rounded-full px-3 text-[0.9375rem] font-semibold text-haze hover:text-ink">
          {t.welcome.skip}
        </button>
      </div>
      <p className="mt-4 text-[0.8125rem] font-semibold tracking-wide text-haze uppercase">{t.welcome.how.title}</p>
      <div className="mt-3" key={index}>
        <Picture reduce={reduce} />
        <h2 className="mt-7 text-[1.75rem] leading-tight font-bold tracking-tight">{slides[index].title}</h2>
        <p className="mt-2 max-w-[32ch] text-[1.0625rem] leading-snug text-haze">{slides[index].body}</p>
      </div>
      <div className="mt-auto">
        <div className="mb-5 flex justify-center gap-2" aria-hidden>
          {slides.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-6 bg-ink" : "w-1.5 bg-fg/25")} />
          ))}
        </div>
        <ActionButton onClick={() => (last ? onDone() : setIndex((i) => i + 1))}>{last ? t.welcome.how.done : t.welcome.how.next}</ActionButton>
      </div>
    </div>
  );
}
