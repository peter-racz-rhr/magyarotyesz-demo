"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { btn } from "@/components/ui/buttons";
import { LiquidSurface } from "@/components/ui/liquid-surface";
import { clearCheck, usePendingCheck } from "@/lib/code-check";
import { spotMessage, useT } from "@/lib/i18n";
import { checkOnTheSpot } from "@/lib/on-the-spot";
import { buzz } from "@/lib/haptics";
import { confirmCode, reportCode, useToilets } from "@/lib/toilets";
import { requireAccount } from "@/lib/sync";
import { cn } from "@/lib/utils";

/** Ask after this long: enough time to have tried the door. */
const ASK_AFTER_MS = 90_000;
/** Give up after this long: nobody remembers by then. */
const FORGET_AFTER_MS = 6 * 3600_000;

/**
 * "Did the code at ... work?": a few minutes after you looked at a code, a small card asks. It is the
 * cheapest way to keep codes honest, and one tap answers it. A vote needs you to be near the place, like
 * every vote; if you have already walked away, it says so instead of guessing.
 */
export function CodeCheckPrompt() {
  const { t } = useT();
  const pending = usePendingCheck();
  const toilets = useToilets();
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  // Look again every few seconds, and the moment the app comes back to the front.
  useEffect(() => {
    if (!pending) return;
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 5000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [pending]);

  const toilet = pending ? toilets.find((x) => x.id === pending.id) : undefined;
  const age = pending ? now - pending.at : 0;
  // Gone, already answered, or yours: nothing to ask.
  const nothingToAsk = !!pending && (!toilet || toilet.mine || !!toilet.myVote || age > FORGET_AFTER_MS);
  useEffect(() => {
    if (nothingToAsk) clearCheck();
  }, [nothingToAsk]);

  if (!pending || !toilet || nothingToAsk || age < ASK_AFTER_MS || document.visibilityState === "hidden") return null;

  const answer = async (works: boolean) => {
    if (!requireAccount()) return;
    setBusy(true);
    setMessage("");
    const spot = await checkOnTheSpot(toilet);
    setBusy(false);
    if (!spot.ok) {
      buzz("warn");
      return setMessage(spotMessage(t, spot));
    }
    if (works) confirmCode(toilet.id, spot.location);
    else reportCode(toilet.id, spot.location);
    buzz(works ? "success" : "no");
    clearCheck();
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+9rem)] z-[60] flex justify-center px-4">
      <LiquidSurface radius={28} className="pointer-events-auto w-full max-w-sm animate-in fade-in slide-in-from-bottom-3">
        <div role="status" className="flex flex-col gap-3 p-4">
          <p className="text-[0.9375rem] leading-snug font-semibold">{t.check.title(toilet.name)}</p>
          {message && <p className="text-[0.8125rem] leading-snug text-stale">{message}</p>}
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => answer(true)} className={cn(btn.primary, btn.sm, "flex-1 gap-1.5")}>
              <ThumbsUp className="size-4" aria-hidden /> {t.check.yes}
            </button>
            <button type="button" disabled={busy} onClick={() => answer(false)} className={cn(btn.secondary, btn.sm, "gap-1.5 px-4")}>
              <ThumbsDown className="size-4" aria-hidden /> {t.check.no}
            </button>
            <button type="button" onClick={clearCheck} className={cn(btn.quiet, btn.sm, "px-3")}>
              {t.check.later}
            </button>
          </div>
        </div>
      </LiquidSurface>
    </div>
  );
}
