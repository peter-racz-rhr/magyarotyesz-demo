"use client";

import { Bell, Camera, Check, Copy, Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileEditor } from "@/components/profile-editor";
import { PageTransition } from "@/components/page-transition";
import { Avatar, CARD, Group } from "@/components/settings-ui";
import { HealthDot } from "@/components/toilet-card";
import { btn } from "@/components/ui/buttons";
import { REMOTE } from "@/lib/api";
import { alertLine, useT } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { dismissNotice, syncNow, useGotInTotal, usePendingCount, useNotices, useSyncStatus, useUserId } from "@/lib/sync";
import { ago, clearAlerts, markAlertsRead, removeToilet, useAlerts, useToilets } from "@/lib/toilets";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { t, lang } = useT();
  const toilets = useToilets();
  const alerts = useAlerts();
  const notices = useNotices();
  const pending = usePendingCount();
  const sync = useSyncStatus();
  const settings = useSettings();
  const userId = useUserId();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
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

  return (
    <PageTransition>
      <main className="mx-auto w-full max-w-md px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        {/* One slim line on top: sync state on the left, the gear on the right edge */}
        <div className="flex h-11 items-center">
          {REMOTE && (
            <span data-testid="sync-status" className="inline-flex max-w-[14rem] items-center gap-2 text-[0.8125rem] text-haze">
              <span
                aria-hidden
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  sync.syncing ? "animate-pulse bg-stale" : sync.online === false ? "bg-bad" : pending > 0 ? "bg-stale" : "bg-good",
                )}
              />
              <span className="truncate">{statusText}</span>
            </span>
          )}
          <span className="flex-1" />
          <Link
            href="/settings"
            aria-label={t.profile.settingsAria}
            className="-mr-2.5 grid size-11 place-items-center rounded-full text-ink/80 transition-colors active:bg-fg/10"
          >
            <Settings className="size-[1.375rem]" strokeWidth={1.7} aria-hidden />
          </Link>
        </div>

        {/* You: a big picture and a big name */}
        <header className="flex flex-col items-center pt-2">
          <button type="button" onClick={() => setEditing(true)} aria-label={t.profile.editProfile} className="relative rounded-full active:opacity-80">
            <Avatar name={settings.name} hue={settings.avatar} photo={settings.photo} size={120} />
            <span className="absolute right-0.5 bottom-0.5 grid size-9 place-items-center rounded-full bg-ink text-night ring-[3px] ring-night">
              <Camera className="size-4" strokeWidth={2} aria-hidden />
            </span>
          </button>
          <button type="button" onClick={() => setEditing(true)} className="mt-4 max-w-full px-2 active:opacity-70">
            <span className={cn("block truncate text-[1.75rem] leading-tight font-bold tracking-tight", !settings.name && "text-haze")}>
              {settings.name || t.profile.noName}
            </span>
          </button>
          {userId && (
            <button type="button" onClick={copyId} className="mt-1 inline-flex max-w-full items-center gap-1.5 text-[0.8125rem] text-haze" aria-label={`${t.profile.idLabel} ${userId}`}>
              <span className="truncate font-mono">{userId.slice(0, 11)}</span>
              {copied ? <Check className="size-3.5 text-good" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            </button>
          )}
          <button type="button" onClick={() => setEditing(true)} className="mt-4 h-9 rounded-full bg-fg/[0.08] px-5 text-[0.875rem] font-semibold active:bg-fg/[0.14]">
            {t.profile.editProfile}
          </button>
        </header>

        {/* The two numbers that matter, in one block */}
        <dl className={cn(CARD, "mt-7 grid grid-cols-2 divide-x divide-fg/[0.07]")}>
          <div className="px-4 py-3.5 text-center">
            <dd className="text-[1.625rem] leading-none font-bold tabular-nums">{mine.length}</dd>
            <dt className="mt-1.5 text-[0.75rem] text-haze">{t.profile.statShared}</dt>
          </div>
          <div className="px-4 py-3.5 text-center">
            <dd className="text-[1.625rem] leading-none font-bold tabular-nums">{gotIn}</dd>
            <dt className="mt-1.5 text-[0.75rem] text-haze">{t.profile.statGotIn}</dt>
          </div>
        </dl>
        {REMOTE && (pending > 0 || sync.online === false) && !sync.syncing && (
          <button type="button" onClick={() => void syncNow()} className={cn(btn.secondary, btn.sm, "mt-3 w-full")}>
            {t.sync.sendNow}
          </button>
        )}

        {notices.length > 0 && (
          <Group id="notices-heading" title={t.sync.noticesTitle} badge={notices.length} plain>
            {notices.map((notice) => (
              <li key={notice.id} className="flex items-center gap-3 px-4 py-3">
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-bad" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] leading-snug">{t.sync.notice(notice.type, notice.name)}</span>
                  <span className="block text-[0.8125rem] text-haze">{notice.code === "validation" && notice.message ? notice.message : (t.sync.errors[notice.code] ?? notice.message)}</span>
                </span>
                <button type="button" onClick={() => dismissNotice(notice.id)} className="py-1 text-[0.875rem] font-semibold text-haze active:text-ink">
                  {t.sync.dismiss}
                </button>
              </li>
            ))}
          </Group>
        )}

        {/* Alerts about your codes */}
        <Group
          id="alerts-heading"
          title={t.profile.alerts}
          badge={unreadCount}
          plain
          action={
            alerts.length > 0 && (
              <button type="button" onClick={clearAlerts} className="text-[0.8125rem] font-semibold text-haze active:text-ink">
                {t.profile.clearAlerts}
              </button>
            )
          }
        >
          {alerts.length === 0 ? (
            <li className="flex items-center gap-3 px-4 py-3.5 text-[0.875rem] text-haze">
              <Bell className="size-[1.125rem] shrink-0" strokeWidth={1.7} aria-hidden />
              {t.profile.noAlerts}
            </li>
          ) : (
            alerts.map((alert) => (
              <li key={alert.id} className="flex items-start gap-3 px-4 py-3">
                <span aria-hidden className={cn("mt-2 size-2 shrink-0 rounded-full", alert.read ? "bg-fg/20" : "bg-good shadow-[0_0_8px_1px_var(--good)]")} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] leading-snug">
                    {alertLine(t, alert)}
                  </span>
                  <span className="block text-[0.8125rem] text-haze">{ago(alert.at, lang)}</span>
                </span>
              </li>
            ))
          )}
        </Group>

        {/* Codes you shared */}
        <Group id="mine-heading" title={t.profile.mine} plain>
          {mine.length === 0 ? (
            <li className="px-4 py-3.5 text-[0.875rem] text-haze">{t.profile.mineEmpty}</li>
          ) : (
            mine.map((toilet) => (
              <li key={toilet.id} className="flex items-center gap-3 py-2.5 pr-1.5 pl-4">
                <HealthDot toilet={toilet} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] font-semibold">{toilet.name}</span>
                  <span className="block truncate text-[0.8125rem] text-haze">
                    {t.kinds[toilet.kind]} · {t.profile.added(ago(toilet.addedAt, lang))}
                  </span>
                </span>
                <span className="rounded-md bg-well px-2 py-1 font-mono text-[0.8125rem] tracking-[0.1em] text-ink/85">{toilet.code}</span>
                <button
                  type="button"
                  onClick={() => removeToilet(toilet.id)}
                  aria-label={REMOTE ? `${t.profile.remove(toilet.name)}. ${t.sync.removeNote}` : t.profile.remove(toilet.name)}
                  className="grid size-11 place-items-center rounded-full text-haze active:text-bad"
                >
                  <Trash2 className="size-[1.0625rem]" strokeWidth={1.7} />
                </button>
              </li>
            ))
          )}
        </Group>

        <p className="mt-8 px-5 text-[0.8125rem] leading-relaxed text-haze">{t.profile.idHint}</p>
      </main>
      {editing && <ProfileEditor onClose={() => setEditing(false)} />}
    </PageTransition>
  );
}
