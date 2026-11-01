import { cn } from "@/lib/utils";

/** The LooKey mark: a keyhole in a ring (the door, and the code that opens it). Inherits the text colour unless given one. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" aria-hidden className={className}>
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="9" />
      <path
        fill="currentColor"
        d="M50 26a12 12 0 0 1 6.6 22.03l3.26 20.2A3.3 3.3 0 0 1 56.6 72H43.4a3.3 3.3 0 0 1-3.26-3.77l3.26-20.2A12 12 0 0 1 50 26z"
      />
    </svg>
  );
}

/** The name with its mark, in the brand green. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.28em] text-[2.25rem] leading-none font-bold tracking-[-0.045em] text-ink",
        className,
      )}
    >
      <LogoMark className="size-[1.05em] shrink-0 text-brand" />
      LooKey
    </span>
  );
}
