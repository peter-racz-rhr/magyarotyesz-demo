"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BACK, PageTransition } from "@/components/page-transition";
import { useT } from "@/lib/i18n";
import { OPERATOR } from "@/lib/legal";

/** The public page Google Play asks for: how to delete your account and data, from the app or by email. Needs no sign-in. */
export default function Page() {
  const { t } = useT();
  const d = t.deleteAccount;
  return (
    <PageTransition>
      <main className="mx-auto max-w-2xl px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-16">
        <Link href="/settings" transitionTypes={BACK} className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-haze hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> {t.legal.back}
        </Link>
        <h1 className="mt-4 text-[1.75rem] leading-tight font-bold">{d.title}</h1>
        <p className="mt-3 leading-relaxed text-ink/90">{d.intro}</p>

        <h2 className="t-section mt-8">{d.appTitle}</h2>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 leading-relaxed text-ink/85">
          {d.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <h2 className="t-section mt-8">{d.mailTitle}</h2>
        <p className="mt-2 leading-relaxed text-ink/85">
          {d.mailBody}{" "}
          <a href={`mailto:${OPERATOR.email}?subject=${encodeURIComponent(d.mailSubject)}`} className="text-brand underline">
            {OPERATOR.email}
          </a>
        </p>

        <h2 className="t-section mt-8">{d.whatTitle}</h2>
        <p className="mt-2 leading-relaxed text-ink/85">{d.whatBody}</p>
        <h2 className="t-section mt-8">{d.keptTitle}</h2>
        <p className="mt-2 leading-relaxed text-ink/85">{d.keptBody}</p>
        <p className="mt-8 text-sm text-haze">
          <Link href="/privacy" className="text-brand underline">
            {t.legal.privacy}
          </Link>
        </p>
      </main>
    </PageTransition>
  );
}
