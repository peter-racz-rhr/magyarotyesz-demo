"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { UserRound } from "lucide-react";
import { useEffect } from "react";
import { AccountSignIn } from "@/components/account-sign-in";
import { useT } from "@/lib/i18n";
import { loadAuthOptions, setSignInAsked, useSignInAsked } from "@/lib/sync";

/** Opens when a guest tries something that needs an account (adding a place, a code, a vote). */
export function SignInSheet() {
  const { t } = useT();
  const open = useSignInAsked();
  const reduce = useReducedMotion();
  const close = () => setSignInAsked(false);

  useEffect(() => {
    void loadAuthOptions();
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="sign-in" className="fixed inset-0 z-[90] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }}>
          <button type="button" aria-label={t.account.later} onClick={close} className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-in-title"
            className="relative w-full max-w-md rounded-t-[32px] bg-night px-6 pt-3 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-[0_-12px_40px_rgb(0_0_0/0.35)]"
            initial={{ y: reduce ? 0 : "100%" }}
            animate={{ y: 0 }}
            exit={{ y: reduce ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div aria-hidden className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-fg/20" />
            <span className="grid size-12 place-items-center rounded-full bg-brand/15 text-brand">
              <UserRound className="size-6" aria-hidden />
            </span>
            <h2 id="sign-in-title" className="mt-4 text-[1.75rem] leading-tight font-bold tracking-[-0.02em]">
              {t.account.shareTitle}
            </h2>
            <p className="mt-2 text-[1rem] leading-snug text-haze">{t.account.shareBody}</p>
            <AccountSignIn className="mt-6" onDone={close} />
            <button type="button" onClick={close} className="mt-3 h-12 w-full rounded-full text-[1rem] font-semibold text-haze active:opacity-70">
              {t.account.later}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
