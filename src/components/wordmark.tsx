import { cn } from "@/lib/utils";

/** The name with its mark: the green light a keypad shows when the door opens. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[0.32em] text-[2.25rem] leading-none font-semibold tracking-[-0.03em] text-ink",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-block size-[0.42em] rounded-full bg-good shadow-[0_0_0.45em_0.05em_var(--good)]"
      />
      magyarotyesz
    </span>
  );
}
