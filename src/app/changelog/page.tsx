"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BACK, PageTransition } from "@/components/page-transition";
import { CHANGELOG } from "@/lib/changelog";
import { useT } from "@/lib/i18n";

export default function ChangelogPage() {
  const { t, lang } = useT();
  const day = (iso: string) => new Date(iso).toLocaleDateString(lang === "hu" ? "hu-HU" : "en-GB", { dateStyle: "long" });
  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-16">
        <div className="flex h-11 items-center">
          <Link href="/settings" transitionTypes={BACK} className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full pr-3 pl-1.5 text-[0.9375rem] text-brand active:opacity-60">
            <ArrowLeft className="size-[1.125rem]" strokeWidth={2} aria-hidden /> {t.settings.title}
          </Link>
        </div>
        <h1 className="mt-1 px-1 text-[2rem] leading-tight font-bold tracking-tight">{t.settings.whatsNew}</h1>
        <div className="mt-6 flex flex-col gap-8">
          {CHANGELOG.map((entry) => (
            <section key={entry.date} aria-labelledby={`c-${entry.date}`}>
              <p className="px-1 text-[0.8125rem] text-haze">{day(entry.date)}</p>
              <h2 id={`c-${entry.date}`} className="mt-0.5 px-1 text-[1.375rem] font-bold tracking-tight">
                {entry.title[lang]}
              </h2>
              <ul className="mt-3 flex flex-col gap-3 rounded-[1.25rem] bg-fg/[0.06] p-4">
                {entry.items.map((item) => (
                  <li key={item.en} className="flex gap-3 text-[0.9375rem] leading-snug">
                    <span aria-hidden className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-brand" />
                    {item[lang]}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </PageTransition>
  );
}
