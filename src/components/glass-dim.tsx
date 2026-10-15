"use client";

import { useEffect } from "react";
import { DEFAULT_GLASS_DIM, useSettings } from "@/lib/settings";

/** Applies the saved glass dimming (Profile > Settings) to the whole app. */
export function GlassDim() {
  const { glassDim } = useSettings();
  useEffect(() => {
    document.documentElement.style.setProperty("--glass-dim", String(glassDim ?? DEFAULT_GLASS_DIM));
  }, [glassDim]);
  return null;
}

/**
 * Runs before the first paint (see the root layout), so a saved value that
 * differs from the default never shows the default for a moment first.
 */
export const GLASS_DIM_BOOT = `try{var s=JSON.parse(localStorage.getItem("magyarotyesz:settings")||"{}");if(typeof s.glassDim==="number")document.documentElement.style.setProperty("--glass-dim",String(Math.min(0.7,Math.max(0,s.glassDim))))}catch(e){}`;
