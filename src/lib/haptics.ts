import { getSettings } from "./settings";

/*
  Vibration on Android phones (not iPhones: Safari has no such thing). Very short buzzes (under about
  15 ms) are too faint to feel on many phones, so these are a little longer than a "tick" would be.
  Chrome only vibrates after the person has touched the page, which a tap always has.
*/
const PATTERNS = {
  /** Any button or link. */
  tap: 22,
  /** Sliding across the bar. */
  tick: 16,
  /** A toilet was added, a switch turned on. */
  success: [35, 45, 80],
  /** Something that needs a second look. */
  warn: [70, 50, 70],
} as const;

export type Buzz = keyof typeof PATTERNS;

/** Vibrates if the phone can and Settings > Vibration is on. Returns whether it did. */
export function buzz(kind: Buzz = "tap"): boolean {
  try {
    if (typeof navigator === "undefined" || !navigator.vibrate || !getSettings().haptics) return false;
    return navigator.vibrate(PATTERNS[kind] as number | number[]);
  } catch {
    return false;
  }
}
