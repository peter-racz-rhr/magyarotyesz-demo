import { cn } from "@/lib/utils";

/** The LooKey mark: a toilet seen from above (tank and bowl) with a keyhole in the bowl. Takes the text colour. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden className={className}>
      <defs>
        {/* The tank sits in front: the bowl's outline stops where the tank covers it. Same geometry everywhere, so a shared id is fine. */}
        <mask id="lk-bowl" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="#fff" />
          <rect x="6" y="6" width="88" height="34" rx="10" fill="#000" />
        </mask>
      </defs>
      <ellipse cx="50" cy="63" rx="30" ry="32" stroke="currentColor" strokeWidth="8" mask="url(#lk-bowl)" />
      <rect x="10" y="10" width="80" height="26" rx="6" stroke="currentColor" strokeWidth="8" />
      <path
        fill="currentColor"
        d="M50 47a9 9 0 0 1 5 16.5l2.5 15.2A2.7 2.7 0 0 1 54.8 82H45.2a2.7 2.7 0 0 1-2.7-3.3L45 63.5A9 9 0 0 1 50 47z"
      />
    </svg>
  );
}

/** The name with its mark. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.28em] text-[2.25rem] leading-none font-bold tracking-[-0.045em] text-ink",
        className,
      )}
    >
      <LogoMark className="size-[1.1em] shrink-0" />
      LooKey
    </span>
  );
}
