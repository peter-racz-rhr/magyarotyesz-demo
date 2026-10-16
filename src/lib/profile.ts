"use client";

import { REMOTE } from "./api";
import { updateSettings } from "./settings";
import { enqueue } from "./sync";

export const NAME_MAX = 24;
/** Circle colours for the profile picture. */
export const AVATAR_HUES = [152, 200, 262, 320, 18, 42, 96, 180] as const;

export const tidyName = (value: string) => value.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);

/** Save what you'd like to be called: on this phone right away, and on your id at the server. */
export function saveProfile(name: string, avatar: number) {
  const clean = tidyName(name);
  updateSettings({ name: clean, avatar });
  if (REMOTE) enqueue("set_profile", { displayName: clean });
}
