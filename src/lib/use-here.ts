"use client";

import { useCallback, useEffect, useState } from "react";
import { locationPermission, requestLocation, type Coordinates } from "./location";
import { getSettings, useSettings } from "./settings";

type Status = "checking" | "prompt" | "locating" | "ready" | "denied" | "off";

/**
 * Where the viewer is. Reads the location silently when permission was
 * already given; otherwise waits for `request()` (call it from a button).
 */
export function useHere() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<Status>("checking");
  const { location: allowed } = useSettings();

  const request = useCallback(async () => {
    setStatus("locating");
    try {
      const here = await requestLocation();
      // Switched off while we waited: forget the answer.
      if (!getSettings().location) return;
      setCoords(here);
      setStatus("ready");
    } catch {
      if (getSettings().location) setStatus("denied");
    }
  }, []);

  useEffect(() => {
    // Off in Profile: forget the position and don't even ask the browser.
    if (!allowed) {
      queueMicrotask(() => {
        setCoords(null);
        setStatus("off");
      });
      return;
    }
    void locationPermission().then((state) => {
      if (!getSettings().location) return;
      if (state === "granted") void request();
      else setStatus(state === "denied" ? "denied" : "prompt");
    });
  }, [request, allowed]);

  return { coords, status, request };
}

/** A clock that ticks every `ms`, for countdowns. */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), ms);
    return () => window.clearInterval(timer);
  }, [ms]);
  return now;
}
