"use client";

import { Bell, ChevronRight, MapPinCheck, RotateCcw, Sparkles, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BACK, PageTransition } from "@/components/page-transition";
import { HealthDot } from "@/components/toilet-card";
import { btn } from "@/components/ui/buttons";
import { useT } from "@/lib/i18n";
import { askForNotifications, notify } from "@/lib/notify";
import { replayIntro } from "@/lib/onboarding";
import { updateSettings, useSettings, type Lang } from "@/lib/settings";
import {
  addDemoToilets,
  ago,
  clearAlerts,
  clearToilets,
  markAlertsRead,
  removeToilet,
  simulateActivity,
  useAlerts,
  useToilets,
} from "@/lib/toilets";
import { cn } from "@/lib/utils";

/** A settings row with an on/off switch. */
function SwitchRow({
  icon,
  title,
  sub,
  on,
  onChange,
}: {
  icon: ReactNode;
  title: string;
  sub: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center gap-4 py-4 text-left">
      <span className="shrink-0 text-haze">{icon}</span>
      <span className="flex-1">
        <span className="block">{title}</span>
        <span className="block text-sm text-haze">{sub}</span>
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-good" : "bg-dusk-edge")}>
        <span
          className={cn(
            "absolute top-1 left-1 size-5 rounded-full bg-ink shadow transition-transform duration-200",
            on && "translate-x-5",
          )}
        />
      </span>
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { t, lang } = useT();
  const settings = useSettings();
  const toilets = useToilets();
  const alerts = useAlerts();
  const [confirmClear, setConfirmClear] = useState(false);
  const [notifyBlocked, setNotifyBlocked] = useState(false);
  const mine = toilets.filter((x) => x.mine);
  const checks = toilets.reduce((n, x) => n + (x.myVote ? 1 : 0), 0);

  // Seeing your alerts here counts as reading them.
  const unread = alerts.some((a) => !a.read);
  useEffect(() => {
    if (!unread) return;
    const timer = window.setTimeout(markAlertsRead, 1500);
    return () => window.clearTimeout(timer);
  }, [unread]);

  const showIntro = () => {
    replayIntro();
    router.replace("/", { transitionTypes: BACK });
  };

  const toggleNotify = async (on: boolean) => {
    setNotifyBlocked(false);
    if (!on) return updateSettings({ notify: false });
    const allowed = await askForNotifications();
    updateSettings({ notify: allowed });
    setNotifyBlocked(!allowed);
  };

  const simulate = () => {
    for (const alert of simulateActivity()) {
      void notify(
        "magyarotyesz",
        alert.kind === "report" ? t.profile.alertReport(alert.name) : t.profile.alertSuggestion(alert.name, alert.code ?? ""),
      );
    }
  };

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-md px-6 pt-[max(env(safe-area-inset-top),1rem)]">
        <header className="pt-8">
          <h1 className="t-display">{t.profile.title}</h1>
          <p className="mt-3 text-[1.0625rem] text-haze">{t.profile.summary(mine.length, checks)}</p>
        </header>

        {/* Alerts about your codes */}
        <section className="mt-10" aria-labelledby="alerts-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="alerts-heading" className="t-section">
              {t.profile.alerts}
            </h2>
            {alerts.length > 0 && (
              <button type="button" onClick={clearAlerts} className="text-sm font-semibold text-haze hover:text-ink">
                {t.profile.clearAlerts}
              </button>
            )}
          </div>
          {alerts.length === 0 ? (
            <p className="mt-2 max-w-[34ch] text-haze">{t.profile.noAlerts}</p>
          ) : (
            <ul className="mt-3 divide-y divide-dusk-edge border-y border-dusk-edge">
              {alerts.map((alert) => (
                <li key={alert.id} className="flex items-start gap-3 py-3.5">
                  <span
                    aria-hidden
                    className={cn("mt-2 size-2 shrink-0 rounded-full", alert.read ? "bg-dusk-edge" : "bg-good shadow-[0_0_8px_1px_var(--good)]")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block">
                      {alert.kind === "report"
                        ? t.profile.alertReport(alert.name)
                        : t.profile.alertSuggestion(alert.name, alert.code ?? "")}
                    </span>
                    <span className="block text-sm text-haze">{ago(alert.at, lang)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Codes you shared */}
        <section className="mt-10" aria-labelledby="mine-heading">
          <h2 id="mine-heading" className="t-section">
            {t.profile.mine}
          </h2>
          {mine.length === 0 ? (
            <p className="mt-2 max-w-[34ch] text-haze">{t.profile.mineEmpty}</p>
          ) : (
            <ul className="mt-3 divide-y divide-dusk-edge border-y border-dusk-edge">
              {mine.map((toilet) => (
                <li key={toilet.id} className="flex items-center gap-3 py-3.5">
                  <HealthDot toilet={toilet} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{toilet.name}</span>
                    <span className="block text-sm text-haze">
                      {t.kinds[toilet.kind]} · {t.profile.added(ago(toilet.addedAt, lang))}
                    </span>
                  </span>
                  <span className="font-mono tracking-[0.12em] text-ink/80">{toilet.code}</span>
                  <button
                    type="button"
                    onClick={() => removeToilet(toilet.id)}
                    aria-label={t.profile.remove(toilet.name)}
                    className="-mr-2 grid size-10 place-items-center rounded-full text-haze hover:text-bad"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Settings */}
        <section className="mt-12" aria-labelledby="settings-heading">
          <h2 id="settings-heading" className="t-section">
            {t.profile.settings}
          </h2>
          <ul className="mt-2 divide-y divide-dusk-edge border-y border-dusk-edge">
            <li className="flex items-center gap-4 py-3">
              <span className="flex-1">{t.profile.language}</span>
              <div role="radiogroup" aria-label={t.profile.language} className="flex rounded-full bg-dusk p-1">
                {(["en", "hu"] as Lang[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={settings.lang === key}
                    onClick={() => updateSettings({ lang: key })}
                    className={cn(
                      "h-9 rounded-full px-4 text-sm font-semibold transition-colors",
                      settings.lang === key ? "bg-ink text-night" : "text-haze",
                    )}
                  >
                    {key === "en" ? "English" : "Magyar"}
                  </button>
                ))}
              </div>
            </li>
            <li>
              <SwitchRow
                icon={<MapPinCheck className="size-5" />}
                title={t.profile.onTheSpot}
                sub={t.profile.onTheSpotSub}
                on={settings.nearbyCheck}
                onChange={(on) => updateSettings({ nearbyCheck: on })}
              />
            </li>
            <li>
              <SwitchRow
                icon={<Bell className="size-5" />}
                title={t.profile.notify}
                sub={notifyBlocked ? t.profile.notifyBlocked : t.profile.notifySub}
                on={settings.notify}
                onChange={toggleNotify}
              />
            </li>
            <li>
              <button type="button" onClick={showIntro} className="flex w-full items-center gap-4 py-4 text-left">
                <RotateCcw className="size-5 shrink-0 text-haze" aria-hidden />
                <span className="flex-1">
                  <span className="block">{t.profile.intro}</span>
                  <span className="block text-sm text-haze">{t.profile.introSub}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-haze" aria-hidden />
              </button>
            </li>
            <li>
              {confirmClear ? (
                <div className="flex items-center gap-3 py-3">
                  <span className="flex-1 text-sm">{t.profile.deleteConfirm}</span>
                  <button type="button" onClick={() => setConfirmClear(false)} className={cn(btn.quiet, btn.sm)}>
                    {t.profile.keep}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearToilets();
                      clearAlerts();
                      setConfirmClear(false);
                    }}
                    className={cn(btn.sm, "inline-flex items-center rounded-full bg-bad font-semibold text-night active:scale-[0.97]")}
                  >
                    {t.profile.delete}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmClear(true)} className="flex w-full items-center gap-4 py-4 text-left text-bad">
                  <Trash2 className="size-5 shrink-0" aria-hidden />
                  <span className="flex-1">{t.profile.deleteAll}</span>
                </button>
              )}
            </li>
          </ul>
        </section>

        {/* Demo tools, kept apart from the real settings */}
        {(mine.length > 0 || !toilets.some((x) => !x.mine)) && (
          <section className="mt-12" aria-labelledby="demo-heading">
            <h2 id="demo-heading" className="t-section">
              {t.profile.demo}
            </h2>
            <p className="mt-1 text-sm text-haze">{t.profile.demoSub}</p>
            <ul className="mt-3 divide-y divide-dusk-edge border-y border-dusk-edge">
            {!toilets.some((x) => !x.mine) && (
              <li>
                <button type="button" onClick={addDemoToilets} className="flex w-full items-center gap-4 py-4 text-left">
                  <Users className="size-5 shrink-0 text-haze" aria-hidden />
                  <span className="flex-1">
                    <span className="block">{t.profile.demoOthers}</span>
                    <span className="block text-sm text-haze">{t.profile.demoOthersSub}</span>
                  </span>
                </button>
              </li>
            )}
            {mine.length > 0 && (
              <li>
                <button type="button" onClick={simulate} className="flex w-full items-center gap-4 py-4 text-left">
                  <Sparkles className="size-5 shrink-0 text-haze" aria-hidden />
                  <span className="flex-1">
                    <span className="block">{t.profile.simulate}</span>
                    <span className="block text-sm text-haze">{t.profile.simulateSub}</span>
                  </span>
                </button>
              </li>
            )}
            </ul>
          </section>
        )}

        <footer className="mt-10 pb-6 text-[0.8125rem] leading-relaxed text-haze">{t.profile.footer}</footer>
      </main>
    </PageTransition>
  );
}
