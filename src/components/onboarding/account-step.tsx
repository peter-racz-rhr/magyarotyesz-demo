"use client";

import { UserRound } from "lucide-react";
import { AccountSignIn } from "@/components/account-sign-in";
import { ActionButton } from "@/components/onboarding/action-button";
import { Wordmark } from "@/components/wordmark";
import { useT } from "@/lib/i18n";

/** Optional: sign in or create an account, so the profile survives a new browser or phone. */
export function AccountStep({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  return (
    <div className="flex h-full flex-col px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
      <div className="flex h-12 items-center">
        <Wordmark className="text-[1.375rem] font-bold tracking-[-0.04em]" />
      </div>
      <div className="mt-auto">
        <span className="grid size-12 place-items-center rounded-full bg-brand/15 text-brand">
          <UserRound className="size-6" aria-hidden />
        </span>
        <h1 className="mt-4 text-[2.5rem] leading-[0.98] font-bold tracking-[-0.03em] [font-stretch:90%]">{t.account.title}</h1>
        <p className="mt-3 text-[1.0625rem] leading-snug text-haze">{t.account.intro}</p>
        <AccountSignIn className="mt-6" onDone={onDone} />
        <ActionButton variant="quiet" className="mt-4 h-12 w-full" onClick={onDone}>
          {t.account.skip}
        </ActionButton>
        <p className="mt-3 text-center text-xs leading-relaxed text-haze">{t.account.note}</p>
      </div>
    </div>
  );
}
