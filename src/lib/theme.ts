"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useSettings, type Settings } from "./settings";

export type Look = "dark" | "light";

const QUERY = "(prefers-color-scheme: light)";

/** What the phone prefers right now. */
function useSystemLook(): Look {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(QUERY);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => (window.matchMedia(QUERY).matches ? "light" : "dark"),
    () => "dark",
  );
}

export const resolveLook = (pref: Settings["theme"], system: Look): Look => (pref === "system" ? system : pref);

/** The look in use: the saved choice, or the phone's when that is "system". */
export function useLook(): Look {
  const { theme } = useSettings();
  const system = useSystemLook();
  return resolveLook(theme, system);
}

export const THEME_COLOR: Record<Look, string> = { dark: "#121212", light: "#f6f3ee" };

/** Puts the look on the page (<html data-theme>) and the browser bar colour. Renders nothing. */
export function ThemeRunner() {
  const look = useLook();
  const { navStyle, glass, palette, textSize, lang } = useSettings();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = look;
    root.dataset.palette = palette;
    root.dataset.text = textSize;
    root.lang = lang;
    // The navigation reads these to dress itself (globals.css).
    root.dataset.nav = navStyle;
    root.dataset.glass = glass;
    // The browser bar takes the page colour of the palette in use. Next draws its own
    // theme-color tag: change it in place (removing it breaks React's bookkeeping).
    const page = getComputedStyle(root).getPropertyValue("--night").trim() || THEME_COLOR[look];
    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    if (metas.length) metas.forEach((m) => (m.content = page));
    else {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = page;
      document.head.appendChild(meta);
    }
  }, [look, navStyle, glass, palette, textSize, lang]);
  return null;
}

/** Runs before the first paint so a light phone does not flash dark. Kept tiny and defensive. */
export const THEME_BOOT = `try{var c=JSON.parse(localStorage.getItem("magyarotyesz:settings")||"{}");var s=c.theme||"system";var l=s==="system"?(matchMedia("${QUERY}").matches?"light":"dark"):s;document.documentElement.dataset.theme=l;if(c.palette)document.documentElement.dataset.palette=c.palette;if(c.textSize)document.documentElement.dataset.text=c.textSize}catch(e){document.documentElement.dataset.theme="dark"}`;
