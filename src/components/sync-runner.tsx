"use client";

import { useEffect } from "react";
import { REMOTE } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { notify } from "@/lib/notify";
import { onNewAlerts, syncNow } from "@/lib/sync";

/**
 * Keeps this phone in step with the server: on start, when the internet
 * comes back, when you return to the app, and every minute while it's open.
 * Renders nothing, and does nothing at all in demo mode.
 */
export function SyncRunner() {
  const { t } = useT();

  useEffect(() => {
    if (!REMOTE) return;
    onNewAlerts((fresh) => {
      for (const alert of fresh) {
        void notify(
          "magyarotyesz",
          alert.kind === "report" ? t.profile.alertReport(alert.name) : t.profile.alertSuggestion(alert.name, alert.code ?? ""),
        );
      }
    });
    return () => onNewAlerts(null);
  }, [t]);

  useEffect(() => {
    if (!REMOTE) return;
    void syncNow();
    const again = () => void syncNow();
    const visible = () => document.visibilityState === "visible" && again();
    window.addEventListener("online", again);
    document.addEventListener("visibilitychange", visible);
    const timer = window.setInterval(visible, 60000);
    return () => {
      window.removeEventListener("online", again);
      document.removeEventListener("visibilitychange", visible);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
