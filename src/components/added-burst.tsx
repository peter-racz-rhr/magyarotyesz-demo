"use client";

import { motion, useReducedMotion } from "motion/react";

/*
  The little reward for sharing a code. It plays on the new dot: two rings
  spread out like a ripple, and a ring of sparks flies outward and fades.
  About a second long, drawn once, and just a fade if the phone asks for
  less motion. The dot itself drops in with a bounce (see DropIn).
*/

const SPARKS = 10;
const EASE = [0.22, 1, 0.36, 1] as const;

export function AddedBurst() {
  const reduced = useReducedMotion();
  if (reduced) {
    return <motion.span aria-hidden className="absolute size-9 rounded-full bg-good/30" initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 0.8 }} />;
  }
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {[0, 0.18].map((delay) => (
        <motion.span
          key={delay}
          className="absolute size-5 rounded-full border-2 border-good"
          initial={{ scale: 0.3, opacity: 0.9 }}
          animate={{ scale: 4.2, opacity: 0 }}
          transition={{ duration: 1, delay: 0.25 + delay, ease: EASE }}
          style={{ opacity: 0 }}
        />
      ))}
      {Array.from({ length: SPARKS }, (_, i) => {
        const angle = (i / SPARKS) * Math.PI * 2 + 0.3;
        const far = i % 2 ? 34 : 24;
        return (
          <motion.span
            key={i}
            className="absolute size-1.5 rounded-full bg-good"
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
            animate={{ x: Math.cos(angle) * far, y: Math.sin(angle) * far, scale: [0.4, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.9, delay: 0.28, ease: EASE }}
          />
        );
      })}
    </span>
  );
}

/** The dot falls in from above and settles with a small squash, like a pin pressed into the map. */
export function DropIn({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.span
      className="grid origin-bottom place-items-center"
      initial={{ y: -46, scale: 1.5, opacity: 0 }}
      animate={{ y: [-46, 0, -7, 0], scaleY: [1.2, 0.7, 1.08, 1], scaleX: [0.9, 1.25, 0.95, 1], scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, times: [0, 0.45, 0.75, 1], ease: "easeOut" }}
    >
      {children}
    </motion.span>
  );
}

/** A green tick that draws itself in the "Added" message. */
export function AddedCheck() {
  const reduced = useReducedMotion();
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0 text-good" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <motion.circle cx="12" cy="12" r="9.5" initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45 }} />
      <motion.path d="M7.5 12.5l3 3 6-6.5" initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.35 }} />
    </svg>
  );
}
