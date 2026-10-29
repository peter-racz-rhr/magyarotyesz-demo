"use client";

import { useT } from "@/lib/i18n";
import { LIMITS, cleanText } from "@/lib/limits";

/** Tap-to-fill tips for the "how to find it" note: the things people most often need to say. */
export function HintChips({ note, onChange }: { note: string; onChange: (next: string) => void }) {
  const { t } = useT();
  const add = (hint: string) => {
    if (note.toLowerCase().includes(hint.toLowerCase())) return;
    onChange(cleanText(note.trim() ? `${note.trim().replace(/[.,;]$/, "")}, ${hint.toLowerCase()}` : hint, LIMITS.note));
  };
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t.add.hintsLabel}>
      {t.add.hintChips.map((hint) => (
        <button key={hint} type="button" onClick={() => add(hint)} className="h-8 rounded-full border border-dusk-edge px-3 text-xs text-haze active:bg-fg/10">
          {hint}
        </button>
      ))}
    </div>
  );
}
