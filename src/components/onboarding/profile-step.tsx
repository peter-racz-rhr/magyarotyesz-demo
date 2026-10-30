"use client";

import { ProfileForm } from "@/components/profile-editor";
import { Wordmark } from "@/components/wordmark";
import { useT } from "@/lib/i18n";

/** Before the map: a name and a picture (both optional), so the profile feels like yours from the start. */
export function ProfileStep({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)]">
      <div className="flex h-12 items-center">
        <Wordmark className="text-[1.375rem] font-bold tracking-[-0.04em]" />
      </div>
      <h1 className="mt-6 text-[2.5rem] leading-[0.98] font-bold tracking-[-0.03em] [font-stretch:90%]">{t.account.profileTitle}</h1>
      <p className="mt-3 text-[1.0625rem] leading-snug text-haze">{t.account.profileIntro}</p>
      <div className="mt-6 flex flex-1 flex-col">
        <ProfileForm onSaved={onDone} submitLabel={t.account.profileNext}>
          <button type="button" onClick={onDone} className="mt-2 h-12 w-full rounded-full text-[1rem] font-semibold text-haze active:opacity-70">
            {t.account.profileSkip}
          </button>
        </ProfileForm>
      </div>
    </div>
  );
}
