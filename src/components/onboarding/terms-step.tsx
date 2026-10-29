"use client";

import { Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LegalBody } from "@/components/legal-page";
import { ActionButton } from "@/components/onboarding/action-button";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** The terms, privacy notice and imprint in one scroll. The agree button only works once you have reached the end. */
export function TermsStep({ onAgree }: { onAgree: () => void }) {
  const { t } = useT();
  const box = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const done = progress >= 1;

  const measure = useCallback(() => {
    const el = box.current;
    if (!el) return;
    const room = el.scrollHeight - el.clientHeight;
    // Nothing to scroll (very tall screen): counts as read.
    setProgress((p) => (room <= 8 ? 1 : Math.max(p, Math.min(1, el.scrollTop / (room - 8)))));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div className="flex h-dvh flex-col px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)]">
      <h1 className="pt-3 text-[1.75rem] leading-tight font-bold tracking-tight">{t.welcome.termsTitle}</h1>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-fg/10" aria-hidden>
        <div className="h-full rounded-full bg-brand transition-[width] duration-150" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <div
        ref={box}
        onScroll={measure}
        tabIndex={0}
        role="region"
        aria-label={t.welcome.termsTitle}
        className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-[22px] bg-fg/[0.055] p-5 pb-8"
      >
        <div className="flex flex-col gap-10">
          <LegalBody doc="terms" />
          <LegalBody doc="privacy" />
          <LegalBody doc="imprint" />
        </div>
      </div>
      <p className={cn("mt-3 flex items-center justify-center gap-1.5 text-center text-[0.8125rem]", done ? "text-good" : "text-haze")} aria-live="polite">
        {done && <Check className="size-4" aria-hidden />}
        {done ? t.welcome.termsDone : t.welcome.termsScroll}
      </p>
      <p className="mt-2 px-1 text-center text-xs leading-relaxed text-haze">{t.welcome.termsNote}</p>
      <ActionButton className="mt-3" disabled={!done} onClick={onAgree}>
        {t.welcome.termsAgree}
      </ActionButton>
    </div>
  );
}
