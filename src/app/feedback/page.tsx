"use client";

import { ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BACK, PageTransition } from "@/components/page-transition";
import { btn } from "@/components/ui/buttons";
import { ApiFailure, REMOTE, api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { cleanText } from "@/lib/limits";
import { getIdentityToken } from "@/lib/sync";
import { cn } from "@/lib/utils";

const MAX = 1000;

/** A box for anything: a wrong code, a place that is missing, an idea. It goes to the person who runs the app. */
export default function FeedbackPage() {
  const { t } = useT();
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed" | "limited">("idle");

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (message.trim().length < 3) return;
    setState("sending");
    try {
      await api("/v1/feedback", { method: "POST", token: getIdentityToken() ?? undefined, body: { message: message.trim(), contact: contact.trim(), page: "settings" } });
      setMessage("");
      setState("sent");
    } catch (e) {
      setState(e instanceof ApiFailure && e.status === 429 ? "limited" : "failed");
    }
  };

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-16">
        <div className="flex h-11 items-center">
          <Link href="/settings" transitionTypes={BACK} className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full pr-3 pl-1.5 text-[0.9375rem] text-brand active:opacity-60">
            <ArrowLeft className="size-[1.125rem]" strokeWidth={2} aria-hidden /> {t.settings.title}
          </Link>
        </div>
        <h1 className="mt-1 px-1 text-[2rem] leading-tight font-bold tracking-tight">{t.feedback.title}</h1>
        <p className="mt-2 px-1 text-[1rem] leading-snug text-haze">{t.feedback.intro}</p>

        {!REMOTE ? (
          <p className="mt-8 rounded-[1.25rem] bg-fg/[0.06] p-4 text-[0.9375rem] text-haze">{t.feedback.demo}</p>
        ) : state === "sent" ? (
          <div role="status" className="mt-8 rounded-[1.25rem] bg-fg/[0.06] p-5">
            <p className="text-[1.125rem] font-semibold">{t.feedback.thanks}</p>
            <button type="button" onClick={() => setState("idle")} className={cn(btn.secondary, btn.sm, "mt-4 px-4")}>
              {t.feedback.another}
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="mt-6 flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-[0.875rem] font-semibold text-haze">
              {t.feedback.message}
              <textarea
                value={message}
                rows={6}
                maxLength={MAX}
                onChange={(e) => {
                  setMessage(cleanText(e.target.value, MAX));
                  if (state !== "sending") setState("idle");
                }}
                className="w-full rounded-2xl border border-dusk-edge bg-dusk px-3.5 py-3 text-[1rem] font-normal text-ink outline-none placeholder:text-haze/60 focus:border-brand"
                placeholder={t.feedback.placeholder}
              />
              <span className="self-end text-xs font-normal tabular-nums">{message.length}/{MAX}</span>
            </label>
            <label className="flex flex-col gap-1.5 text-[0.875rem] font-semibold text-haze">
              {t.feedback.contact}
              <input
                type="text"
                inputMode="email"
                autoComplete="email"
                maxLength={100}
                value={contact}
                onChange={(e) => setContact(cleanText(e.target.value, 100))}
                className="h-12 w-full rounded-full border border-dusk-edge bg-dusk px-4 text-[1rem] font-normal text-ink outline-none placeholder:text-haze/60 focus:border-brand"
                placeholder={t.feedback.contactHint}
              />
            </label>
            {state === "failed" && <p role="alert" className="text-sm text-stale">{t.feedback.failed}</p>}
            {state === "limited" && <p role="alert" className="text-sm text-stale">{t.feedback.limited}</p>}
            <p className="text-[0.8125rem] leading-relaxed text-haze">{t.feedback.note}</p>
            <button type="submit" disabled={state === "sending" || message.trim().length < 3} className={cn(btn.primary, btn.md, "mt-1 gap-2")}>
              <Send className="size-4" aria-hidden /> {state === "sending" ? t.feedback.sending : t.feedback.send}
            </button>
          </form>
        )}
      </main>
    </PageTransition>
  );
}
