"use client";

import { pullProfileNow } from "@/lib/profile-sync";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion } from "motion/react";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ActionButton } from "@/components/onboarding/action-button";
import { HowStep } from "@/components/onboarding/how-step";
import { AccountStep } from "@/components/onboarding/account-step";
import { ProfileStep } from "@/components/onboarding/profile-step";
import { TermsStep } from "@/components/onboarding/terms-step";
import { FORWARD, PageTransition } from "@/components/page-transition";
import { Wordmark } from "@/components/wordmark";
import { useT } from "@/lib/i18n";
import { requestLocation } from "@/lib/location";
import { updateSettings } from "@/lib/settings";
import { hasAcceptedTerms, hasOnboarded, markOnboarded, markTermsAccepted } from "@/lib/onboarding";
import { loadAuthOptions, useAuthOptions } from "@/lib/sync";
import { cn } from "@/lib/utils";

/*
  The hook: everyone has stood at a café toilet door guessing the code.
  The keypad tries 1234 and gets it wrong (red, a shake), then types the
  real code; it goes green, the door slides open, and behind it is the
  promise: never guess again.
*/

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
const WRONG = "1234";
const RIGHT = "4821";

type Tone = "idle" | "wrong" | "right";
type Step = { at: number; run: () => void };

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

function Keypad({ typed, tone, pressed }: { typed: string; tone: Tone; pressed: { key: string; n: number } | null }) {
  const { t } = useT();
  const shake = useAnimationControls();
  useEffect(() => {
    if (tone === "wrong") void shake.start({ x: [0, -12, 11, -8, 6, -3, 0], transition: { duration: 0.45 } });
  }, [tone, shake]);

  const color = tone === "wrong" ? "var(--bad)" : tone === "right" ? "var(--good)" : "var(--ink)";

  return (
    <div className="flex flex-col items-center">
      {/* What's been typed */}
      <motion.div animate={shake} className="flex h-6 items-center gap-4" aria-hidden>
        {[0, 1, 2, 3].map((i) => {
          const filled = i < typed.length;
          return (
            <motion.span
              key={i}
              className="block size-3.5 rounded-full border-2"
              animate={{
                scale: filled ? [1.35, 1] : 1,
                backgroundColor: filled ? color : "rgba(0,0,0,0)",
                borderColor: filled ? color : "var(--dusk-edge)",
                boxShadow: tone === "right" ? `0 0 14px 3px ${color}` : "0 0 0 0 rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
            />
          );
        })}
      </motion.div>
      <p className={cn("mt-3 h-5 text-[0.75rem] font-bold tracking-[0.14em] uppercase transition-colors", tone === "wrong" ? "text-bad" : tone === "right" ? "text-good" : "text-transparent")}>
        {tone === "wrong" ? t.welcome.wrong : tone === "right" ? t.welcome.open : "·"}
      </p>

      {/* The keys */}
      <div className="mt-8 grid grid-cols-3 gap-x-6 gap-y-4" aria-hidden>
        {KEYS.map((key, i) => {
          const isPressed = pressed?.key === key;
          return (
            <motion.span
              key={key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.03, duration: 0.5, ease: EASE_OUT }}
              className="relative grid size-[4.25rem] place-items-center rounded-full border border-dusk-edge bg-dusk text-[1.75rem] font-semibold tabular-nums"
            >
              {/* A press: the key lights up and dips, then lets go */}
              <motion.span
                key={isPressed ? pressed.n : "rest"}
                className="absolute inset-0 rounded-full"
                initial={isPressed ? { opacity: 0.9, scale: 0.92 } : false}
                animate={{ opacity: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                style={{ background: tone === "wrong" ? "var(--bad)" : tone === "right" ? "var(--good)" : "var(--ink)" }}
              />
              <span className="relative">{key}</span>
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const { t } = useT();
  const reduce = useReducedMotion();
  const [typed, setTyped] = useState("");
  const [tone, setTone] = useState<Tone>("idle");
  const [pressed, setPressed] = useState<{ key: string; n: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [step, setStep] = useState<"hero" | "how" | "terms" | "account" | "profile" | "perms">("hero");
  // Someone who agreed to an earlier version of the terms is shown that they changed.
  const [returning, setReturning] = useState(false);
  // Which sign-in methods the server offers: asked now, so the answer is there by the time the terms are read.
  const auth = useAuthOptions();
  useEffect(() => {
    void loadAuthOptions();
  }, []);
  const timers = useRef<number[]>([]);

  const unlock = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    setTyped(RIGHT);
    setTone("right");
    setOpen(true);
  };

  // The little play: wrong code, shake, right code, door opens.
  useEffect(() => {
    if (reduce) {
      const t = window.setTimeout(unlock, 0);
      return () => window.clearTimeout(t);
    }
    let n = 0;
    const press = (key: string, value: string) => () => {
      n += 1;
      setPressed({ key, n });
      setTyped(value);
    };
    const steps: Step[] = [];
    let at = 1100;
    WRONG.split("").forEach((key, i) => {
      steps.push({ at, run: press(key, WRONG.slice(0, i + 1)) });
      at += 260;
    });
    steps.push({ at, run: () => setTone("wrong") });
    at += 900;
    steps.push({ at, run: () => { setTyped(""); setTone("idle"); setPressed(null); } });
    at += 450;
    RIGHT.split("").forEach((key, i) => {
      steps.push({ at, run: press(key, RIGHT.slice(0, i + 1)) });
      at += 200;
    });
    steps.push({ at, run: () => setTone("right") });
    at += 650;
    steps.push({ at, run: () => setOpen(true) });

    timers.current = steps.map((s) => window.setTimeout(s.run, s.at));
    return () => timers.current.forEach(window.clearTimeout);
  }, [reduce]);

  // Someone who already got in before the terms step existed only needs to agree.
  useEffect(() => {
    if (hasOnboarded() && !hasAcceptedTerms()) {
      queueMicrotask(() => {
        unlock();
        setReturning(true);
        setStep("terms");
      });
    } else if (hasOnboarded() && hasAcceptedTerms()) {
      router.replace("/map");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enter = async (askPermissions: boolean) => {
    if (askPermissions) {
      setLocating(true);
      // Asking for the nearest toilet is asking for location: switch it on.
      updateSettings({ location: true });
      try {
        await requestLocation();
      } catch {
        // No location: the map starts on Budapest instead.
        updateSettings({ location: false });
      }
    }
    // "Not now" is also a no to location; it can be switched on later in Settings. Notifications are asked for later, once there is something to be told about.
    if (!askPermissions) updateSettings({ location: false });
    markOnboarded();
    router.replace("/map", { transitionTypes: FORWARD });
  };

  const doorTransition = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 120, damping: 22, mass: 1.1 };

  return (
    <PageTransition>
      <main data-theme="dark" className="relative mx-auto min-h-dvh w-full max-w-md overflow-hidden bg-night text-ink">
        {/* Behind the door: the light, and the promise */}
        <div className="absolute inset-0">
          <div className="relative flex min-h-dvh flex-col px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            <div className="flex h-12 items-center">
              <Wordmark className="text-[1.375rem] font-bold tracking-[-0.04em]" />
            </div>
            <AnimatePresence>
              {open && (
                <motion.div
                  className="mt-auto"
                  initial="hidden"
                  animate="shown"
                  variants={{ shown: { transition: { staggerChildren: reduce ? 0 : 0.09, delayChildren: reduce ? 0 : 0.35 } } }}
                >
                  {[
                    <h1 key="h" className="text-[3.25rem] leading-[1] font-bold tracking-[-0.02em] [font-stretch:92%]">
                      {t.welcome.headline.map((line, i) => (
                        <span key={i} className="block">
                          {line}
                        </span>
                      ))}
                    </h1>,
                    <p key="p" className="mt-5 max-w-[26ch] text-[1.0625rem] leading-snug font-medium text-haze">
                      {t.welcome.sub}
                    </p>,
                    <div key="b" className="mt-9 flex flex-col gap-2">
                      <ActionButton onClick={() => setStep("how")}>{t.welcome.continue}</ActionButton>
                    </div>,
                  ].map((child) => (
                    <motion.div
                      key={child.key}
                      variants={{ hidden: { opacity: 0, y: 24 }, shown: { opacity: 1, y: 0 } }}
                      transition={{ duration: reduce ? 0 : 0.6, ease: EASE_OUT }}
                    >
                      {child}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Step 2: how it works, in three pictures. Step 3: the terms, read to the end. Step 4: location. */}
        {open && step === "how" && (
          <div className="absolute inset-0 z-20 bg-night">
            <HowStep onDone={() => setStep("terms")} />
          </div>
        )}
        {open && step === "terms" && (
          <div className="absolute inset-0 z-20 bg-night">
            <TermsStep
              updated={returning}
              onAgree={() => {
                markTermsAccepted();
                if (hasOnboarded()) router.replace("/map", { transitionTypes: FORWARD });
                else setStep(auth && (auth.google || auth.email) ? "account" : "profile");
              }}
            />
          </div>
        )}
        {open && step === "account" && (
          <div className="absolute inset-0 z-20 bg-night">
            <AccountStep
              onDone={async (how) => {
                // A returning account: bring back its photo, name and settings before the profile step shows them.
                if (how === "account") await pullProfileNow().catch(() => {});
                setStep("profile");
              }}
            />
          </div>
        )}
        {open && step === "profile" && (
          <div className="absolute inset-0 z-20 bg-night">
            <ProfileStep onDone={() => setStep("perms")} />
          </div>
        )}
        {open && step === "perms" && (
          <div className="absolute inset-0 z-20 flex flex-col bg-night px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
            <div className="flex h-12 items-center">
              <Wordmark className="text-[1.375rem] font-bold tracking-[-0.04em]" />
            </div>
            <div className="mt-auto">
              <h1 className="text-[2.5rem] leading-[0.98] font-bold tracking-[-0.03em] [font-stretch:90%]">{t.welcome.permsTitle}</h1>
              <p className="mt-3 text-[1.0625rem] leading-snug text-haze">{t.welcome.permsBody}</p>
              <ul className="mt-6 flex flex-col gap-3">
                {[
                  { key: "loc", icon: <MapPin className="size-5" aria-hidden />, title: t.welcome.permsLocation, body: t.welcome.permsLocationWhy },
                ].map((row) => (
                  <li key={row.key} className="flex gap-4 rounded-[22px] bg-fg/[0.055] p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">{row.icon}</span>
                    <span>
                      <span className="block text-[1.0625rem] font-semibold">{row.title}</span>
                      <span className="mt-0.5 block text-[0.9375rem] leading-snug text-haze">{row.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-2">
                <ActionButton onClick={() => enter(true)} disabled={locating}>
                  {locating ? t.welcome.finding : t.welcome.allow}
                </ActionButton>
                <ActionButton variant="quiet" className="h-12" onClick={() => enter(false)} disabled={locating}>
                  {t.welcome.notNow}
                </ActionButton>
              </div>
            </div>
          </div>
        )}

        {/* The door: two halves that slide apart once the code is right */}
        <AnimatePresence>
          {!open && (
            <motion.div key="door" className="pointer-events-auto absolute inset-0 z-10" exit={{ opacity: 1 }} transition={{ duration: reduce ? 0 : 0.9 }}>
              {(["left", "right"] as const).map((side) => (
                <motion.div
                  key={side}
                  aria-hidden
                  className={cn(
                    "absolute inset-y-0 w-1/2 bg-[#0b0b0b]",
                    side === "left" ? "left-0 border-r border-dusk-edge/60" : "right-0 border-l border-dusk-edge/60",
                  )}
                  exit={{ x: side === "left" ? "-100%" : "100%" }}
                  transition={doorTransition}
                />
              ))}
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                exit={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
                transition={{ duration: reduce ? 0 : 0.25, ease: "easeIn" }}
              >
                <Keypad typed={typed} tone={tone} pressed={pressed} />
              </motion.div>
              <button
                type="button"
                onClick={unlock}
                className="absolute top-[max(env(safe-area-inset-top),1rem)] right-4 h-11 rounded-full px-4 text-[0.9375rem] font-semibold text-haze hover:text-ink"
              >
                {t.welcome.skip}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageTransition>
  );
}
