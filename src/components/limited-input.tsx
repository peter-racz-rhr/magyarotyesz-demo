"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "maxLength"> & {
  value: string;
  onValueChange: (value: string) => void;
  max: number;
  /** Cleans what's typed or pasted (strip emoji, keep keypad characters…). */
  clean?: (value: string) => string;
  /** Shown for a moment when something typed was left out. */
  rejectedHint?: string;
  /** Where the count starts to show: remaining characters. Default: the last quarter. */
  showAt?: number;
  wrapperClassName?: string;
};

/**
 * A text field with a limit. Nothing shows until you're close to it, then a
 * small number counts down the characters left, like a messaging app does.
 */
export function LimitedInput({
  value,
  onValueChange,
  max,
  clean,
  rejectedHint,
  showAt = Math.ceil(max / 4),
  wrapperClassName,
  className,
  ...props
}: Props) {
  const left = max - value.length;
  const counting = left <= showAt;
  const [rejected, setRejected] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className={cn("relative", wrapperClassName)}>
      <input
        {...props}
        value={value}
        maxLength={max}
        onChange={(event) => {
          const raw = event.target.value;
          const next = clean ? clean(raw) : raw;
          // Pasting over the limit is simply cut off; only left-out characters get the hint.
          if (clean && next !== raw && raw.length <= max && rejectedHint) {
            setRejected(true);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setRejected(false), 2600);
          }
          onValueChange(next);
        }}
        className={cn(className, counting && "pr-12")}
      />
      {counting && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-0 right-4 flex h-full items-center text-xs tabular-nums transition-colors",
            left <= 3 ? "text-bad" : "text-haze",
          )}
        >
          {left}
        </span>
      )}
      {rejected && rejectedHint && (
        <p role="status" className="mt-1 px-4 text-xs text-haze">
          {rejectedHint}
        </p>
      )}
    </div>
  );
}
