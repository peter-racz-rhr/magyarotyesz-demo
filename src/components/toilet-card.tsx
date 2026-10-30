"use client";

import { requireAccount } from "@/lib/sync";
import { Accessibility, Baby, Bookmark, Check, Coins, Eye, Flag, Navigation, Pencil, Share2, Signpost, ThumbsDown, ThumbsUp, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { buzz } from "@/lib/haptics";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { HintChips } from "@/components/hint-chips";
import { LimitedInput } from "@/components/limited-input";
import { btn } from "@/components/ui/buttons";
import { spotMessage, useT } from "@/lib/i18n";
import { LIMITS, cleanCode, cleanText, tidy, validCode, validName } from "@/lib/limits";
import { REMOTE } from "@/lib/api";
import { checkFields } from "@/lib/moderation";
import { rememberReveal } from "@/lib/code-check";
import { checkOnTheSpot } from "@/lib/on-the-spot";
import { toggleSaved, useSaved } from "@/lib/saved";
import { useSettings } from "@/lib/settings";
import {
  ago,
  acceptSuggestion,
  confirmCode,
  directionsUrl,
  dismissSuggestion,
  distance,
  freshness,
  editToilet,
  isOpen,
  isStale,
  isUnconfirmed,
  placeLink,
  reportCode,
  reportToilet,
  suggestCode,
  trust,
  trustColor,
  walkIfNear,
  type Toilet,
  formatPrice,
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
  const stale = isStale(toilet);
  return (
    <span
      aria-hidden
      className={cn("block size-2.5 shrink-0 rounded-full", stale && "opacity-45", className)}
      style={
        doubtful
          ? { background: "var(--night)", boxShadow: `inset 0 0 0 2.5px ${color}, 0 0 0 1.5px var(--night), 0 0 8px 1px color-mix(in srgb, ${color} 45%, transparent)` }
          : { background: color, boxShadow: `0 0 0 2px var(--night), 0 0 10px 2px color-mix(in srgb, ${color} 55%, transparent)` }
      }
    />
  );
}

const field =
  "h-11 w-full rounded-full border border-dusk-edge bg-night px-4 outline-none placeholder:text-haze/60 focus:border-good";
const codeField = `${field} font-mono tracking-[0.12em] placeholder:font-sans placeholder:tracking-normal`;

/** "Open · until 22:00", "Closed · opens 08:00", "Open 24/7", or nothing. */
/** The code always fits: the longer it is, the smaller it is written (and a very long one wraps instead of being cut off). */
function codeSize(code: string) {
  const n = code.length;
  if (n <= 7) return "text-[1.75rem] tracking-[0.1em]";
  if (n <= 10) return "text-[1.5rem] tracking-[0.06em]";
  if (n <= 13) return "text-[1.25rem] tracking-[0.04em]";
  return "text-[1.0625rem] leading-tight tracking-[0.02em]";
}

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
    // A free toilet may have no code at all.
    const codeOk = cleanedCode === "" ? toilet.access !== "customers" : validCode(cleanedCode);
    if (!validName(cleanName) || !codeOk) return;
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
      <HintChips note={note} onChange={setNote} />
      {error && (
        <p role="alert" className="text-sm text-stale">
          {error}
        </p>
      )}
      <div className="mt-1 flex justify-end gap-2">
        <button type="button" onClick={onDone} className={cn(btn.quiet, btn.md)}>
          {t.card.cancel}
        </button>
        <button type="submit" disabled={!validName(tidy(name, LIMITS.name)) || !(cleanCode(code) === "" ? toilet.access !== "customers" : validCode(cleanCode(code)))} className={cn(btn.primary, btn.md)}>
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
  from = null,
}: {
  toilet: Toilet;
  className?: string;
  /** In a list the row already shows the name and kind. */
  inList?: boolean;
  /** Where you are, to say how long the walk is. */
  from?: { latitude: number; longitude: number } | null;
}) {
  const { t, lang } = useT();
  const { showCodes } = useSettings();
  const saved = useSaved().includes(toilet.id);
  const walk = from ? walkIfNear(distance(from, toilet)) : null;
  const [shown, setShown] = useState(showCodes);
  // A short buzz when the code appears (not on first load, and not when it was already showing).
  const firstShown = useRef(true);
  useEffect(() => {
    if (firstShown.current) {
      firstShown.current = false;
      return;
    }
    if (shown) buzz("reveal");
  }, [shown]);
  // A code that was tapped open hides itself again after a minute (unless "show codes right away" is on).
  useEffect(() => {
    if (!shown || showCodes) return;
    const timer = window.setTimeout(() => setShown(false), 60_000);
    return () => window.clearTimeout(timer);
  }, [shown, showCodes]);
  // Looking at someone else's code starts the "did it work?" question for a few minutes later (see CodeCheckPrompt).
  useEffect(() => {
    if (shown && toilet.code !== "" && !toilet.mine && !toilet.myVote) rememberReveal(toilet.id, toilet.name);
  }, [shown, toilet.id, toilet.name, toilet.code, toilet.mine, toilet.myVote]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  // After a vote: thanks, or (after "no") asking for the new code.
  const [step, setStep] = useState<null | "thanks" | "new-code" | "suggested">(null);
  const [newCode, setNewCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  // Reporting a place: closed, picking a reason, or done.
  const [reporting, setReporting] = useState<"closed" | "pick" | "sent">("closed");
  const [reportedFar, setReportedFar] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // Switching between the card and the report form: the sheet it sits in starts from the top again.
  useEffect(() => {
    for (let el = root.current?.parentElement; el; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight && /(auto|scroll)/.test(getComputedStyle(el).overflowY)) {
        el.scrollTo({ top: 0 });
        break;
      }
    }
  }, [reporting]);
  const suggestions = toilet.mine ? (toilet.suggestions ?? []) : [];

  /** The phone's own share sheet where there is one; otherwise the link goes to the clipboard. */
  const share = async () => {
    const url = placeLink(toilet);
    try {
      if (navigator.share) {
        await navigator.share({ title: toilet.name, text: t.card.shareText(toilet.name), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      window.setTimeout(() => setLinkCopied(false), 1800);
    } catch {
      // Cancelled, or blocked: nothing to do.
    }
  };

  const vote = async (works: boolean) => {
    if (!requireAccount()) return;
    setBlocked(null);
    setChecking(true);
    const spot = await checkOnTheSpot(toilet);
    setChecking(false);
    if (!spot.ok) {
      setBlocked(spotMessage(t, spot));
      buzz("warn");
      return;
    }
    if (works) {
      confirmCode(toilet.id, spot.location);
      setStep("thanks");
      buzz("success");
    } else {
      reportCode(toilet.id, spot.location);
      setStep("new-code");
      buzz("no");
    }
  };

  const sendNewCode = async (event: FormEvent) => {
    event.preventDefault();
    const code = cleanCode(newCode);
    if (!validCode(code)) return;
    if (!requireAccount()) return;
    if (toilet.mine) {
      editToilet(toilet.id, { code });
      setStep("thanks");
      setShown(true);
    } else {
      // A suggestion, like a vote, has to come from the spot.
      setBlocked(null);
      const spot = await checkOnTheSpot(toilet);
      if (!spot.ok) {
        setBlocked(spotMessage(t, spot));
        buzz("warn");
        return;
      }
      suggestCode(toilet.id, code, spot.location);
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

  if (reporting !== "closed") {
    const leave = () => {
      setReporting("closed");
      setReportReason(null);
      setReportNote("");
    };
    const send = async () => {
      if (!reportReason || reportBusy) return;
      setReportBusy(true);
      // Near the place the report counts at once; from afar it is kept for a person to look at.
      const spot = await checkOnTheSpot(toilet);
      reportToilet(toilet.id, reportReason, spot.ok ? spot.location : undefined, reportNote);
      buzz("done");
      setReportedFar(!spot.ok);
      setReportBusy(false);
      setReporting("sent");
    };
    return (
      <div ref={root} className={cn("text-left", className)}>
        {!inList && <p className="text-[1.0625rem] leading-tight font-semibold">{toilet.name}</p>}
        {reporting === "sent" ? (
          <>
            <p className="mt-3 text-sm text-haze">{REMOTE ? (reportedFar ? t.card.reportSentFar : t.card.reportSent) : t.card.reportDemo}</p>
            <button type="button" onClick={leave} className={cn(btn.primary, "mt-4 w-full")}>
              {t.card.reportDone}
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm font-semibold">{t.card.reportTitle}</p>
            <div role="radiogroup" aria-label={t.card.reportTitle} className="mt-2 flex flex-col gap-1.5">
              {Object.entries(t.card.reportReasons).map(([reason, label]) => (
                <button
                  key={reason}
                  type="button"
                  role="radio"
                  aria-checked={reportReason === reason}
                  onClick={() => setReportReason(reason)}
                  className={cn("flex min-h-11 items-center gap-3 rounded-2xl border px-3.5 text-left text-[0.9375rem] transition-colors", reportReason === reason ? "border-brand bg-brand/10 font-semibold" : "border-dusk-edge")}
                >
                  <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", reportReason === reason ? "border-brand" : "border-haze/60")}>
                    {reportReason === reason && <span className="size-2.5 rounded-full bg-brand" />}
                  </span>
                  {label}
                </button>
              ))}
            </div>
            <label className="mt-3 flex flex-col gap-1.5 text-[0.8125rem] font-semibold text-haze">
              {t.card.reportMessage}
              <textarea
                value={reportNote}
                rows={3}
                maxLength={300}
                placeholder={t.card.reportMessageHint}
                onChange={(e) => setReportNote(cleanText(e.target.value, 300))}
                className="w-full rounded-2xl border border-dusk-edge bg-dusk px-3.5 py-3 text-[1rem] font-normal text-ink outline-none placeholder:text-haze/70 focus:border-brand"
              />
            </label>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={leave} className={cn(btn.secondary, "flex-1")}>
                {t.card.cancel}
              </button>
              <button type="button" disabled={!reportReason || reportBusy} onClick={() => void send()} className={cn(btn.primary, "flex-1 disabled:opacity-50")}>
                {t.card.reportSend}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  const access = toilet.access === "paid" && toilet.price ? `${t.access.paid} ${formatPrice(toilet.price, toilet.currency, lang)}` : t.access[toilet.access];

  return (
    <div ref={root} className={cn("text-left", className)}>
      {/* What and where */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {!inList && <p className="text-[1.0625rem] leading-tight font-semibold">{toilet.name}</p>}
          <p className={cn("text-sm text-haze", !inList && "mt-0.5")}>
            {!inList && <>{t.kinds[toilet.kind]} · </>}
            {access}
          </p>
          {toilet.hours && !inList && <HoursLine toilet={toilet} className="mt-0.5 block text-sm" />}
          {isUnconfirmed(toilet) && <p className="mt-1 text-xs text-stale">{t.card.unconfirmed}</p>}
          {toilet.pending && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-haze">
              <span aria-hidden className="size-1.5 rounded-full bg-stale" />
              {t.sync.pendingTag}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggleSaved(toilet.id)}
          aria-label={saved ? t.card.unsavePlace : t.card.savePlace}
          aria-pressed={saved}
          className={cn(btn.quiet, "-mt-1 size-9")}
        >
          <Bookmark className={cn("size-4", saved && "fill-brand text-brand")} aria-hidden />
        </button>
        <button type="button" onClick={share} aria-label={linkCopied ? t.card.linkCopied : t.card.share} className={cn(btn.quiet, "-mt-1 size-9", toilet.mine ? "" : "-mr-1")}>
          {linkCopied ? <Check className="size-4 text-good" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
        </button>
        {toilet.mine && (
          <button
            type="button"
            onClick={() => requireAccount() && setEditing(true)}
            aria-label={t.card.edit}
            className={cn(btn.quiet, "-mt-1 -mr-1 size-9")}
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {(toilet.wheelchair || toilet.babyChanging || toilet.genderNeutral) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {toilet.wheelchair && <Chip icon={<Accessibility className="size-3.5" aria-hidden />}>{t.card.wheelchair}</Chip>}
          {toilet.babyChanging && <Chip icon={<Baby className="size-3.5" aria-hidden />}>{t.card.baby}</Chip>}
          {toilet.genderNeutral && <Chip icon={<Users className="size-3.5" aria-hidden />}>{t.card.genderNeutral}</Chip>}
        </div>
      )}

      {/* A paid toilet says so, loudly, even when it also has a code */}
      {toilet.access === "paid" && toilet.code !== "" && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-stale/50 bg-stale/[0.12] px-3 py-1 text-sm font-bold text-stale">
          <Coins className="size-4" aria-hidden /> {t.card.paidBadge(toilet.price)}
        </p>
      )}

      {/* The code: the reason you're here */}
      <div className={cn("flex items-stretch gap-2", toilet.access === "paid" && toilet.code !== "" ? "mt-2" : "mt-3")}>
        {toilet.code === "" ? (
          toilet.access === "paid" ? (
            <div className="flex h-16 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-stale/50 bg-stale/[0.12] px-3 text-center text-base leading-tight font-bold text-stale">
              <Coins className="size-5 shrink-0" aria-hidden /> {t.card.paidNoCode(toilet.price)}
            </div>
          ) : (
            <div className="flex h-16 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-good/40 bg-good/[0.07] px-3 text-center text-base leading-tight font-semibold">
              <Check className="size-5 shrink-0 text-good" aria-hidden /> {t.card.freeNoCode}
            </div>
          )
        ) : (
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
                className={cn("max-w-full px-4 text-center font-mono font-bold tabular-nums break-all", codeSize(toilet.code))}
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
        </button>
        )}
      </div>
      <a
        href={directionsUrl(toilet)}
        target="_blank"
        rel="noreferrer"
        className={cn(btn.secondary, "mt-2 h-11 w-full gap-2 rounded-2xl text-[0.9375rem]")}
      >
        <Navigation className="size-[1.125rem] text-good" aria-hidden />
        {walk ? t.card.directionsWalk(walk) : t.card.directions}
      </a>

      {isStale(toilet) && <p className="mt-2 text-xs text-stale">{t.card.stale}</p>}

      {/* How many got in: plain words, the dot carries the colour */}
      <p className="mt-3 flex items-center gap-2 text-sm text-ink/85">
        <HealthDot toilet={toilet} className="size-2" />
        <span className="font-semibold">{t.card.votes(toilet.confirms, toilet.reports)}</span>
      </p>
      <p className="mt-0.5 flex items-center gap-2 pl-4 text-xs text-haze">
        <span role="img" aria-label={t.card.fresh[freshness(toilet)]} className="flex shrink-0 items-end gap-[2px]">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn("w-[3px] rounded-[1px]", i <= freshness(toilet) ? "bg-good" : "bg-fg/20")}
              style={{ height: 4 + i * 2.5 }}
            />
          ))}
        </span>
        <span>
        {t.card.lastWorked(ago(toilet.confirmedAt, lang))}
        {toilet.reportedAt && toilet.reportedAt > toilet.confirmedAt && t.card.lastFailed(ago(toilet.reportedAt, lang))}
        </span>
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

      {toilet.note && (
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl bg-fg/[0.05] px-3 py-2.5">
          <Signpost className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
          <p className="min-w-0 text-sm break-words [overflow-wrap:anywhere]">
            <span className="block text-xs font-semibold text-haze">{t.card.howToFind}</span>
            {toilet.note}
          </p>
        </div>
      )}

      {/* Anything wrong with the place itself (not the code): offensive, private, gone */}
      {!toilet.mine && (
        <div className="mt-3">
          <button type="button" onClick={() => setReporting("pick")} className={cn(btn.secondary, btn.sm, "w-full gap-2 text-[0.8125rem]")}>
            <Flag className="size-3.5" aria-hidden /> {t.card.report}
          </button>
        </div>
      )}
    </div>
  );
}
