"use client";

import { Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { btn } from "@/components/ui/buttons";
import { useT } from "@/lib/i18n";
import { finishEmailSignIn, signInWithGoogle, startEmailSignIn, useAuthOptions, type SignInOutcome } from "@/lib/sync";
import { cn } from "@/lib/utils";

/*
  Sign in or create an account: "Continue with Google" (Google's own button) and "Continue with email"
  (a six-digit code we mail). Used on the intro and in Settings. With a profile already on this phone a new
  account is linked to it; with an existing account the phone is signed into it.
*/

type GoogleId = {
  initialize: (o: { client_id: string; callback: (r: { credential: string }) => void }) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let googleScript: Promise<void> | null = null;
/** Google's sign-in script, loaded only when this screen is shown (so nothing is sent to Google before that). */
function loadGoogle() {
  googleScript ??= new Promise<void>((resolve, reject) => {
    if (window.google) return resolve();
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script failed"));
    document.head.appendChild(script);
  }).catch((e) => {
    googleScript = null;
    throw e;
  });
  return googleScript;
}

export function AccountSignIn({ onDone, className }: { onDone: () => void; className?: string }) {
  const { t, lang } = useT();
  const options = useAuthOptions();
  const button = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"choose" | "email" | "code">("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  const say = (outcome: SignInOutcome | "limited") => {
    const text = t.account.problems[outcome];
    setProblem(text ?? t.account.problems.failed);
  };

  const clientId = options?.google ?? null;
  useEffect(() => {
    if (!clientId || mode !== "choose") return;
    let cancelled = false;
    loadGoogle()
      .then(() => {
        if (cancelled || !window.google || !button.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            setBusy(true);
            setProblem(null);
            const outcome = await signInWithGoogle(credential);
            setBusy(false);
            if (outcome === "ok") done.current();
            else say(outcome);
          },
        });
        button.current.innerHTML = "";
        window.google.accounts.id.renderButton(button.current, { type: "standard", theme: "filled_black", size: "large", shape: "pill", text: "continue_with", logo_alignment: "left", width: Math.min(320, button.current.clientWidth || 320), locale: lang });
      })
      .catch(() => setProblem(t.account.problems.google));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, mode, lang]);

  if (!options || (!options.google && !options.email)) return null;

  const sendCode = async () => {
    setBusy(true);
    setProblem(null);
    const result = await startEmailSignIn(email.trim());
    setBusy(false);
    if (result === "ok") setMode("code");
    else say(result);
  };
  const check = async () => {
    setBusy(true);
    setProblem(null);
    const outcome = await finishEmailSignIn(email.trim(), code.trim());
    setBusy(false);
    if (outcome === "ok") onDone();
    else say(outcome);
  };
  const field = "h-12 w-full rounded-2xl border border-dusk-edge bg-dusk px-4 text-[1rem] text-ink outline-none placeholder:text-haze/70 focus:border-brand";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {mode === "choose" && (
        <>
          {options.google && <div ref={button} className="flex min-h-11 justify-center" aria-label={t.account.google} />}
          {options.email && (
            <button type="button" onClick={() => setMode("email")} className={cn(btn.secondary, btn.md, "w-full gap-2")}>
              <Mail className="size-4" aria-hidden /> {t.account.email}
            </button>
          )}
        </>
      )}
      {mode === "email" && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.includes("@")) void sendCode();
          }}
        >
          <label className="flex flex-col gap-1.5 text-[0.875rem] font-semibold text-haze">
            {t.account.emailLabel}
            <input type="email" inputMode="email" autoComplete="email" autoFocus value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={field} />
          </label>
          <button type="submit" disabled={busy || !email.includes("@")} className={cn(btn.primary, btn.md, "w-full")}>
            {busy ? t.account.sending : t.account.sendCode}
          </button>
          <button type="button" onClick={() => setMode("choose")} className={cn(btn.quiet, btn.sm, "self-center")}>
            {t.account.back}
          </button>
        </form>
      )}
      {mode === "code" && (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.length === 6) void check();
          }}
        >
          <p className="text-[0.9375rem] leading-snug text-haze">{t.account.codeSent(email.trim())}</p>
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            aria-label={t.account.codeLabel}
            placeholder="000000"
            className={cn(field, "text-center font-mono text-[1.5rem] tracking-[0.4em]")}
          />
          <button type="submit" disabled={busy || code.length !== 6} className={cn(btn.primary, btn.md, "w-full")}>
            {busy ? t.account.checking : t.account.signIn}
          </button>
          <button type="button" onClick={() => { setMode("email"); setCode(""); setProblem(null); }} className={cn(btn.quiet, btn.sm, "self-center")}>
            {t.account.back}
          </button>
        </form>
      )}
      {problem && (
        <p role="alert" className="text-center text-sm text-stale">
          {problem}
        </p>
      )}
    </div>
  );
}
