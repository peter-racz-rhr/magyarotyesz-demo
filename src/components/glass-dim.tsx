"use client";

import { useEffect } from "react";
import { DEFAULT_GLASS_DIM, DEFAULT_GLASS_STYLE, useSettings } from "@/lib/settings";

/** Applies the saved glass look (Profile > Settings) to the whole app. */
export function GlassDim() {
  const { glassDim, glassStyle } = useSettings();
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--glass-dim", String(glassDim ?? DEFAULT_GLASS_DIM));
    root.dataset.glass = glassStyle ?? DEFAULT_GLASS_STYLE;
  }, [glassDim, glassStyle]);
  return null;
}

/**
 * Runs before the first paint (see the root layout), so a saved look that
 * differs from the default never shows the default for a moment first.
 */
export const GLASS_DIM_BOOT = `try{var s=JSON.parse(localStorage.getItem("magyarotyesz:settings")||"{}"),r=document.documentElement;if(typeof s.glassDim==="number")r.style.setProperty("--glass-dim",String(Math.min(0.7,Math.max(0,s.glassDim))));r.dataset.glass=["classic","tinted","balanced","frosted"].indexOf(s.glassStyle)>-1?s.glassStyle:"${DEFAULT_GLASS_STYLE}"}catch(e){document.documentElement.dataset.glass="${DEFAULT_GLASS_STYLE}"}`;
