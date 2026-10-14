"use client";

import { Accessibility, Baby, Check, Clock, Copy, Eye, Navigation, Pencil, ThumbsDown, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useT } from "@/lib/i18n";
import { checkOnTheSpot } from "@/lib/on-the-spot";
import {
  ago,
  confirmCode,
  directionsUrl,
  dismissSuggestion,
  editToilet,
  isOpen,
  reportCode,
  suggestCode,
  trustColor,
  type Toilet,
} from "@/lib/toilets";
import { cn } from "@/lib/utils";

/** The coloured dot used on the map and in lists. */
export function HealthDot({ toilet, className }: { toilet: Toilet; className?: string }) {
  const color = trustColor(toilet);
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

/** "Open · until 22:00", "Closed · opens 08:00", "Open 24/7", or nothing. */
export function HoursLine({ toilet, className }: { toilet: Toilet; className?: string }) {
  const { t } = useT();
  if (!toilet.hours) return null;
  const open = isOpen(toilet);
  const text =
    toilet.hours === "24/7"
      ? t.card.open247
      : open
        ? t.card.openUntil(toilet.hours.close)
        : t.card.closedOpens(toilet.hours.open);
  return (
    <span className={cn("inline-flex items-center gap-1.5", open ? "text-good" : "text-bad", className)}>
      <Clock className="size-3.5" aria-hidden />
      {text}
    </span>
  );
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-dusk-edge px-2.5 text-xs text-haze">
      {icon}
      {children}
    </span>
  );
}

/** The person who shared it can change the name, code and note. */
function EditForm({ toilet, onDone }: { toilet: Toilet; onDone: () => void }) {
  const { t } = useT();
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
      <input aria-label={t.add.place} value={name} onChange={(e) => setName(e.target.value)} className={field} />
      <input aria-label={t.add.code} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" className={codeField} />
      <input aria-label={t.add.note} placeholder={t.add.note} value={note} onChange={(e) => setNote(e.target.value)} className={field} />
      <div className="mt-1 flex justify-end gap-2">
        <button type="button" onClick={onDone} className={cn(pill, "text-haze")}>
          {t.card.cancel}
        </button>
        <button type="submit" disabled={!name.trim() || !code.trim()} className={cn(pill, "bg-ink text-night disabled:opacity-40")}>
          {t.card.save}
        </button>
      </div>
    </form>
  );
}

/**
 * Everything about one toilet: the code (hidden until you tap, so it isn't
 * on show to everyone around you), whether it's open, how many got in, and
 * the buttons that keep it honest. Only the person who shared a code can
 * edit it; everyone else can suggest a new one. Votes count only on the spot.
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
  const { t, lang } = useT();
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  // After a vote: thanks, or (after "doesn't work") asking for the new code.
  const [step, setStep] = useState<null | "thanks" | "new-code" | "suggested">(null);
  const [newCode, setNewCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
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

  // Votes only count from someone standing there.
  const vote = async (works: boolean) => {
    setBlocked(null);
    setChecking(true);
    const spot = await checkOnTheSpot(toilet);
    setChecking(false);
    if (!spot.ok) {
      setBlocked(spot.reason === "far" ? t.spot.far(spot.metres) : t.spot.location);
      return;
    }
    if (works) {
      confirmCode(toilet.id);
      setStep("thanks");
    } else {
      reportCode(toilet.id);
      setStep("new-code");
    }
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
        <p className="mb-3 text-sm font-semibold text-haze">{t.card.editTitle}</p>
        <EditForm toilet={toilet} onDone={() => setEditing(false)} />
      </div>
    );
  }

  const access = toilet.access === "paid" && toilet.price ? `${t.access.paid} · ${toilet.price} Ft` : t.access[toilet.access];

  return (
    <div className={cn("text-left", className)}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {inList ? (
            <p className="text-sm text-haze">{access}</p>
          ) : (
            <>
              <p className="text-[1.0625rem] font-semibold leading-tight">{toilet.name}</p>
              <p className="mt-0.5 text-sm text-haze">
                {t.kinds[toilet.kind]} · {access}
              </p>
            </>
          )}
          <HoursLine toilet={toilet} className="mt-1 text-sm" />
        </div>
        <a
          href={directionsUrl(toilet)}
          target="_blank"
          rel="noreferrer"
          aria-label={t.card.directions}
          title={t.card.directions}
          className="-mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-good/15 text-good transition-transform active:scale-95"
        >
          <Navigation className="size-4" aria-hidden />
        </a>
        {toilet.mine && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={t.card.edit}
            className="-mt-1 -mr-1 grid size-8 shrink-0 place-items-center rounded-full text-haze hover:text-ink"
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {(toilet.wheelchair || toilet.babyChanging) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {toilet.wheelchair && <Chip icon={<Accessibility className="size-3.5" aria-hidden />}>{t.card.wheelchair}</Chip>}
          {toilet.babyChanging && <Chip icon={<Baby className="size-3.5" aria-hidden />}>{t.card.baby}</Chip>}
        </div>
      )}

      {/* The code, and the way there */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? t.card.hide : t.card.show}
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
                <Eye className="size-4" aria-hidden /> {t.card.tapToShow}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        {shown && (
          <button
            type="button"
            onClick={copy}
            aria-label={t.card.copy}
            className="grid size-14 shrink-0 place-items-center rounded-2xl border border-dusk-edge bg-night text-haze transition-transform active:scale-95"
          >
            {copied ? <Check className="size-5 text-good" /> : <Copy className="size-5" />}
          </button>
        )}
      </div>

      {/* How many got in, and how many didn't */}
      <p className="mt-2 flex items-center gap-2 text-sm">
        <HealthDot toilet={toilet} className="size-2" />
        <span style={{ color: trustColor(toilet) }}>{t.card.votes(toilet.confirms, toilet.reports)}</span>
      </p>
      <p className="mt-0.5 pl-4 text-xs text-haze">
        {t.card.lastWorked(ago(toilet.confirmedAt, lang))}
        {toilet.reportedAt && toilet.reportedAt > toilet.confirmedAt && t.card.lastFailed(ago(toilet.reportedAt, lang))}
      </p>

      {/* New codes people suggested, for the person who shared it */}
      {suggestions.length > 0 && (
        <div className="mt-3 rounded-2xl border border-dusk-edge p-3">
          <p className="text-sm font-semibold">{t.card.suggestions(suggestions.length)}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {suggestions.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block font-mono tracking-[0.12em]">{s.code}</span>
                  <span className="block text-xs text-haze">{ago(s.at, lang)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => dismissSuggestion(toilet.id, s.id)}
                  className="h-9 rounded-full px-3 text-sm font-semibold text-haze"
                >
                  {t.card.dismiss}
                </button>
                <button
                  type="button"
                  onClick={() => editToilet(toilet.id, { code: s.code })}
                  className="h-9 rounded-full bg-ink px-4 text-sm font-semibold text-night"
                >
                  {t.card.useIt}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keep it honest */}
      {step === null && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => vote(true)}
              disabled={checking}
              className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-good/15 px-2 text-[0.875rem] font-semibold text-good transition-transform active:scale-[0.97] disabled:opacity-60"
            >
              <ThumbsUp className="size-4" aria-hidden /> {t.card.stillWorks}
            </button>
            <button
              type="button"
              onClick={() => vote(false)}
              disabled={checking}
              className="inline-flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-bad/15 px-2 text-[0.875rem] font-semibold text-bad transition-transform active:scale-[0.97] disabled:opacity-60"
            >
              <ThumbsDown className="size-4" aria-hidden /> {t.card.doesntWork}
            </button>
          </div>
          {checking && <p className="mt-2 text-sm text-haze">{t.spot.checking}</p>}
          {blocked && (
            <p role="alert" className="mt-2 text-sm text-stale">
              {blocked}
            </p>
          )}
        </>
      )}
      {step === "thanks" && <p className="mt-3 text-sm text-haze">{t.card.thanks}</p>}
      {step === "suggested" && <p className="mt-3 text-sm text-haze">{t.card.suggested}</p>}
      {step === "new-code" && (
        <form onSubmit={sendNewCode} className="mt-3">
          <p className="text-sm text-haze">{t.card.knowNew}</p>
          <div className="mt-2 flex gap-2">
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder={t.card.newCode}
              aria-label={t.card.newCode}
              autoComplete="off"
              className={cn(codeField, "min-w-0 flex-1")}
            />
            <button type="submit" disabled={!newCode.trim()} className={cn(pill, "bg-ink text-night disabled:opacity-40")}>
              {toilet.mine ? t.card.save : t.card.suggest}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setStep("thanks")}
            className="mt-2 h-10 w-full rounded-full text-sm font-semibold text-haze hover:text-ink"
          >
            {t.card.dontKnow}
          </button>
        </form>
      )}

      {toilet.note && <p className="mt-3 text-sm text-haze">{toilet.note}</p>}
    </div>
  );
}
