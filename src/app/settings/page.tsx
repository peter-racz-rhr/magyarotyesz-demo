"use client";

import { ArrowLeft, Bell, Box, CloudDownload, Layers, Megaphone, MessageSquare, Moon, PanelBottom, Type, Download, KeyRound, Eye, FileText, Globe, Landmark, LocateFixed, SunMoon, MapPinCheck, RotateCcw, ShieldCheck, Smartphone, Sparkles, Trash2, Users, Vibrate } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BACK, PageTransition } from "@/components/page-transition";
import { MapStylePicker } from "@/components/map-style-picker";
import { PalettePicker } from "@/components/palette-picker";
import { Group, LinkRow, SwitchRow, Tile } from "@/components/settings-ui";
import { btn } from "@/components/ui/buttons";
import { REMOTE } from "@/lib/api";
import { alertLine, useT } from "@/lib/i18n";
import { legalFor } from "@/lib/legal-text";
import { requestLocation } from "@/lib/location";
import { downloadOfflineMap, removeOfflineMap, useOfflineMap } from "@/lib/offline-map";
import { askForNotifications, notify } from "@/lib/notify";
import { replayIntro } from "@/lib/onboarding";
import { normalizePalette } from "@/lib/palettes";
import { updateSettings, useSettings, type Lang, type Settings } from "@/lib/settings";
import { useLook } from "@/lib/theme";
import { deleteMyData, fetchMyData, hasIdentity, useUserId, verifyCode } from "@/lib/sync";
import { addDemoToilets, clearAlerts, clearToilets, simulateActivity, useToilets } from "@/lib/toilets";
import { cn } from "@/lib/utils";

/** Everything you can change, in groups. Reached from the gear on the Profile page. */

/** Save Budapest for offline use: a button, a progress line, and what is saved. */
function OfflineMapRow() {
  const { t, lang } = useT();
  const saved = useOfflineMap();
  const [progress, setProgress] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const controller = useRef<AbortController | null>(null);

  const start = async () => {
    setFailed(false);
    setProgress(0);
    const abort = new AbortController();
    controller.current = abort;
    try {
      await downloadOfflineMap(setProgress, abort.signal);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setFailed(true);
    } finally {
      controller.current = null;
      setProgress(null);
    }
  };
  const when = saved ? new Date(saved.savedAt).toLocaleDateString(lang === "hu" ? "hu-HU" : lang === "de" ? "de-DE" : "en-GB", { dateStyle: "medium" }) : "";

  return (
    <li className="flex flex-col gap-2.5 px-4 py-3 text-[1rem]">
      <div className="flex items-center gap-3.5">
        <Tile hue={212}>
          <CloudDownload />
        </Tile>
        <span className="min-w-0 flex-1">
          {t.settings.offlineTitle}
          <span className="block text-[0.8125rem] leading-snug text-haze">
            {progress !== null ? t.settings.offlineProgress(Math.round(progress * 100)) : saved ? t.settings.offlineSaved(when, Math.max(1, Math.round(saved.bytes / 1_000_000))) : t.settings.offlineSub}
          </span>
        </span>
        {progress !== null ? (
          <button type="button" onClick={() => controller.current?.abort()} className={cn(btn.quiet, btn.sm, "px-3")}>
            {t.settings.offlineCancel}
          </button>
        ) : saved ? (
          <button type="button" onClick={() => void removeOfflineMap()} className={cn(btn.secondary, btn.sm, "px-3.5")}>
            {t.settings.offlineRemove}
          </button>
        ) : (
          <button type="button" onClick={() => void start()} className={cn(btn.primary, btn.sm, "px-3.5")}>
            {t.settings.offlineDownload}
          </button>
        )}
      </div>
      {progress !== null && (
        <div role="progressbar" aria-label={t.settings.offlineTitle} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} className="h-1.5 overflow-hidden rounded-full bg-fg/[0.1]">
          <div className="h-full rounded-full bg-brand transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
      {failed && (
        <p role="alert" className="text-[0.8125rem] text-stale">
          {t.settings.offlineFailed}
        </p>
      )}
    </li>
  );
}

/** A row with a title and a wrapping set of options, for choices with more than three answers. */
function ChoiceRow<K extends "navStyle" | "glass" | "flavour">({
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
            className={cn("min-h-8 min-w-0 flex-1 rounded-full px-2 py-1 text-[0.8125rem] leading-tight font-semibold transition-colors", value === key ? "bg-ink text-night" : "text-haze")}
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
  const look = useLook();
  const toilets = useToilets();
  const userId = useUserId();
  const [confirmClear, setConfirmClear] = useState(false);
  const [notifyBlocked, setNotifyBlocked] = useState(false);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [exported, setExported] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState<"idle" | "busy" | "failed">("idle");
  useEffect(() => {
    if (REMOTE) void verifyCode().then(setCode);
  }, [userId]);
  const mine = toilets.filter((x) => x.mine);
  const docs = legalFor(lang);

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
          <Link href="/profile" transitionTypes={BACK} className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full pr-3 pl-1.5 text-[0.9375rem] text-brand active:opacity-60">
            <ArrowLeft className="size-[1.125rem]" strokeWidth={2} aria-hidden /> {t.settings.back}
          </Link>
        </div>
        <h1 className="mt-1 px-1 text-[2rem] leading-tight font-bold tracking-tight">{t.settings.title}</h1>

        <Group id="general-heading" title={t.settings.general}>
          <li className="flex min-h-[3.25rem] flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-2 text-[1rem]">
            <Tile hue={212}>
              <Globe />
            </Tile>
            <span className="min-w-0 flex-1 basis-24">{t.profile.language}</span>
            <div role="radiogroup" aria-label={t.profile.language} className="ml-auto flex max-w-full rounded-full bg-well p-0.5">
              {(["en", "hu", "de"] as Lang[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={settings.lang === key}
                  onClick={() => updateSettings({ lang: key })}
                  className={cn("h-7 min-w-11 rounded-full px-3 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors", settings.lang === key ? "bg-ink text-night" : "text-haze")}
                >
                  {key.toUpperCase()}
                </button>
              ))}
            </div>
          </li>
          <li className="flex min-h-[3.25rem] flex-wrap items-center gap-x-3.5 gap-y-2 px-4 py-2 text-[1rem]">
            <Tile hue={42}>
              <SunMoon />
            </Tile>
            <span className="min-w-0 flex-1 basis-24">{t.settings.theme}</span>
            <div role="radiogroup" aria-label={t.settings.theme} className="ml-auto flex max-w-full rounded-full bg-well p-0.5">
              {(["system", "dark", "light"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={settings.theme === key}
                  onClick={() => updateSettings({ theme: key })}
                  className={cn("h-7 min-w-11 rounded-full px-3 text-[0.8125rem] font-semibold whitespace-nowrap transition-colors", settings.theme === key ? "bg-ink text-night" : "text-haze")}
                >
                  {t.settings.themeNames[key]}
                </button>
              ))}
            </div>
          </li>
          <li className="flex flex-col gap-2.5 px-4 py-3 text-[1rem]">
            <div className="flex items-center gap-3.5">
              <Tile hue={196}>
                <Type />
              </Tile>
              <span className="flex-1">{t.settings.textSize}</span>
            </div>
            <div role="radiogroup" aria-label={t.settings.textSize} className="flex rounded-full bg-well p-0.5">
              {(["normal", "large", "xl"] as const).map((key, i) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={settings.textSize === key}
                  onClick={() => updateSettings({ textSize: key })}
                  className={cn("min-h-9 min-w-0 flex-1 rounded-full px-2 py-1 leading-tight font-semibold transition-colors", settings.textSize === key ? "bg-ink text-night" : "text-haze")}
                  style={{ fontSize: `${0.8125 + i * 0.125}rem` }}
                >
                  {t.settings.textNames[key]}
                </button>
              ))}
            </div>
          </li>
          <SwitchRow icon={<Bell />} hue={6} title={t.profile.notify} on={settings.notify} onChange={toggleNotify} />
          <LinkRow icon={<RotateCcw />} hue={268} title={t.profile.intro} onClick={showIntro} />
        </Group>
        {notifyBlocked && <p className="mt-2 px-5 text-[0.8125rem] text-stale">{t.profile.notifyBlocked}</p>}

        <section className="mt-8" aria-labelledby="palette-heading">
          <h2 id="palette-heading" className="mb-2 px-5 text-[0.9375rem] font-semibold text-haze">
            {t.settings.paletteGroup}
          </h2>
          <PalettePicker value={normalizePalette(settings.palette)} look={look} flavour={settings.flavour} names={t.settings.paletteNames} label={t.settings.paletteGroup} onChange={(palette) => updateSettings({ palette })} />
          {look === "dark" && (
            <ul className="mx-5 mt-2 overflow-hidden rounded-2xl bg-dusk">
              <ChoiceRow icon={<Moon />} hue={250} title={t.settings.flavour} names={t.settings.flavourNames} value={settings.flavour} field="flavour" />
            </ul>
          )}
          <p className="mt-2 px-5 text-[0.8125rem] leading-relaxed text-haze">{t.settings.paletteFooter}</p>
        </section>

        <Group id="nav-heading" title={t.settings.navGroup} footer={t.settings.footerNav}>
          <ChoiceRow icon={<PanelBottom />} hue={162} title={t.settings.navStyle} names={t.settings.navNames} value={settings.navStyle} field="navStyle" />
          <ChoiceRow icon={<Layers />} hue={24} title={t.settings.glass} names={t.settings.glassNames} value={settings.glass} field="glass" />
        </Group>

        <section className="mt-8" aria-labelledby="mapstyle-heading">
          <h2 id="mapstyle-heading" className="mb-2 px-5 text-[0.9375rem] font-semibold text-haze">
            {t.settings.mapStyles}
          </h2>
          <MapStylePicker />
          <p className="mt-2 px-5 text-[0.8125rem] leading-relaxed text-haze">{t.settings.mapStyleHint}</p>
        </section>

        <Group id="map-heading" title={t.settings.mapGroup} footer={locationBlocked ? t.profile.locationBlocked : t.settings.footerMap} tone={locationBlocked ? "warn" : undefined}>
          <OfflineMapRow />
          <SwitchRow icon={<LocateFixed />} hue={212} title={t.profile.location} on={settings.location} onChange={toggleLocation} />
          <SwitchRow icon={<Box />} hue={150} title={t.profile.buildings3d} on={settings.buildings3d} onChange={(on) => updateSettings({ buildings3d: on })} />
          {!REMOTE && <SwitchRow icon={<MapPinCheck />} hue={32} title={t.profile.onTheSpot} on={settings.nearbyCheck} onChange={(on) => updateSettings({ nearbyCheck: on })} />}
        </Group>

        <Group id="codes-heading" title={t.settings.codesGroup} footer={t.settings.footerCodes}>
          <SwitchRow icon={<Eye />} hue={46} title={t.settings.showCodes} on={settings.showCodes} onChange={(on) => updateSettings({ showCodes: on })} />
          <SwitchRow icon={<Sparkles />} hue={282} title={t.settings.animations} on={settings.animations} onChange={(on) => updateSettings({ animations: on })} />
          <SwitchRow icon={<Vibrate />} hue={330} title={t.settings.haptics} on={settings.haptics} onChange={(on) => updateSettings({ haptics: on })} />
        </Group>

        <Group id="help-heading" title={t.settings.helpGroup}>
          <LinkRow icon={<MessageSquare />} hue={162} title={t.settings.feedbackLink} href="/feedback" />
          <LinkRow icon={<Megaphone />} hue={42} title={t.settings.whatsNew} href="/changelog" />
        </Group>

        <Group id="data-heading" title={t.settings.dataGroup} footer={exported ? t.settings.exported : t.settings.footerData}>
          <LinkRow icon={<Download />} hue={212} title={t.settings.export} onClick={() => void exportData()} chevron={false} />
          {REMOTE && <LinkRow icon={<KeyRound />} hue={268} title={t.settings.backup} href="/backup" />}
          {REMOTE && code && (
            <li className="flex min-h-[3.25rem] items-center gap-3.5 px-4 py-2 text-[1rem]">
              <Tile hue={150}>
                <ShieldCheck />
              </Tile>
              <span className="min-w-0 flex-1">
                {t.settings.verifyCode}
                <span className="block text-[0.8125rem] leading-snug text-haze">{t.settings.verifyCodeSub}</span>
              </span>
              <span className="font-mono text-[1.0625rem] font-semibold tracking-widest select-all">{code}</span>
            </li>
          )}
          <LinkRow icon={<FileText />} tone="grey" title={docs.terms.title} href="/terms" />
          <LinkRow icon={<ShieldCheck />} tone="grey" title={docs.privacy.title} href="/privacy" />
          <LinkRow icon={<Landmark />} tone="grey" title={docs.imprint.title} href="/imprint" />
        </Group>

        {REMOTE && hasIdentity() && (
          <Group id="delete-data" plain>
            {confirmDelete ? (
              <li className="flex flex-col gap-3 px-4 py-3">
                <span className="text-sm">{t.settings.deleteMyDataConfirm}</span>
                {deleting === "failed" && <span role="alert" className="text-sm text-stale">{t.settings.deleteMyDataFailed}</span>}
                <span className="flex gap-2">
                  <button type="button" onClick={() => setConfirmDelete(false)} className={cn(btn.secondary, btn.sm, "flex-1")}>
                    {t.settings.deleteMyDataCancel}
                  </button>
                  <button
                    type="button"
                    disabled={deleting === "busy"}
                    onClick={async () => {
                      setDeleting("busy");
                      if ((await deleteMyData()) !== "ok") setDeleting("failed");
                    }}
                    className={cn(btn.sm, "inline-flex flex-1 items-center justify-center rounded-full bg-bad font-semibold text-night active:scale-[0.97] disabled:opacity-60")}
                  >
                    {t.settings.deleteMyDataGo}
                  </button>
                </span>
              </li>
            ) : (
              <LinkRow icon={<Trash2 />} tone="bad" danger title={t.settings.deleteMyData} onClick={() => setConfirmDelete(true)} chevron={false} />
            )}
          </Group>
        )}

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
