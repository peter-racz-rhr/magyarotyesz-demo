"use client";

import { Check, Copy, Eye, Pencil, ThumbsDown, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent } from "react";
import {
  ACCESS,
  HEALTH,
  KINDS,
  ago,
  confirmCode,
  dismissSuggestion,
  editToilet,
  health,
  reportCode,
  suggestCode,
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

const field =
  "h-11 w-full rounded-full border border-dusk-edge bg-night px-4 outline-none placeholder:text-haze/60 focus:border-good";
const codeField = `${field} font-mono tracking-[0.12em] placeholder:font-sans placeholder:tracking-normal`;
const pill = "h-11 shrink-0 rounded-full px-5 text-[0.9375rem] font-semibold transition-transform active:scale-[0.97]";

/** The person who shared it can change the name, code and note. */
function EditForm({ toilet, onDone }: { toilet: Toilet; onDone: () => void }) {
  const [name, setName] = useState(toilet.name);
  const [code, setCode] = useState(toilet.code);
  const [note, setNote] = useState(toilet.note);
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !code.trim()) return;
    editToilet(toilet.id, { name: name.trim(), code: code.trim(), note: note.trim() });
    onDone();
  };
  return (
    <form onSubmit={save} className="flex flex-col gap-2">
      <input aria-label="Place" value={name} onChange={(e) => setName(e.target.value)} className={field} />
      <input aria-label="Code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" className={codeField} />
      <input aria-label="Note" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className={field} />
      <div className="mt-1 flex justify-end gap-2">
        <button type="button" onClick={onDone} className={cn(pill, "text-haze")}>
          Cancel
        </button>
        <button type="submit" disabled={!name.trim() || !code.trim()} className={cn(pill, "bg-ink text-night disabled:opacity-40")}>
          Save
        </button>
      </div>
    </form>
  );
}

/**
 * Everything about one toilet: the code (hidden until you tap, so it isn't
 * on show to everyone around you), when it last worked, and the buttons
 * that keep it honest. Only the person who shared a code can edit it;
 * everyone else can suggest a new one.
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
  const [editing, setEditing] = useState(false);
  // After a vote: thanks, or (after "doesn't work") asking for the new code.
  const [step, setStep] = useState<null | "thanks" | "new-code" | "suggested">(null);
  const [newCode, setNewCode] = useState("");
  const state = health(toilet);
  const suggestions = toilet.mine ? (toilet.suggestions ?? []) : [];

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
    setStep("thanks");
  };
  const broken = () => {
    reportCode(toilet.id);
    setStep("new-code");
  };
  const sendNewCode = (event: FormEvent) => {
    event.preventDefault();
    const code = newCode.trim();
    if (!code) return;
    if (toilet.mine) {
      editToilet(toilet.id, { code });
      setStep("thanks");
      setShown(true);
    } else {
      suggestCode(toilet.id, code);
      setStep("suggested");
    }
    setNewCode("");
  };

  if (editing) {
    return (
      <div className={cn("text-left", className)}>
        <p className="mb-3 text-sm font-semibold text-haze">Edit your code</p>
        <EditForm toilet={toilet} onDone={() => setEditing(false)} />
      </div>
    );
  }

  return (
    <div className={cn("text-left", className)}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
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
        </div>
        {toilet.mine && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="-mt-1 -mr-1 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-haze hover:text-ink"
          >
            <Pencil className="size-3.5" aria-hidden /> Edit
          </button>
        )}
      </div>

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
            className="grid size-14 shrink-0 place-items-center rounded-2xl border border-dusk-edge bg-night text-haze transition-transform active:scale-95"
          >
            {copied ? <Check className="size-5 text-good" /> : <Copy className="size-5" />}
          </button>
        )}
      </div>

      <p className={cn("mt-2 flex items-center gap-2 text-sm", HEALTH[state].text)}>
        <HealthDot toilet={toilet} className="size-2" />
        {state === "bad" ? `Reported not working ${ago(toilet.reportedAt!)}` : `Worked ${ago(toilet.confirmedAt)}`}
      </p>

      {/* New codes people suggested, for the person who shared it */}
      {suggestions.length > 0 && (
        <div className="mt-3 rounded-2xl border border-dusk-edge p-3">
          <p className="text-sm font-semibold">Suggested new {suggestions.length === 1 ? "code" : "codes"}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {suggestions.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block font-mono tracking-[0.12em]">{s.code}</span>
                  <span className="block text-xs text-haze">{ago(s.at)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => dismissSuggestion(toilet.id, s.id)}
                  className="h-9 rounded-full px-3 text-sm font-semibold text-haze"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => editToilet(toilet.id, { code: s.code })}
                  className="h-9 rounded-full bg-ink px-4 text-sm font-semibold text-night"
                >
                  Use it
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keep it honest */}
      {step === null && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={works}
            className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-good/15 px-2 text-[0.875rem] font-semibold text-good transition-transform active:scale-[0.97]"
          >
            <ThumbsUp className="size-4" aria-hidden /> Still works
          </button>
          <button
            type="button"
            onClick={broken}
            className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-bad/15 px-2 text-[0.875rem] font-semibold text-bad transition-transform active:scale-[0.97]"
          >
            <ThumbsDown className="size-4" aria-hidden /> Doesn&apos;t work
          </button>
        </div>
      )}
      {step === "thanks" && <p className="mt-3 text-sm text-haze">Thanks, that helps the next person.</p>}
      {step === "suggested" && (
        <p className="mt-3 text-sm text-haze">Thanks. We&apos;ll ask the person who shared it to update the code.</p>
      )}
      {step === "new-code" && (
        <form onSubmit={sendNewCode} className="mt-3">
          <p className="text-sm text-haze">Thanks. Do you know the new code?</p>
          <div className="mt-2 flex gap-2">
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="New code"
              aria-label="New code"
              autoComplete="off"
              className={cn(codeField, "min-w-0 flex-1")}
            />
            <button type="submit" disabled={!newCode.trim()} className={cn(pill, "bg-ink text-night disabled:opacity-40")}>
              {toilet.mine ? "Save" : "Suggest"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setStep("thanks")}
            className="mt-2 h-10 w-full rounded-full text-sm font-semibold text-haze hover:text-ink"
          >
            I don&apos;t know it
          </button>
        </form>
      )}

      {toilet.note && <p className="mt-3 text-sm text-haze">{toilet.note}</p>}
    </div>
  );
}
