"use client";

import { Bell, Box, ChevronRight, FileText, Globe, Landmark, LocateFixed, MapPinCheck, RotateCcw, ShieldCheck, Sparkles, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BACK, PageTransition } from "@/components/page-transition";
import { HealthDot } from "@/components/toilet-card";
import { btn } from "@/components/ui/buttons";
import { REMOTE } from "@/lib/api";
import { LEGAL } from "@/lib/legal-text";
import { useT } from "@/lib/i18n";
import { requestLocation } from "@/lib/location";
import { askForNotifications, notify } from "@/lib/notify";
import { replayIntro } from "@/lib/onboarding";
import { updateSettings, useSettings, type Lang } from "@/lib/settings";
import { dismissNotice, syncNow, useGotInTotal, usePendingCount, useNotices, useSyncStatus } from "@/lib/sync";
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

const CARD = "overflow-hidden rounded-2xl border border-dusk-edge bg-white/[0.035]";

/** A heading above a card; the optional count is for things that need attention. */
function Heading({ id, children, badge, action }: { id: string; children: ReactNode; badge?: number; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 px-1">
      <h2 id={id} className="t-section">
        {children}
      </h2>
      {badge ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-good px-1.5 text-xs font-bold text-night">{badge}</span> : null}
      <span className="flex-1" />
      {action}
    </div>
  );
}

/** The icon sits in a small tinted square, so a list of settings can be scanned by shape. */
function Tile({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "bad" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[0.625rem]",
        tone === "good" ? "bg-good/15 text-good" : tone === "bad" ? "bg-bad/15 text-bad" : "bg-white/[0.07] text-ink/80",
      )}
    >
      {children}
    </span>
  );
}

const ROW = "flex w-full items-center gap-3.5 px-4 py-3 text-left";

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
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={ROW}>
      <Tile>{icon}</Tile>
      <span className="min-w-0 flex-1">
        <span className="block leading-snug">{title}</span>
        <span className="block text-[0.8125rem] leading-snug text-haze">{sub}</span>
      </span>
      <span className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", on ? "bg-good" : "bg-dusk-edge")}>
        <span className={cn("absolute top-1 left-1 size-5 rounded-full bg-ink shadow transition-transform duration-200", on && "translate-x-5")} />
      </span>
    </button>
  );
}

/** A tappable row that goes somewhere. */
function LinkRow({ icon, title, sub, onClick, href }: { icon: ReactNode; title: string; sub?: string; onClick?: () => void; href?: string }) {
  const inner = (
    <>
      <Tile>{icon}</Tile>
      <span className="min-w-0 flex-1">
        <span className="block leading-snug">{title}</span>
        {sub && <span className="block text-[0.8125rem] leading-snug text-haze">{sub}</span>}
      </span>
      <ChevronRight className="size-5 shrink-0 text-haze" aria-hidden />
    </>
  );
  return href ? (
    <Link href={href} className={ROW}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={ROW}>
      {inner}
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
  const [locationBlocked, setLocationBlocked] = useState(false);
  const mine = toilets.filter((x) => x.mine);
  // People who got in with the codes you shared. The server keeps a running total (a new code resets the
  // votes, not this); without a server it is every "yes" on your codes except your own.
  const serverGotIn = useGotInTotal();
  const gotIn = REMOTE ? serverGotIn : mine.reduce((n, x) => n + Math.max(0, x.confirms - (x.myVote === "works" ? 1 : 0)), 0);

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

  const toggleLocation = async (on: boolean) => {
    setLocationBlocked(false);
    if (!on) return updateSettings({ location: false });
    // Switching on is what makes the browser ask, so a refusal shows right here.
    updateSettings({ location: true });
    try {
      await requestLocation();
    } catch {
      updateSettings({ location: false });
      setLocationBlocked(true);
    }
  };

  const simulate = () => {
    for (const alert of simulateActivity()) {
      void notify(
        "magyarotyesz",
        alert.kind === "report" ? t.profile.alertReport(alert.name) : t.profile.alertSuggestion(alert.name, alert.code ?? ""),
      );
    }
  };

  const statusText = sync.syncing
    ? t.sync.syncing
    : sync.online === false
      ? t.sync.offline
      : pending > 0
        ? t.sync.waiting(pending)
        : t.sync.synced;
  const unreadCount = alerts.filter((a) => !a.read).length;
  const docs = LEGAL[lang];

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <header className="pt-8">
          <div className="flex items-start gap-3">
            <h1 className="t-display flex-1">{t.profile.title}</h1>
            {REMOTE && (
              <span
                data-testid="sync-status"
                className="mt-3 inline-flex max-w-[11rem] items-center gap-2 rounded-full border border-dusk-edge px-3 py-1.5 text-xs text-haze"
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    sync.syncing ? "animate-pulse bg-stale" : sync.online === false ? "bg-bad" : pending > 0 ? "bg-stale" : "bg-good",
                  )}
                />
                <span className="truncate">{statusText}</span>
              </span>
            )}
          </div>
          {/* The two numbers that matter, at a glance */}
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <div className={cn(CARD, "px-4 py-3")}>
              <dd className="text-[1.75rem] leading-none font-bold tabular-nums">{mine.length}</dd>
              <dt className="mt-1 text-[0.8125rem] text-haze">{t.profile.statShared}</dt>
            </div>
            <div className={cn(CARD, "px-4 py-3")}>
              <dd className="text-[1.75rem] leading-none font-bold tabular-nums">{gotIn}</dd>
              <dt className="mt-1 text-[0.8125rem] text-haze">{t.profile.statGotIn}</dt>
            </div>
          </dl>
          {REMOTE && (pending > 0 || sync.online === false) && !sync.syncing && (
            <button type="button" onClick={() => void syncNow()} className={cn(btn.secondary, btn.sm, "mt-3 w-full")}>
              {t.sync.sendNow}
            </button>
          )}
        </header>

        {notices.length > 0 && (
          <section className="mt-8" aria-labelledby="notices-heading">
            <Heading id="notices-heading" badge={notices.length}>
              {t.sync.noticesTitle}
            </Heading>
            <ul className={cn(CARD, "divide-y divide-dusk-edge")}>
              {notices.map((notice) => (
                <li key={notice.id} className="flex items-start gap-3 px-4 py-3">
                  <Tile tone="bad">
                    <span className="text-base font-bold">!</span>
                  </Tile>
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug">{t.sync.notice(notice.type, notice.name)}</span>
                    <span className="block text-[0.8125rem] text-haze">{t.sync.errors[notice.code] ?? notice.message}</span>
                  </span>
                  <button type="button" onClick={() => dismissNotice(notice.id)} className="py-1 text-sm font-semibold text-haze hover:text-ink">
                    {t.sync.dismiss}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Alerts about your codes */}
        <section className="mt-8" aria-labelledby="alerts-heading">
          <Heading
            id="alerts-heading"
            badge={unreadCount}
            action={
              alerts.length > 0 && (
                <button type="button" onClick={clearAlerts} className="text-sm font-semibold text-haze hover:text-ink">
                  {t.profile.clearAlerts}
                </button>
              )
            }
          >
            {t.profile.alerts}
          </Heading>
          {alerts.length === 0 ? (
            <p className={cn(CARD, "px-4 py-4 text-[0.9375rem] text-haze")}>{t.profile.noAlerts}</p>
          ) : (
            <ul className={cn(CARD, "divide-y divide-dusk-edge")}>
              {alerts.map((alert) => (
                <li key={alert.id} className="flex items-start gap-3.5 px-4 py-3">
                  <span
                    aria-hidden
                    className={cn("mt-2 size-2 shrink-0 rounded-full", alert.read ? "bg-dusk-edge" : "bg-good shadow-[0_0_8px_1px_var(--good)]")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug">
                      {alert.kind === "report"
                        ? t.profile.alertReport(alert.name)
                        : t.profile.alertSuggestion(alert.name, alert.code ?? "")}
                    </span>
                    <span className="block text-[0.8125rem] text-haze">{ago(alert.at, lang)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Codes you shared */}
        <section className="mt-8" aria-labelledby="mine-heading">
          <Heading id="mine-heading">{t.profile.mine}</Heading>
          {mine.length === 0 ? (
            <p className={cn(CARD, "px-4 py-4 text-[0.9375rem] text-haze")}>{t.profile.mineEmpty}</p>
          ) : (
            <ul className={cn(CARD, "divide-y divide-dusk-edge")}>
              {mine.map((toilet) => (
                <li key={toilet.id} className="flex items-center gap-3 py-3 pr-2 pl-4">
                  <HealthDot toilet={toilet} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{toilet.name}</span>
                    <span className="block truncate text-[0.8125rem] text-haze">
                      {t.kinds[toilet.kind]} · {t.profile.added(ago(toilet.addedAt, lang))}
                    </span>
                  </span>
                  <span className="rounded-lg bg-night px-2 py-1 font-mono text-sm tracking-[0.12em] text-ink/85">{toilet.code}</span>
                  <button
                    type="button"
                    onClick={() => removeToilet(toilet.id)}
                    aria-label={REMOTE ? `${t.profile.remove(toilet.name)}. ${t.sync.removeNote}` : t.profile.remove(toilet.name)}
                    className="grid size-10 place-items-center rounded-full text-haze hover:text-bad"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Settings */}
        <section className="mt-8" aria-labelledby="settings-heading">
          <Heading id="settings-heading">{t.profile.settings}</Heading>
          <ul className={cn(CARD, "divide-y divide-dusk-edge")}>
            <li className="flex items-center gap-3.5 px-4 py-2.5">
              <Tile>
                <Globe className="size-5" />
              </Tile>
              <span className="flex-1">{t.profile.language}</span>
              <div role="radiogroup" aria-label={t.profile.language} className="flex rounded-full bg-night p-1">
                {(["en", "hu"] as Lang[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={settings.lang === key}
                    onClick={() => updateSettings({ lang: key })}
                    className={cn(
                      "h-8 rounded-full px-3.5 text-sm font-semibold transition-colors",
                      settings.lang === key ? "bg-ink text-night" : "text-haze",
                    )}
                  >
                    {key === "en" ? "EN" : "HU"}
                  </button>
                ))}
              </div>
            </li>
            <li>
              <SwitchRow
                icon={<LocateFixed className="size-5" />}
                title={t.profile.location}
                sub={locationBlocked ? t.profile.locationBlocked : t.profile.locationSub}
                on={settings.location}
                onChange={toggleLocation}
              />
            </li>
            <li>
              <SwitchRow
                icon={<Box className="size-5" />}
                title={t.profile.buildings3d}
                sub={t.profile.buildings3dSub}
                on={settings.buildings3d}
                onChange={(on) => updateSettings({ buildings3d: on })}
              />
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
            <li>
              <LinkRow icon={<RotateCcw className="size-5" />} title={t.profile.intro} sub={t.profile.introSub} onClick={showIntro} />
            </li>
          </ul>
        </section>

        {/* The small print, one tap away */}
        <section className="mt-8" aria-labelledby="about-heading">
          <Heading id="about-heading">{t.profile.about}</Heading>
          <ul className={cn(CARD, "divide-y divide-dusk-edge")}>
            <li>
              <LinkRow icon={<FileText className="size-5" />} title={docs.terms.title} href="/terms" />
            </li>
            <li>
              <LinkRow icon={<ShieldCheck className="size-5" />} title={docs.privacy.title} href="/privacy" />
            </li>
            <li>
              <LinkRow icon={<Landmark className="size-5" />} title={docs.imprint.title} href="/imprint" />
            </li>
          </ul>
        </section>

        {/* Demo tools, kept apart from the real settings */}
        {!REMOTE && (mine.length > 0 || !toilets.some((x) => !x.mine)) && (
          <section className="mt-8" aria-labelledby="demo-heading">
            <Heading id="demo-heading">{t.profile.demo}</Heading>
            <ul className={cn(CARD, "divide-y divide-dusk-edge")}>
              {!toilets.some((x) => !x.mine) && (
                <li>
                  <LinkRow icon={<Users className="size-5" />} title={t.profile.demoOthers} sub={t.profile.demoOthersSub} onClick={addDemoToilets} />
                </li>
              )}
              {mine.length > 0 && (
                <li>
                  <LinkRow icon={<Sparkles className="size-5" />} title={t.profile.simulate} sub={t.profile.simulateSub} onClick={simulate} />
                </li>
              )}
            </ul>
            <p className="mt-2 px-1 text-[0.8125rem] text-haze">{t.profile.demoSub}</p>
          </section>
        )}

        {/* Danger zone: last, and apart */}
        {!REMOTE && (
          <section className="mt-8" aria-label={t.profile.deleteAll}>
            <div className={CARD}>
              {confirmClear ? (
                <div className="flex items-center gap-3 px-4 py-3">
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
                <button type="button" onClick={() => setConfirmClear(true)} className={cn(ROW, "text-bad")}>
                  <Tile tone="bad">
                    <Trash2 className="size-5" />
                  </Tile>
                  <span className="flex-1">{t.profile.deleteAll}</span>
                </button>
              )}
            </div>
          </section>
        )}

        <footer className="mt-8 pb-6 text-[0.8125rem] leading-relaxed text-haze">{REMOTE ? t.sync.footer : t.profile.footer}</footer>
      </main>
    </PageTransition>
  );
}
