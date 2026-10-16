"use client";

import { ArrowLeft, Bell, Box, FileText, Globe, Landmark, LocateFixed, MapPinCheck, Download, Eye, RotateCcw, ShieldCheck, Smartphone, Sparkles, Trash2, Users, Vibrate } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BACK, PageTransition } from "@/components/page-transition";
import { CARD, Heading, LinkRow, ROW, SwitchRow, Tile } from "@/components/settings-ui";
import { btn } from "@/components/ui/buttons";
import { REMOTE } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal-text";
import { requestLocation } from "@/lib/location";
import { askForNotifications, notify } from "@/lib/notify";
import { replayIntro } from "@/lib/onboarding";
import { updateSettings, useSettings, type Lang } from "@/lib/settings";
import { useUserId } from "@/lib/sync";
import { addDemoToilets, clearAlerts, clearToilets, simulateActivity, useToilets } from "@/lib/toilets";
import { cn } from "@/lib/utils";

/** Everything you can change, in groups. Reached from the gear on the Profile page. */
export default function SettingsPage() {
  const router = useRouter();
  const { t, lang } = useT();
  const settings = useSettings();
  const toilets = useToilets();
  const userId = useUserId();
  const [confirmClear, setConfirmClear] = useState(false);
  const [notifyBlocked, setNotifyBlocked] = useState(false);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [exported, setExported] = useState(false);
  const mine = toilets.filter((x) => x.mine);
  const docs = LEGAL[lang];

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

  /** A file with what this phone holds about you, to keep (or to attach to a data request). */
  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      profile: { id: userId, name: settings.name },
      settings,
      placesYouShared: mine.map(({ id, name, code, kind, access, price, hours, note, latitude, longitude, addedAt, confirms, reports }) => ({
        id, name, code, kind, access, price, hours, note, latitude, longitude, addedAt, confirms, reports,
      })),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "magyarotyesz-my-data.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExported(true);
    window.setTimeout(() => setExported(false), 3000);
  };

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-16">
        <Link href="/profile" transitionTypes={BACK} className="-ml-2 mt-3 inline-flex h-10 items-center gap-1.5 rounded-full px-2 text-sm text-haze hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> {t.settings.back}
        </Link>
        <h1 className="t-display mt-2">{t.settings.title}</h1>

        <section className="mt-8" aria-labelledby="general-heading">
          <Heading id="general-heading">{t.settings.general}</Heading>
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
                    className={cn("h-8 rounded-full px-3.5 text-sm font-semibold transition-colors", settings.lang === key ? "bg-ink text-night" : "text-haze")}
                  >
                    {key === "en" ? "EN" : "HU"}
                  </button>
                ))}
              </div>
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
              <LinkRow icon={<RotateCcw className="size-5" />} title={t.profile.intro} sub={t.profile.introSub} onClick={showIntro} />
            </li>
          </ul>
        </section>

        <section className="mt-8" aria-labelledby="map-heading">
          <Heading id="map-heading">{t.settings.mapGroup}</Heading>
          <ul className={cn(CARD, "divide-y divide-dusk-edge")}>
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
          </ul>
        </section>

        <section className="mt-8" aria-labelledby="codes-heading">
          <Heading id="codes-heading">{t.settings.codesGroup}</Heading>
          <ul className={cn(CARD, "divide-y divide-dusk-edge")}>
            <li>
              <SwitchRow
                icon={<Eye className="size-5" />}
                title={t.settings.showCodes}
                sub={t.settings.showCodesSub}
                on={settings.showCodes}
                onChange={(on) => updateSettings({ showCodes: on })}
              />
            </li>
            <li>
              <SwitchRow
                icon={<Sparkles className="size-5" />}
                title={t.settings.animations}
                sub={t.settings.animationsSub}
                on={settings.animations}
                onChange={(on) => updateSettings({ animations: on })}
              />
            </li>
            <li>
              <SwitchRow
                icon={<Vibrate className="size-5" />}
                title={t.settings.haptics}
                sub={t.settings.hapticsSub}
                on={settings.haptics}
                onChange={(on) => updateSettings({ haptics: on })}
              />
            </li>
          </ul>
        </section>

        <section className="mt-8" aria-labelledby="data-heading">
          <Heading id="data-heading">{t.settings.dataGroup}</Heading>
          <ul className={cn(CARD, "divide-y divide-dusk-edge")}>
            <li>
              <LinkRow
                icon={<Download className="size-5" />}
                title={t.settings.export}
                sub={exported ? t.settings.exported : t.settings.exportSub}
                onClick={exportData}
                chevron={false}
              />
            </li>
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
                  <LinkRow icon={<Smartphone className="size-5" />} title={t.profile.simulate} sub={t.profile.simulateSub} onClick={simulate} />
                </li>
              )}
            </ul>
            <p className="mt-2 px-1 text-[0.8125rem] text-haze">{t.profile.demoSub}</p>
          </section>
        )}

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

        <footer className="mt-8 text-[0.8125rem] leading-relaxed text-haze">{REMOTE ? t.sync.footer : t.profile.footer}</footer>
      </main>
    </PageTransition>
  );
}
