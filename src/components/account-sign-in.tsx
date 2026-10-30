"use client";

import { Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { btn } from "@/components/ui/buttons";
import { useT } from "@/lib/i18n";
import { finishEmailSignIn, signInWithGoogle, startEmailSignIn, useAuthOptions, type SignInOutcome } from "@/lib/sync";
import { cn } from "@/lib/utils";

/*
  Sign in or create an account: "Continue with Google" (our own button, drawn to Google's brand rules,
  opening Google's account picker) and "Continue with email" (a six-digit code we mail). Used on the
  intro, in the "sign in to share" sheet and in Settings. With a profile already on this phone a new
  account is linked to it; with an existing account the phone is signed into it.
*/

type TokenClient = { requestAccessToken: (o?: { prompt?: string }) => void };
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (o: {
            client_id: string;
            scope: string;
            callback: (r: { access_token?: string; error?: string }) => void;
            error_callback?: (e: { type?: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

let googleScript: Promise<void> | null = null;
/** Google's sign-in script, loaded only when a sign-in screen is shown (so nothing is sent to Google before that). */
function loadGoogle() {
  googleScript ??= new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
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

/** Google's "G", in its four colours (as the brand rules ask). */
export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function AccountSignIn({ onDone, className, light = false }: { onDone: () => void; className?: string; light?: boolean }) {
  const { t } = useT();
  const options = useAuthOptions();
  const [mode, setMode] = useState<"choose" | "email" | "code">("choose");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"google" | "email" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const tokenClient = useRef<TokenClient | null>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  const say = (outcome: SignInOutcome | "limited") => {
    const text = t.account.problems[outcome];
    setProblem(text ?? t.account.problems.failed);
  };

  // Load Google's script as soon as the button is on screen, so the tap opens the picker straight away
  // (browsers only allow the popup when it opens right after the tap).
  const clientId = options?.google ?? null;
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGoogle()
      .then(() => {
        if (cancelled || !window.google?.accounts?.oauth2) return;
        tokenClient.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email",
          callback: async (r) => {
            if (!r.access_token) return setBusy(null);
            setProblem(null);
            const outcome = await signInWithGoogle({ accessToken: r.access_token });
            setBusy(null);
            if (outcome === "ok") done.current();
            else say(outcome);
          },
          // Closed the picker, or the popup was blocked: just let them try again.
          error_callback: () => setBusy(null),
        });
      })
      .catch(() => setProblem(t.account.problems.google));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const google = () => {
    if (!tokenClient.current) return setProblem(t.account.problems.google);
    setProblem(null);
    setBusy("google");
    tokenClient.current.requestAccessToken();
  };

  if (!options || (!options.google && !options.email)) return null;

  const sendCode = async () => {
    setBusy("email");
    setProblem(null);
    const result = await startEmailSignIn(email.trim());
    setBusy(null);
    if (result === "ok") setMode("code");
    else say(result);
  };
  const check = async () => {
    setBusy("email");
    setProblem(null);
    const outcome = await finishEmailSignIn(email.trim(), code.trim());
    setBusy(null);
    if (outcome === "ok") onDone();
    else say(outcome);
  };
  const field = "h-14 w-full rounded-2xl border border-dusk-edge bg-dusk px-4 text-[1.0625rem] text-ink outline-none placeholder:text-haze/70 focus:border-brand";
  // Big, even buttons: Google's is white with the coloured G (its brand rules), email is a quiet outline.
  const big = "relative inline-flex h-14 w-full items-center justify-center gap-3 rounded-full px-6 text-[1.0625rem] font-semibold tracking-[-0.01em] transition-[background-color,scale,opacity] duration-200 select-none active:scale-[0.98] disabled:opacity-60";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {mode === "choose" && (
        <>
          {options.google && (
            <button type="button" onClick={google} disabled={busy !== null} className={cn(big, "bg-white text-[#1f1f1f] shadow-[0_1px_2px_rgb(0_0_0/0.25)]", light && "ring-1 ring-black/10")}>
              <GoogleMark className="absolute left-5 size-5" />
              {busy === "google" ? t.account.checking : t.account.google}
            </button>
          )}
          {options.email && (
            <button type="button" onClick={() => setMode("email")} disabled={busy !== null} className={cn(big, "border border-fg/20 bg-fg/[0.04] text-ink hover:bg-fg/[0.08]")}>
              <Mail className="absolute left-5 size-5" strokeWidth={1.75} aria-hidden />
              {t.account.email}
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
          <button type="submit" disabled={busy !== null || !email.includes("@")} className={cn(btn.primary, "h-14 w-full rounded-full text-[1.0625rem]")}>
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
          <button type="submit" disabled={busy !== null || code.length !== 6} className={cn(btn.primary, "h-14 w-full rounded-full text-[1.0625rem]")}>
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
