"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BACK, PageTransition } from "@/components/page-transition";
import { useT } from "@/lib/i18n";
import { LEGAL_REVIEWED, OPERATOR, type DocKey } from "@/lib/legal";
import { LEGAL } from "@/lib/legal-text";
import { useSettings } from "@/lib/settings";

const LINKS: DocKey[] = ["terms", "privacy", "imprint"];

/** Fills {operator}, {email}, {address} and {phone}; anything unset (but the optional phone) shows as a visible placeholder. */
function fill(text: string, missing: string) {
  const values = { operator: OPERATOR.name, email: OPERATOR.email, address: OPERATOR.address, phone: OPERATOR.phone };
  const parts = text.split(/(\{operator\}|\{email\}|\{address\}|\{phone\})/);
  return parts.map((part, i) => {
    const key = part.match(/^\{(operator|email|address|phone)\}$/)?.[1] as keyof typeof values | undefined;
    if (!key) return part;
    const value = values[key];
    if (value) return key === "email" ? <a key={i} href={`mailto:${value}`} className="text-good underline">{value}</a> : value;
    return <mark key={i} className="rounded bg-stale/25 px-1 text-ink">[{missing}: {key}]</mark>;
  });
}

/** The text of one document without the page around it (used where the terms must be read before agreeing). */
export function LegalBody({ doc }: { doc: DocKey }) {
  const { t } = useT();
  const { lang } = useSettings();
  const d = LEGAL[lang][doc];
  return (
    <article>
      <h2 className="text-[1.375rem] leading-tight font-bold">{d.title}</h2>
      <p className="mt-1 text-sm text-haze">{d.updated}</p>
      {d.intro && <p className="mt-4 leading-relaxed text-ink/90">{fill(d.intro, t.legal.missing)}</p>}
      {d.sections.map((s) => (
        <section key={s.h} className="mt-6">
          <h3 className="text-[1.0625rem] font-semibold">{s.h}</h3>
          {s.p.filter((p) => p !== "{phone}" || OPERATOR.phone).map((p) => (
            <p key={p} className="mt-2 text-[0.9375rem] leading-relaxed text-ink/85">
              {fill(p, t.legal.missing)}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

export function LegalPage({ doc }: { doc: DocKey }) {
  const { t } = useT();
  const { lang } = useSettings();
  const d = LEGAL[lang][doc];
  return (
    <PageTransition>
      <main className="mx-auto max-w-2xl px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-16">
        <Link href="/profile" transitionTypes={BACK} className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-haze hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> {t.legal.back}
        </Link>
        <h1 className="mt-4 text-[1.75rem] leading-tight font-bold">{d.title}</h1>
        <p className="mt-1 text-sm text-haze">{d.updated}</p>
        {d.intro && <p className="mt-5 leading-relaxed text-ink/90">{fill(d.intro, t.legal.missing)}</p>}
        {d.sections.map((s) => (
          <section key={s.h} className="mt-7">
            <h2 className="t-section">{s.h}</h2>
            {s.p.filter((p) => p !== "{phone}" || OPERATOR.phone).map((p) => (
              <p key={p} className="mt-2 leading-relaxed text-ink/85">
                {fill(p, t.legal.missing)}
              </p>
            ))}
          </section>
        ))}
        <nav aria-label={t.legal.more} className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-dusk-edge pt-5 text-sm">
          {LINKS.filter((k) => k !== doc).map((k) => (
            <Link key={k} href={`/${k}`} className="text-good underline">
              {LEGAL[lang][k].title}
            </Link>
          ))}
        </nav>
        {OPERATOR.email && (
          <section className="mt-10 rounded-[22px] bg-fg/[0.055] p-5">
            <h2 className="text-[1.0625rem] font-semibold">{t.legal.contact}</h2>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-haze">{t.legal.contactBody}</p>
            <a href={`mailto:${OPERATOR.email}`} className="mt-4 inline-flex h-11 items-center rounded-full bg-ink px-5 text-[0.9375rem] font-semibold text-night active:opacity-80">
              {OPERATOR.email}
            </a>
          </section>
        )}
        {!LEGAL_REVIEWED && <p className="mt-6 text-xs leading-relaxed text-haze">{t.legal.draft}</p>}
      </main>
    </PageTransition>
  );
}

/** "Terms · Privacy · Imprint" as small links. */
export function LegalLinks({ className }: { className?: string }) {
  const { lang } = useSettings();
  return (
    <span className={className}>
      {LINKS.map((k, i) => (
        <span key={k}>
          {i > 0 && " · "}
          <Link href={`/${k}`} className="underline underline-offset-2">
            {LEGAL[lang][k].title}
          </Link>
        </span>
      ))}
    </span>
  );
}
