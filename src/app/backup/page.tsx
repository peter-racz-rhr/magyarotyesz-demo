"use client";

import { ArrowLeft, Check, Copy, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { BACK, PageTransition } from "@/components/page-transition";
import { CARD } from "@/components/settings-ui";
import { btn } from "@/components/ui/buttons";
import { REMOTE } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { backupCode, restoreBackup, useUserId } from "@/lib/sync";
import { cn } from "@/lib/utils";

/** Keep a profile safe, or move it to another phone: a code and a QR to save, and a box to restore one. */
export default function BackupPage() {
  const { t } = useT();
  const userId = useUserId(); // changes when a restore swaps the profile
  const [shown, setShown] = useState(false);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [input, setInput] = useState("");
  const [step, setStep] = useState<"idle" | "confirm" | "busy">("idle");
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const code = shown && userId ? backupCode() : null;

  // A scanned QR opens this page with the code after "#restore=": put it in the box.
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#restore=")) queueMicrotask(() => setInput(hash.slice(1)));
  }, []);

  useEffect(() => {
    if (!code) return;
    let live = true;
    QRCode.toDataURL(`${window.location.origin}/backup#restore=${code}`, { margin: 1, width: 360, color: { dark: "#0b0d10", light: "#ffffff" } }).then((url) => live && setQr(url));
    return () => {
      live = false;
    };
  }, [code]);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Blocked: the code is on screen.
    }
  };

  const restore = async () => {
    setStep("busy");
    const result = await restoreBackup(input);
    setStep("idle");
    if (result === "ok") {
      setInput("");
      setShown(false);
      window.history.replaceState(null, "", "/backup");
    }
    setMessage({ ok: result === "ok", text: result === "ok" ? t.backup.done : t.backup[result] });
  };

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-16">
        <div className="flex h-11 items-center">
          <Link href="/settings" transitionTypes={BACK} className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full pr-3 pl-1.5 text-[0.9375rem] text-good active:opacity-60">
            <ArrowLeft className="size-[1.125rem]" strokeWidth={2} aria-hidden /> {t.backup.back}
          </Link>
        </div>
        <h1 className="mt-1 px-1 text-[2rem] leading-tight font-bold tracking-tight">{t.backup.title}</h1>

        {!REMOTE ? (
          <p className={cn(CARD, "mt-6 p-5 text-[0.9375rem] text-haze")}>{t.backup.demo}</p>
        ) : (
          <>
            <p className="mt-3 px-1 text-[0.9375rem] leading-relaxed text-haze">{t.backup.intro}</p>

            <section className={cn(CARD, "mt-6 p-5")}>
              {!userId ? (
                <p className="text-[0.9375rem] text-haze">{t.backup.noProfile}</p>
              ) : (
                <>
                  <button type="button" onClick={() => setShown((v) => !v)} className={cn(btn.secondary, btn.md, "w-full gap-2")}>
                    {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                    {shown ? t.backup.hide : t.backup.show}
                  </button>
                  {code && (
                    <div className="mt-5 flex flex-col items-center gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element -- a QR code made on this phone */}
                      {qr && <img src={qr} alt="" width={180} height={180} className="rounded-2xl" />}
                      <p className="text-center text-[0.8125rem] text-haze">{t.backup.qrNote}</p>
                      <p className="w-full rounded-xl bg-black/40 p-3 font-mono text-[0.75rem] leading-relaxed break-all select-all">{code}</p>
                      <button type="button" onClick={copy} className={cn(btn.secondary, btn.sm, "gap-2 px-4")}>
                        {copied ? <Check className="size-4 text-good" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                        {copied ? t.backup.copied : t.backup.copy}
                      </button>
                      <p className="text-center text-[0.8125rem] text-stale">{t.backup.warning}</p>
                    </div>
                  )}
                </>
              )}
            </section>

            <h2 className="mt-8 mb-2 px-5 text-[0.9375rem] font-semibold text-ink/65">{t.backup.restoreTitle}</h2>
            <section className={cn(CARD, "p-5")}>
              <p className="text-[0.8125rem] leading-relaxed text-haze">{t.backup.restoreHint}</p>
              <input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setStep("idle");
                  setMessage(null);
                }}
                placeholder={t.backup.restorePlaceholder}
                aria-label={t.backup.restorePlaceholder}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className="mt-3 h-12 w-full rounded-full bg-black/40 px-4 font-mono text-[0.8125rem] outline-none placeholder:font-sans placeholder:text-haze/60 focus:bg-black/60"
              />
              {step === "confirm" ? (
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex-1 text-sm">{t.backup.confirm}</span>
                  <button type="button" onClick={() => setStep("idle")} className={cn(btn.quiet, btn.sm)}>
                    {t.card.cancel}
                  </button>
                  <button type="button" onClick={restore} className={cn(btn.sm, "inline-flex items-center rounded-full bg-ink px-4 font-semibold text-night")}>
                    {t.backup.confirmYes}
                  </button>
                </div>
              ) : (
                <button type="button" disabled={!input.trim() || step === "busy"} onClick={() => setStep("confirm")} className={cn(btn.primary, btn.md, "mt-4 w-full")}>
                  {t.backup.restore}
                </button>
              )}
              {message && (
                <p role="status" className={cn("mt-3 text-sm", message.ok ? "text-good" : "text-stale")}>
                  {message.text}
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </PageTransition>
  );
}
