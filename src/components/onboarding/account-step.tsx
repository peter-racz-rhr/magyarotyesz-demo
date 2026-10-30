"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { AccountSignIn } from "@/components/account-sign-in";
import { Wordmark } from "@/components/wordmark";
import { useT } from "@/lib/i18n";

/**
 * Sign in, or look around as a guest. The layout follows the big apps' sign-in sheets: a short promise
 * at the top, what an account gets you, then one stack of full-width buttons (Google first, white, as
 * Google's brand rules ask), and the guest way out as a plain text button underneath.
 */
export function AccountStep({ onDone }: { onDone: (how: "account" | "guest") => void }) {
  const { t } = useT();
  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)]">
      {/* A soft light from above, in the brand colour */}
      <div aria-hidden className="pointer-events-none absolute -top-56 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[90px]" />
      <div className="relative flex h-12 items-center">
        <Wordmark className="text-[1.375rem] font-bold tracking-[-0.04em]" />
      </div>
      <div className="relative mt-auto pt-10">
        <h1 className="text-[2.75rem] leading-[0.98] font-bold tracking-[-0.03em] [font-stretch:90%]">{t.account.hello}</h1>
        <p className="mt-3 max-w-[30ch] text-[1.0625rem] leading-snug text-haze">{t.account.pitch}</p>
        <ul className="mt-6 flex flex-col gap-2.5">
          {t.account.perks.map((perk) => (
            <li key={perk} className="flex items-start gap-3 text-[0.9375rem] leading-snug">
              <span className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-brand text-night">
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
              <span className="min-w-0">{perk}</span>
            </li>
          ))}
        </ul>

        <AccountSignIn className="mt-8" onDone={() => onDone("account")} />

        <div className="my-4 flex items-center gap-3 text-[0.8125rem] text-haze" aria-hidden>
          <span className="h-px flex-1 bg-fg/15" />
          <span>·</span>
          <span className="h-px flex-1 bg-fg/15" />
        </div>
        <button type="button" onClick={() => onDone("guest")} className="h-12 w-full rounded-full text-[1rem] font-semibold text-ink underline-offset-4 hover:underline active:opacity-70">
          {t.account.guest}
        </button>
        <p className="mt-1 text-center text-[0.8125rem] leading-snug text-haze">{t.account.guestHint}</p>
        <p className="mt-5 text-center text-[0.75rem] leading-relaxed text-haze/80">
          <Link href="/terms" className="underline underline-offset-2">
            {t.account.legal}
          </Link>
        </p>
      </div>
    </div>
  );
}
