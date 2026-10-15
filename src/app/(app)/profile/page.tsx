"use client";

import { Bell, ChevronRight, MapPinCheck, RotateCcw, Sparkles, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BACK, PageTransition } from "@/components/page-transition";
import { HealthDot } from "@/components/toilet-card";
import { btn } from "@/components/ui/buttons";
import { REMOTE } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { askForNotifications, notify } from "@/lib/notify";
import { replayIntro } from "@/lib/onboarding";
import {
  DEFAULT_GLASS_DIM,
  DEFAULT_GLASS_STYLE,
  GLASS_STYLES,
  MAX_GLASS_DIM,
  updateSettings,
  useSettings,
  type Lang,
} from "@/lib/settings";
import { dismissNotice, syncNow, usePendingCount, useNotices, useSyncStatus } from "@/lib/sync";
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
  const notices = useNotices();
  const pending = usePendingCount();
  const sync = useSyncStatus();
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

        {REMOTE && (
          <section className="mt-8" aria-label={t.sync.statusTitle}>
            <div className="flex items-center gap-3 text-sm text-haze">
              <span
                aria-hidden
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  sync.syncing ? "animate-pulse bg-stale" : sync.online === false ? "bg-bad" : pending > 0 ? "bg-stale" : "bg-good",
                )}
              />
              <span data-testid="sync-status" className="flex-1">
                {sync.syncing
                  ? t.sync.syncing
                  : sync.online === false
                    ? t.sync.offline
                    : pending > 0
                      ? t.sync.waiting(pending)
                      : t.sync.synced}
              </span>
              {(pending > 0 || sync.online === false) && !sync.syncing && (
                <button type="button" onClick={() => void syncNow()} className="font-semibold text-ink">
                  {t.sync.sendNow}
                </button>
              )}
            </div>
            {sync.online === false && pending > 0 && <p className="mt-1 pl-5 text-sm text-haze">{t.sync.waiting(pending)}</p>}
          </section>
        )}

        {notices.length > 0 && (
          <section className="mt-8" aria-labelledby="notices-heading">
            <h2 id="notices-heading" className="t-section">
              {t.sync.noticesTitle}
            </h2>
            <ul className="mt-3 divide-y divide-dusk-edge border-y border-dusk-edge">
              {notices.map((notice) => (
                <li key={notice.id} className="flex items-start gap-3 py-3.5">
                  <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full bg-bad" />
                  <span className="min-w-0 flex-1">
                    <span className="block">{t.sync.notice(notice.type, notice.name)}</span>
                    <span className="block text-sm text-haze">{t.sync.errors[notice.code] ?? notice.message}</span>
                  </span>
                  <button type="button" onClick={() => dismissNotice(notice.id)} className="text-sm font-semibold text-haze hover:text-ink">
                    {t.sync.dismiss}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

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
                    aria-label={REMOTE ? `${t.profile.remove(toilet.name)}. ${t.sync.removeNote}` : t.profile.remove(toilet.name)}
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
            {!REMOTE && (
            <li>
              <SwitchRow
                icon={<MapPinCheck className="size-5" />}
                title={t.profile.onTheSpot}
                sub={t.profile.onTheSpotSub}
                on={settings.nearbyCheck}
                onChange={(on) => updateSettings({ nearbyCheck: on })}
              />
            </li>
            )}
            <li>
              <SwitchRow
                icon={<Bell className="size-5" />}
                title={t.profile.notify}
                sub={notifyBlocked ? t.profile.notifyBlocked : t.profile.notifySub}
                on={settings.notify}
                onChange={toggleNotify}
              />
            </li>
            <li className="py-4">
              <p className="flex-1">{t.profile.glass}</p>
              <p className="mt-0.5 text-sm text-haze">{t.profile.glassSub}</p>
              <div role="radiogroup" aria-label={t.profile.glass} className="mt-3 grid grid-cols-2 gap-1 rounded-3xl bg-dusk p-1">
                {GLASS_STYLES.map((key) => {
                  const on = (settings.glassStyle ?? DEFAULT_GLASS_STYLE) === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => updateSettings({ glassStyle: key })}
                      className={cn(
                        "h-10 rounded-full px-3 text-sm font-semibold transition-colors",
                        on ? "bg-ink text-night" : "text-haze",
                      )}
                    >
                      {t.profile.glassStyles[key]}
                    </button>
                  );
                })}
              </div>
              <div className={cn("mt-4 transition-opacity", (settings.glassStyle ?? DEFAULT_GLASS_STYLE) === "classic" && "opacity-40")}>
                <div className="flex items-baseline gap-3">
                  <label htmlFor="glass-dim" className="flex-1 text-sm text-haze">
                    {t.profile.glassDim}
                  </label>
                  <span data-testid="glass-dim-value" className="text-lg font-semibold tabular-nums">
                    {Math.round((settings.glassDim ?? DEFAULT_GLASS_DIM) * 100)}%
                  </span>
                </div>
                <input
                  id="glass-dim"
                  type="range"
                  min={0}
                  max={Math.round(MAX_GLASS_DIM * 100)}
                  step={1}
                  disabled={(settings.glassStyle ?? DEFAULT_GLASS_STYLE) === "classic"}
                  value={Math.round((settings.glassDim ?? DEFAULT_GLASS_DIM) * 100)}
                  onChange={(e) => updateSettings({ glassDim: Number(e.target.value) / 100 })}
                  className="mt-2 h-8 w-full cursor-pointer accent-[var(--good)]"
                />
              </div>
              {((settings.glassStyle ?? DEFAULT_GLASS_STYLE) !== DEFAULT_GLASS_STYLE ||
                Math.round((settings.glassDim ?? DEFAULT_GLASS_DIM) * 100) !== Math.round(DEFAULT_GLASS_DIM * 100)) && (
                <button
                  type="button"
                  onClick={() => updateSettings({ glassStyle: DEFAULT_GLASS_STYLE, glassDim: DEFAULT_GLASS_DIM })}
                  className="mt-1 text-sm font-semibold text-haze hover:text-ink"
                >
                  {t.profile.glassReset}
                </button>
              )}
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
            {!REMOTE && (
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
            )}
          </ul>
        </section>

        {/* Demo tools, kept apart from the real settings */}
        {!REMOTE && (mine.length > 0 || !toilets.some((x) => !x.mine)) && (
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

        <footer className="mt-10 pb-6 text-[0.8125rem] leading-relaxed text-haze">{REMOTE ? t.sync.footer : t.profile.footer}</footer>
      </main>
    </PageTransition>
  );
}
