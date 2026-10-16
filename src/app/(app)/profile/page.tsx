"use client";

import { Check, Copy, Pencil, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/page-transition";
import { Avatar, CARD, Heading, Tile } from "@/components/settings-ui";
import { HealthDot } from "@/components/toilet-card";
import { btn } from "@/components/ui/buttons";
import { REMOTE } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { checkFields } from "@/lib/moderation";
import { AVATAR_HUES, NAME_MAX, saveProfile, tidyName } from "@/lib/profile";
import { useSettings } from "@/lib/settings";
import { dismissNotice, syncNow, useGotInTotal, usePendingCount, useNotices, useSyncStatus, useUserId } from "@/lib/sync";
import { ago, clearAlerts, markAlertsRead, removeToilet, useAlerts, useToilets } from "@/lib/toilets";
import { cn } from "@/lib/utils";

/** The name and circle, with a small editor that opens in place. */
function ProfileHeader() {
  const { t } = useT();
  const settings = useSettings();
  const userId = useUserId();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [hue, setHue] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const open = () => {
    setName(settings.name);
    setHue(settings.avatar);
    setError("");
    setEditing(true);
  };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = tidyName(name);
    if (!checkFields({ name: clean }).ok) return setError(t.add.errBad);
    saveProfile(clean, hue);
    setEditing(false);
  };
  const copyId = async () => {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the id is on screen anyway.
    }
  };

  if (editing) {
    return (
      <form onSubmit={save} className={cn(CARD, "mt-4 flex flex-col gap-4 p-4")}>
        <div className="flex items-center gap-4">
          <Avatar name={name} hue={hue} size={64} />
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-[0.8125rem] text-haze">{t.profile.nameLabel}</span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value.slice(0, NAME_MAX));
                setError("");
              }}
              maxLength={NAME_MAX}
              placeholder={t.profile.namePlaceholder}
              autoComplete="nickname"
              enterKeyHint="done"
              className="h-11 w-full rounded-full border border-dusk-edge bg-night px-4 outline-none placeholder:text-haze/60 focus:border-good"
            />
          </label>
        </div>
        <div>
          <span className="mb-2 block text-[0.8125rem] text-haze">{t.profile.colourLabel}</span>
          <div role="radiogroup" aria-label={t.profile.colourLabel} className="flex flex-wrap gap-2">
            {AVATAR_HUES.map((h, i) => (
              <button
                key={h}
                type="button"
                role="radio"
                aria-checked={hue === i}
                aria-label={`${t.profile.colourLabel} ${i + 1}`}
                onClick={() => setHue(i)}
                className={cn("size-7 rounded-full transition-transform", hue === i ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-night" : "opacity-80")}
                style={{ background: `hsl(${h} 65% 58%)` }}
              />
            ))}
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-stale">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(false)} className={cn(btn.quiet, btn.md)}>
            {t.card.cancel}
          </button>
          <button type="submit" className={cn(btn.primary, btn.md)}>
            {t.card.save}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="mt-4 flex items-center gap-4">
      <Avatar name={settings.name} hue={settings.avatar} size={64} />
      <div className="min-w-0 flex-1">
        <button type="button" onClick={open} className="flex max-w-full items-center gap-2 text-left" aria-label={t.profile.editProfile}>
          <span className={cn("truncate text-[1.5rem] leading-tight font-bold", !settings.name && "text-haze")}>{settings.name || t.profile.noName}</span>
          <Pencil className="size-4 shrink-0 text-haze" aria-hidden />
        </button>
        {userId && (
          <button type="button" onClick={copyId} className="mt-0.5 flex max-w-full items-center gap-1.5 text-[0.8125rem] text-haze" aria-label={`${t.profile.idLabel} ${userId}`}>
            <span className="truncate font-mono">
              {t.profile.idLabel}: {userId.slice(0, 11)}
            </span>
            {copied ? <Check className="size-3.5 text-good" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { t, lang } = useT();
  const toilets = useToilets();
  const alerts = useAlerts();
  const notices = useNotices();
  const pending = usePendingCount();
  const sync = useSyncStatus();
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

  const statusText = sync.syncing
    ? t.sync.syncing
    : sync.online === false
      ? t.sync.offline
      : pending > 0
        ? t.sync.waiting(pending)
        : t.sync.synced;
  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <header className="pt-4">
          <div className="flex items-center gap-2">
            {REMOTE ? (
              <span
                data-testid="sync-status"
                className="inline-flex max-w-[12rem] items-center gap-2 rounded-full border border-dusk-edge px-3 py-1.5 text-xs text-haze"
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
            ) : (
              <span />
            )}
            <span className="flex-1" />
            <Link
              href="/settings"
              aria-label={t.profile.settingsAria}
              className="grid size-11 place-items-center rounded-full border border-dusk-edge bg-white/[0.035] text-ink/85 transition-colors active:bg-white/10"
            >
              <Settings className="size-5" aria-hidden />
            </Link>
          </div>

          <ProfileHeader />

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

        <p className="mt-8 px-1 text-[0.8125rem] leading-relaxed text-haze">{t.profile.idHint}</p>
      </main>
    </PageTransition>
  );
}
