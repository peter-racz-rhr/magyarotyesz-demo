/*
  What people may type into a toilet's fields. The server enforces the same
  limits (it has the last word); this keeps the app from sending what it
  would turn down, and keeps random junk out of the first place.
*/
export const LIMITS = { name: 60, code: 16, note: 120, price: 1000 } as const;

const EMOJI = /[\p{Extended_Pictographic}️‍⃣\u{1F1E6}-\u{1F1FF}]/gu;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/g;

/** Free text (names, notes) as you type: no emoji or control characters, never over the limit. */
export const cleanText = (value: string, max: number) => value.replace(CONTROL, "").replace(EMOJI, "").slice(0, max);

/** A name or note ready to send: tidy spaces, trimmed, within the limit. */
export const tidy = (value: string, max: number) => cleanText(value, max * 2).replace(/\s+/g, " ").trim().slice(0, max);

/** Door codes are keypad characters: letters, digits and # * + - . / */
export const cleanCode = (value: string) => value.replace(/[^A-Za-z0-9#*+\-./]/g, "").slice(0, LIMITS.code);

/** A name needs at least one letter or digit ("!!!" is not a place). */
export const validName = (value: string) => /[\p{L}\p{N}]/u.test(value);

/** A code needs at least one letter or digit ("###" is not a code). */
export const validCode = (value: string) => /[A-Za-z0-9]/.test(value);
