"use client";

import { Check, Copy, Eye, ThumbsDown, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import {
  ACCESS,
  HEALTH,
  KINDS,
  ago,
  confirmCode,
  health,
  replaceCode,
  reportCode,
  type Toilet,
} from "@/lib/toilets";
import { cn } from "@/lib/utils";

/** The coloured dot used on the map and in lists. */
export function HealthDot({ toilet, className }: { toilet: Toilet; className?: string }) {
  const color = HEALTH[health(toilet)].color;
  return (
    <span
      aria-hidden
      className={cn("block size-2.5 shrink-0 rounded-full", className)}
      style={{ background: color, boxShadow: `0 0 0 2px #000, 0 0 10px 2px color-mix(in srgb, ${color} 55%, transparent)` }}
    />
  );
}

/**
 * Everything about one toilet: the code (hidden until you tap, so it isn't
 * on show to everyone around you), when it last worked, and the two buttons
 * that keep it honest.
 */
export function ToiletCard({
  toilet,
  className,
  inList = false,
}: {
  toilet: Toilet;
  className?: string;
  /** In a list the row already shows the name and kind. */
  inList?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [voted, setVoted] = useState<"works" | "broken" | null>(null);
  const [newCode, setNewCode] = useState("");
  const state = health(toilet);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toilet.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the code is on screen anyway.
    }
  };

  const works = () => {
    confirmCode(toilet.id);
    setVoted("works");
  };
  const broken = () => {
    reportCode(toilet.id);
    setVoted("broken");
  };
  const saveNewCode = (event: FormEvent) => {
    event.preventDefault();
    if (!newCode.trim()) return;
    replaceCode(toilet.id, newCode.trim());
    setNewCode("");
    setVoted("works");
    setShown(true);
  };

  return (
    <div className={cn("text-left", className)}>
      {inList ? (
        <p className="text-sm text-haze">{ACCESS[toilet.access]}</p>
      ) : (
        <>
          <p className="font-semibold leading-tight">{toilet.name}</p>
          <p className="mt-0.5 text-sm text-haze">
            {KINDS[toilet.kind]} · {ACCESS[toilet.access]}
          </p>
        </>
      )}

      {/* The code */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide the code" : "Show the code"}
          className="relative flex h-14 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-dusk-edge bg-night px-4"
        >
          <AnimatePresence mode="wait" initial={false}>
            {shown ? (
              <motion.span
                key="code"
                initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="truncate font-mono text-[1.625rem] font-semibold tracking-[0.18em] tabular-nums"
              >
                {toilet.code}
              </motion.span>
            ) : (
              <motion.span
                key="hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-2 text-[0.9375rem] font-semibold text-haze"
              >
                <Eye className="size-4" aria-hidden /> Tap to show code
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        {shown && (
          <button
            type="button"
            onClick={copy}
            aria-label="Copy the code"
            className="grid size-14 shrink-0 place-items-center rounded-2xl border border-dusk-edge bg-night text-haze active:scale-95 transition-transform"
          >
            {copied ? <Check className="size-5 text-good" /> : <Copy className="size-5" />}
          </button>
        )}
      </div>

      <p className={cn("mt-2 flex items-center gap-2 text-sm", HEALTH[state].text)}>
        <HealthDot toilet={toilet} className="size-2" />
        {state === "bad"
          ? `Reported not working ${ago(toilet.reportedAt!)}`
          : `Worked ${ago(toilet.confirmedAt)}`}
      </p>

      {/* Keep it honest */}
      {voted === null ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={works}
            className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 bg-good/15 text-[0.875rem] font-semibold text-good active:scale-[0.97] transition-transform"
          >
            <ThumbsUp className="size-4" aria-hidden /> Still works
          </button>
          <button
            type="button"
            onClick={broken}
            className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 bg-bad/15 text-[0.875rem] font-semibold text-bad active:scale-[0.97] transition-transform"
          >
            <ThumbsDown className="size-4" aria-hidden /> Doesn&apos;t work
          </button>
        </div>
      ) : voted === "works" ? (
        <p className="mt-3 text-sm text-haze">Thanks, that helps the next person.</p>
      ) : (
        <form onSubmit={saveNewCode} className="mt-3">
          <p className="text-sm text-haze">Thanks. Know the new code?</p>
          <div className="mt-2 flex gap-2">
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="New code"
              inputMode="text"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 rounded-full border border-dusk-edge bg-night px-4 font-mono tracking-[0.12em] outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-haze/60 focus:border-good"
            />
            <button
              type="submit"
              disabled={!newCode.trim()}
              className="h-11 shrink-0 rounded-full bg-ink px-5 text-[0.9375rem] font-semibold text-night disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {toilet.note && <p className="mt-3 text-sm text-haze">{toilet.note}</p>}
    </div>
  );
}
