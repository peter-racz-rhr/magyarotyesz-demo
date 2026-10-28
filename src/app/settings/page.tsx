"use client";

import { ArrowLeft, Bell, Box, Droplet, Layers, Palette, PanelBottom, Download, KeyRound, Eye, FileText, Globe, Landmark, LocateFixed, SunMoon, MapPinCheck, RotateCcw, ShieldCheck, Smartphone, Sparkles, Trash2, Users, Vibrate } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BACK, PageTransition } from "@/components/page-transition";
import { MapStylePicker } from "@/components/map-style-picker";
import { Group, LinkRow, SwitchRow, Tile } from "@/components/settings-ui";
import { btn } from "@/components/ui/buttons";
import { REMOTE } from "@/lib/api";
import { alertLine, useT } from "@/lib/i18n";
import { LEGAL } from "@/lib/legal-text";
import { requestLocation } from "@/lib/location";
import { askForNotifications, notify } from "@/lib/notify";
import { replayIntro } from "@/lib/onboarding";
import { updateSettings, useSettings, type Lang, type Settings } from "@/lib/settings";
import { fetchMyData, useUserId } from "@/lib/sync";
import { addDemoToilets, clearAlerts, clearToilets, simulateActivity, useToilets } from "@/lib/toilets";
import { cn } from "@/lib/utils";

/** Everything you can change, in groups. Reached from the gear on the Profile page. */
/** The pastels as they look in the light theme, for the colour picker. */
const SWATCH = { mint: "#cfeadb", sky: "#cfe3f4", lavender: "#dcd6f2", peach: "#f6dccb", rose: "#f4d3dc" } as const;

/** A row with a title and a wrapping set of options, for choices with more than three answers. */
function ChoiceRow<K extends "navStyle" | "darkBar" | "glass">({
  icon,
  hue,
  title,
  names,
  value,
  field,
}: {
  icon: React.ReactNode;
  hue: number;
  title: string;
  names: Record<string, string>;
  value: Settings[K];
  field: K;
}) {
  return (
    <li className="flex flex-col gap-2.5 px-4 py-3 text-[1rem]">
      <div className="flex items-center gap-3.5">
        <Tile hue={hue}>{icon}</Tile>
        <span className="flex-1">{title}</span>
      </div>
      <div role="radiogroup" aria-label={title} className="flex rounded-full bg-well p-0.5">
        {Object.keys(names).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            onClick={() => updateSettings({ [field]: key } as Partial<Settings>)}
            className={cn("h-8 min-w-0 flex-1 rounded-full px-2 text-[0.8125rem] font-semibold transition-colors", value === key ? "bg-ink text-night" : "text-haze")}
          >
            {names[key]}
          </button>
        ))}
      </div>
    </li>
  );
}

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
        alertLine(t, alert),
      );
    }
  };

  /** A file with what this phone holds about you, to keep (or to attach to a data request). */
  const exportData = async () => {
    const { photo: _photo, ...shared } = settings; // the photo is a big data address; leave it out
    void _photo;
    // The server's side of the story: votes, suggestions and reports are only there.
    const server = REMOTE ? await fetchMyData() : null;
    const data = {
      exportedAt: new Date().toISOString(),
      server,
      profile: { id: userId, name: settings.name, hasPhoto: Boolean(settings.photo) },
      settings: shared,
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
        <div className="flex h-11 items-center">
          <Link href="/profile" transitionTypes={BACK} className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full pr-3 pl-1.5 text-[0.9375rem] text-good active:opacity-60">
            <ArrowLeft className="size-[1.125rem]" strokeWidth={2} aria-hidden /> {t.settings.back}
          </Link>
        </div>
        <h1 className="mt-1 px-1 text-[2rem] leading-tight font-bold tracking-tight">{t.settings.title}</h1>

        <Group id="general-heading" title={t.settings.general}>
          <li className="flex min-h-[3.25rem] items-center gap-3.5 px-4 py-2 text-[1rem]">
            <Tile hue={212}>
              <Globe />
            </Tile>
            <span className="flex-1">{t.profile.language}</span>
            <div role="radiogroup" aria-label={t.profile.language} className="flex rounded-full bg-well p-0.5">
              {(["en", "hu"] as Lang[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={settings.lang === key}
                  onClick={() => updateSettings({ lang: key })}
                  className={cn("h-7 min-w-11 rounded-full px-3 text-[0.8125rem] font-semibold transition-colors", settings.lang === key ? "bg-ink text-night" : "text-haze")}
                >
                  {key === "en" ? "EN" : "HU"}
                </button>
              ))}
            </div>
          </li>
          <li className="flex min-h-[3.25rem] items-center gap-3.5 px-4 py-2 text-[1rem]">
            <Tile hue={42}>
              <SunMoon />
            </Tile>
            <span className="flex-1">{t.settings.theme}</span>
            <div role="radiogroup" aria-label={t.settings.theme} className="flex rounded-full bg-well p-0.5">
              {(["system", "dark", "light"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={settings.theme === key}
                  onClick={() => updateSettings({ theme: key })}
                  className={cn("h-7 min-w-11 rounded-full px-3 text-[0.8125rem] font-semibold transition-colors", settings.theme === key ? "bg-ink text-night" : "text-haze")}
                >
                  {t.settings.themeNames[key]}
                </button>
              ))}
            </div>
          </li>
          <SwitchRow icon={<Bell />} hue={6} title={t.profile.notify} on={settings.notify} onChange={toggleNotify} />
          <LinkRow icon={<RotateCcw />} hue={268} title={t.profile.intro} onClick={showIntro} />
        </Group>
        {notifyBlocked && <p className="mt-2 px-5 text-[0.8125rem] text-stale">{t.profile.notifyBlocked}</p>}

        <Group id="nav-heading" title={t.settings.navGroup} footer={t.settings.footerNav}>
          <ChoiceRow icon={<PanelBottom />} hue={162} title={t.settings.navStyle} names={t.settings.navNames} value={settings.navStyle} field="navStyle" />
          <ChoiceRow icon={<Layers />} hue={24} title={t.settings.glass} names={t.settings.glassNames} value={settings.glass} field="glass" />
          {settings.glass === "solid" && (
            <li className="flex flex-col gap-2.5 px-4 py-3 text-[1rem]">
              <span className="flex items-center gap-3.5">
                <Tile hue={340}>
                  <Droplet />
                </Tile>
                <span className="flex-1">{t.settings.solidColor}</span>
              </span>
              <div role="radiogroup" aria-label={t.settings.solidColor} className="flex justify-between px-1">
                {(["mint", "sky", "lavender", "peach", "rose"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={settings.solidColor === key}
                    aria-label={t.settings.solidNames[key]}
                    onClick={() => updateSettings({ solidColor: key })}
                    style={{ backgroundColor: SWATCH[key] }}
                    className={cn("size-10 rounded-full ring-offset-2 ring-offset-dusk transition-shadow", settings.solidColor === key ? "ring-2 ring-ink" : "ring-1 ring-fg/15")}
                  />
                ))}
              </div>
            </li>
          )}
          <ChoiceRow icon={<Palette />} hue={300} title={t.settings.darkBar} names={t.settings.darkBarNames} value={settings.darkBar} field="darkBar" />
        </Group>

        <section className="mt-8" aria-labelledby="mapstyle-heading">
          <h2 id="mapstyle-heading" className="mb-2 px-5 text-[0.9375rem] font-semibold text-ink/65">
            {t.settings.mapStyles}
          </h2>
          <MapStylePicker />
          <p className="mt-2 px-5 text-[0.8125rem] leading-relaxed text-haze">{t.settings.mapStyleHint}</p>
        </section>

        <Group id="map-heading" title={t.settings.mapGroup} footer={locationBlocked ? t.profile.locationBlocked : t.settings.footerMap} tone={locationBlocked ? "warn" : undefined}>
          <SwitchRow icon={<LocateFixed />} hue={212} title={t.profile.location} on={settings.location} onChange={toggleLocation} />
          <SwitchRow icon={<Box />} hue={150} title={t.profile.buildings3d} on={settings.buildings3d} onChange={(on) => updateSettings({ buildings3d: on })} />
          {!REMOTE && <SwitchRow icon={<MapPinCheck />} hue={32} title={t.profile.onTheSpot} on={settings.nearbyCheck} onChange={(on) => updateSettings({ nearbyCheck: on })} />}
        </Group>

        <Group id="codes-heading" title={t.settings.codesGroup} footer={t.settings.footerCodes}>
          <SwitchRow icon={<Eye />} hue={46} title={t.settings.showCodes} on={settings.showCodes} onChange={(on) => updateSettings({ showCodes: on })} />
          <SwitchRow icon={<Sparkles />} hue={282} title={t.settings.animations} on={settings.animations} onChange={(on) => updateSettings({ animations: on })} />
          <SwitchRow icon={<Vibrate />} hue={330} title={t.settings.haptics} on={settings.haptics} onChange={(on) => updateSettings({ haptics: on })} />
        </Group>

        <Group id="data-heading" title={t.settings.dataGroup} footer={exported ? t.settings.exported : t.settings.footerData}>
          <LinkRow icon={<Download />} hue={212} title={t.settings.export} onClick={() => void exportData()} chevron={false} />
          {REMOTE && <LinkRow icon={<KeyRound />} hue={268} title={t.settings.backup} href="/backup" />}
          <LinkRow icon={<FileText />} tone="grey" title={docs.terms.title} href="/terms" />
          <LinkRow icon={<ShieldCheck />} tone="grey" title={docs.privacy.title} href="/privacy" />
          <LinkRow icon={<Landmark />} tone="grey" title={docs.imprint.title} href="/imprint" />
        </Group>

        {!REMOTE && (mine.length > 0 || !toilets.some((x) => !x.mine)) && (
          <Group id="demo-heading" title={t.profile.demo} footer={t.profile.demoSub}>
            {!toilets.some((x) => !x.mine) && <LinkRow icon={<Users />} hue={190} title={t.profile.demoOthers} onClick={addDemoToilets} />}
            {mine.length > 0 && <LinkRow icon={<Smartphone />} hue={190} title={t.profile.simulate} onClick={simulate} />}
          </Group>
        )}

        {!REMOTE && (
          <Group id="danger" plain>
            {confirmClear ? (
              <li className="flex min-h-[3.25rem] items-center gap-3 px-4 py-2">
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
              </li>
            ) : (
              <LinkRow icon={<Trash2 />} tone="bad" danger title={t.profile.deleteAll} onClick={() => setConfirmClear(true)} chevron={false} />
            )}
          </Group>
        )}

        <footer className="mt-8 px-5 text-[0.8125rem] leading-relaxed text-haze">{REMOTE ? t.sync.footer : t.profile.footer}</footer>
      </main>
    </PageTransition>
  );
}
