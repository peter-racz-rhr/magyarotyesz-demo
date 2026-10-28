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
  const { navStyle, darkBar, glass, solidColor } = useSettings();
  useEffect(() => {
    document.documentElement.dataset.theme = look;
    // The navigation reads these two to dress itself (globals.css).
    document.documentElement.dataset.nav = navStyle;
    // The solid look has its own colours, so the dark glass colours step aside.
    document.documentElement.dataset.darkBar = glass === "solid" ? "classic" : darkBar;
    document.documentElement.dataset.glass = glass;
    document.documentElement.dataset.solid = solidColor;
    // Next draws its own theme-color tag: change it in place (removing it breaks React's bookkeeping).
    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    if (metas.length) metas.forEach((m) => (m.content = THEME_COLOR[look]));
    else {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = THEME_COLOR[look];
      document.head.appendChild(meta);
    }
  }, [look, navStyle, darkBar, glass, solidColor]);
  return null;
}

/** Runs before the first paint so a light phone does not flash dark. Kept tiny and defensive. */
export const THEME_BOOT = `try{var s=JSON.parse(localStorage.getItem("magyarotyesz:settings")||"{}").theme||"system";var l=s==="system"?(matchMedia("${QUERY}").matches?"light":"dark"):s;document.documentElement.dataset.theme=l}catch(e){document.documentElement.dataset.theme="dark"}`;
