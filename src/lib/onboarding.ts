const ONBOARDED_KEY = "magyarotyesz:onboarded";
const TERMS_KEY = "magyarotyesz:terms-accepted";

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: onboarding simply shows again.
  }
}

export const hasOnboarded = () => read(ONBOARDED_KEY) === "1";
export const markOnboarded = () => write(ONBOARDED_KEY, "1");
/** Bump when the terms change in a way people must agree to again. */
export const TERMS_VERSION = "2026-10";
export const hasAcceptedTerms = () => {
  try {
    return (JSON.parse(read(TERMS_KEY) ?? "null") as { v?: string } | null)?.v === TERMS_VERSION;
  } catch {
    return false;
  }
};
export const markTermsAccepted = () => write(TERMS_KEY, JSON.stringify({ v: TERMS_VERSION, at: new Date().toISOString() }));

export function resetOnboarding() {
  try {
    window.localStorage.removeItem(ONBOARDED_KEY);
  } catch {
    // Nothing stored to clear.
  }
}

/** Show the first-run intro again next time. */
export function replayIntro() {
  resetOnboarding();
  try {
    window.localStorage.removeItem(TERMS_KEY);
    window.localStorage.setItem(REPLAY_KEY, "1");
  } catch {
    // Nothing stored to clear.
  }
}

const REPLAY_KEY = "magyarotyesz:replay-intro";

/** True once after replayIntro(), so the welcome asks for location again. */
export function takeReplayFlag() {
  const replay = read(REPLAY_KEY) === "1";
  try {
    window.localStorage.removeItem(REPLAY_KEY);
  } catch {
    // Ignore.
  }
  return replay;
}
