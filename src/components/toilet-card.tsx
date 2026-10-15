"use client";

import { Accessibility, Baby, Check, Copy, Eye, Flag, Navigation, Pencil, ThumbsDown, ThumbsUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { LimitedInput } from "@/components/limited-input";
import { btn } from "@/components/ui/buttons";
import { spotMessage, useT } from "@/lib/i18n";
import { LIMITS, cleanCode, cleanText, tidy, validCode, validName } from "@/lib/limits";
import { REMOTE } from "@/lib/api";
import { checkFields } from "@/lib/moderation";
import { checkOnTheSpot } from "@/lib/on-the-spot";
import {
  ago,
  acceptSuggestion,
  confirmCode,
  directionsUrl,
  dismissSuggestion,
  editToilet,
  isOpen,
  reportCode,
  reportToilet,
  suggestCode,
  trust,
  trustColor,
  type Toilet,
} from "@/lib/toilets";
import { cn } from "@/lib/utils";

/**
 * The dot on the map and in lists. Colour follows the votes (red through
 * orange to green), and so colour isn't the only clue, a code most people
 * couldn't use is a hollow ring instead of a filled dot.
 */
export function HealthDot({ toilet, className }: { toilet: Toilet; className?: string }) {
  const color = trustColor(toilet);
  const doubtful = trust(toilet) < 0.5;
  return (
    <span
      aria-hidden
      className={cn("block size-2.5 shrink-0 rounded-full", className)}
      style={
        doubtful
          ? { background: "#000", boxShadow: `inset 0 0 0 2.5px ${color}, 0 0 0 1.5px #000, 0 0 8px 1px color-mix(in srgb, ${color} 45%, transparent)` }
          : { background: color, boxShadow: `0 0 0 2px #000, 0 0 10px 2px color-mix(in srgb, ${color} 55%, transparent)` }
      }
    />
  );
}

const field =
  "h-11 w-full rounded-full border border-dusk-edge bg-night px-4 outline-none placeholder:text-haze/60 focus:border-good";
const codeField = `${field} font-mono tracking-[0.12em] placeholder:font-sans placeholder:tracking-normal`;

/** "Open · until 22:00", "Closed · opens 08:00", "Open 24/7", or nothing. */
export function HoursLine({ toilet, className }: { toilet: Toilet; className?: string }) {
  const { t } = useT();
  if (!toilet.hours) return null;
  const open = isOpen(toilet);
  const text =
    toilet.hours === "24/7" ? t.card.open247 : open ? t.card.openUntil(toilet.hours.close) : t.card.closedOpens(toilet.hours.open);
  return <span className={cn(open ? "text-good" : "text-bad", className)}>{text}</span>;
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
  const [error, setError] = useState("");
  const save = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = tidy(name, LIMITS.name);
    const cleanedCode = cleanCode(code);
    if (!validName(cleanName) || !validCode(cleanedCode)) return;
    const cleanNote = tidy(note, LIMITS.note);
    if (!checkFields({ name: cleanName, note: cleanNote }).ok) return setError(t.add.errBad);
    editToilet(toilet.id, { name: cleanName, code: cleanedCode, note: cleanNote });
    onDone();
  };
  return (
    <form onSubmit={save} className="flex flex-col gap-2">
      <LimitedInput
        aria-label={t.add.place}
        value={name}
        onValueChange={setName}
        max={LIMITS.name}
        clean={(v) => cleanText(v, LIMITS.name)}
        rejectedHint={t.add.textHint}
        className={field}
      />
      <LimitedInput
        aria-label={t.add.code}
        value={code}
        onValueChange={setCode}
        max={LIMITS.code}
        clean={cleanCode}
        rejectedHint={t.add.codeHint}
        autoComplete="off"
        className={codeField}
      />
      <LimitedInput
        aria-label={t.add.note}
        placeholder={t.add.note}
        value={note}
        onValueChange={setNote}
        max={LIMITS.note}
        clean={(v) => cleanText(v, LIMITS.note)}
        rejectedHint={t.add.textHint}
        className={field}
      />
      {error && (
        <p role="alert" className="text-sm text-stale">
          {error}
        </p>
      )}
      <div className="mt-1 flex justify-end gap-2">
        <button type="button" onClick={onDone} className={cn(btn.quiet, btn.md)}>
          {t.card.cancel}
        </button>
        <button type="submit" disabled={!validName(tidy(name, LIMITS.name)) || !validCode(cleanCode(code))} className={cn(btn.primary, btn.md)}>
          {t.card.save}
        </button>
      </div>
    </form>
  );
}

/**
 * One toilet. The code comes first (hidden until you tap, so it isn't on
 * show to everyone around you), then whether it's open and the way there,
 * then the quieter part: how many got in, and "Did the code work?".
 * Only the person who shared a code can edit it; everyone else suggests.
 * Votes count only from someone standing there.
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
  // After a vote: thanks, or (after "no") asking for the new code.
  const [step, setStep] = useState<null | "thanks" | "new-code" | "suggested">(null);
  const [newCode, setNewCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  // Reporting a place: closed, picking a reason, or done.
  const [reporting, setReporting] = useState<"closed" | "pick" | "sent">("closed");
  const suggestions = toilet.mine ? (toilet.suggestions ?? []) : [];
  const votes = toilet.confirms + toilet.reports;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toilet.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the code is on screen anyway.
    }
  };

  const vote = async (works: boolean) => {
    setBlocked(null);
    setChecking(true);
    const spot = await checkOnTheSpot(toilet);
    setChecking(false);
    if (!spot.ok) {
      setBlocked(spotMessage(t, spot));
      return;
    }
    if (works) {
      confirmCode(toilet.id, spot.location);
      setStep("thanks");
    } else {
      reportCode(toilet.id, spot.location);
      setStep("new-code");
    }
  };

  const sendNewCode = (event: FormEvent) => {
    event.preventDefault();
    const code = cleanCode(newCode);
    if (!validCode(code)) return;
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

  const access = toilet.access === "paid" && toilet.price ? `${t.access.paid} ${toilet.price} Ft` : t.access[toilet.access];

  return (
    <div className={cn("text-left", className)}>
      {/* What and where */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {!inList && <p className="text-[1.0625rem] leading-tight font-semibold">{toilet.name}</p>}
          <p className={cn("text-sm text-haze", !inList && "mt-0.5")}>
            {!inList && <>{t.kinds[toilet.kind]} · </>}
            {access}
          </p>
          {toilet.hours && <HoursLine toilet={toilet} className="mt-0.5 block text-sm" />}
          {toilet.pending && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-haze">
              <span aria-hidden className="size-1.5 rounded-full bg-stale" />
              {t.sync.pendingTag}
            </p>
          )}
        </div>
        {toilet.mine && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={t.card.edit}
            className={cn(btn.quiet, "-mt-1 -mr-1 size-9")}
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

      {/* The code: the reason you're here */}
      <div className="mt-3 flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? t.card.hide : t.card.show}
          className="relative flex h-16 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-good/40 bg-good/[0.07]"
        >
          <AnimatePresence mode="wait" initial={false}>
            {shown ? (
              <motion.span
                key="code"
                initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="truncate pr-11 pl-4 font-mono text-[1.75rem] font-bold tracking-[0.1em] tabular-nums"
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
                className="inline-flex items-center gap-2 text-base font-semibold text-ink"
              >
                <Eye className="size-5 text-good" aria-hidden /> {t.card.tapToShow}
              </motion.span>
            )}
          </AnimatePresence>
          {shown && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                void copy();
              }}
              aria-label={t.card.copy}
              className="absolute right-2 grid size-10 place-items-center rounded-full text-haze hover:text-ink"
            >
              {copied ? <Check className="size-5 text-good" /> : <Copy className="size-5" />}
            </span>
          )}
        </button>
        <a
          href={directionsUrl(toilet)}
          target="_blank"
          rel="noreferrer"
          aria-label={t.card.directions}
          className={cn(btn.secondary, "h-16 w-16 flex-col gap-0.5 rounded-2xl px-0 text-[0.6875rem]")}
        >
          <Navigation className="size-5 text-good" aria-hidden />
          {t.card.directions}
        </a>
      </div>

      {/* How many got in: plain words, the dot carries the colour */}
      <p className="mt-3 flex items-center gap-2 text-sm text-ink/85">
        <HealthDot toilet={toilet} className="size-2" />
        {votes > 0 && <span className="font-semibold">{t.card.gotIn(Math.round(trust(toilet) * 100))}</span>}
        <span className="text-haze">{t.card.votes(toilet.confirms, toilet.reports)}</span>
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
                <button type="button" onClick={() => dismissSuggestion(toilet.id, s.id)} className={cn(btn.quiet, btn.sm, "px-3")}>
                  {t.card.dismiss}
                </button>
                <button type="button" onClick={() => acceptSuggestion(toilet.id, s.id)} className={cn(btn.primary, btn.sm)}>
                  {t.card.useIt}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Keep it honest, quietly */}
      {step === null && (
        <>
          <div className="mt-3 flex items-center gap-2 border-t border-dusk-edge pt-3">
            <span className="min-w-0 flex-1 text-sm text-haze">{t.card.didItWork}</span>
            <button type="button" onClick={() => vote(true)} disabled={checking} className={cn(btn.secondary, btn.sm, "px-3.5")}>
              <ThumbsUp className="size-4 text-good" aria-hidden /> {t.card.yes}
            </button>
            <button type="button" onClick={() => vote(false)} disabled={checking} className={cn(btn.secondary, btn.sm, "px-3.5")}>
              <ThumbsDown className="size-4 text-bad" aria-hidden /> {t.card.no}
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
      {step === "thanks" && <p className="mt-3 border-t border-dusk-edge pt-3 text-sm text-haze">{t.card.thanks}</p>}
      {step === "suggested" && <p className="mt-3 border-t border-dusk-edge pt-3 text-sm text-haze">{t.card.suggested}</p>}
      {step === "new-code" && (
        <form onSubmit={sendNewCode} className="mt-3 border-t border-dusk-edge pt-3">
          <p className="text-sm text-haze">{t.card.knowNew}</p>
          <div className="mt-2 flex gap-2">
            <LimitedInput
              value={newCode}
              onValueChange={setNewCode}
              max={LIMITS.code}
              clean={cleanCode}
              rejectedHint={t.add.codeHint}
              placeholder={t.card.newCode}
              aria-label={t.card.newCode}
              autoComplete="off"
              wrapperClassName="min-w-0 flex-1"
              className={codeField}
            />
            <button type="submit" disabled={!validCode(cleanCode(newCode))} className={cn(btn.primary, btn.md)}>
              {toilet.mine ? t.card.save : t.card.suggest}
            </button>
          </div>
          <button type="button" onClick={() => setStep("thanks")} className={cn(btn.quiet, btn.sm, "mt-1 w-full")}>
            {t.card.dontKnow}
          </button>
        </form>
      )}

      {toilet.note && <p className="mt-3 text-sm text-haze">{toilet.note}</p>}

      {/* Anything wrong with the place itself (not the code): offensive, private, gone */}
      {!toilet.mine && (
        <div className="mt-3">
          {reporting === "closed" && (
            <button type="button" onClick={() => setReporting("pick")} className="inline-flex h-8 items-center gap-1.5 rounded-full text-xs text-haze hover:text-ink">
              <Flag className="size-3.5" aria-hidden /> {t.card.report}
            </button>
          )}
          {reporting === "pick" && (
            <div className="rounded-2xl border border-dusk-edge p-3">
              <p className="text-sm font-semibold">{t.card.reportTitle}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(t.card.reportReasons).map(([reason, label]) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      reportToilet(toilet.id, reason);
                      setReporting("sent");
                    }}
                    className={cn(btn.secondary, btn.sm, "px-3")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setReporting("closed")} className={cn(btn.quiet, btn.sm, "mt-1")}>
                {t.card.cancel}
              </button>
            </div>
          )}
          {reporting === "sent" && <p className="text-xs text-haze">{REMOTE ? t.card.reportSent : t.card.reportDemo}</p>}
        </div>
      )}
    </div>
  );
}
