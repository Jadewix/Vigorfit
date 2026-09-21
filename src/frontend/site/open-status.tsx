"use client";

import { useEffect, useState } from "react";
import { getOpenStatus } from "@/shared/studio";
import { cn } from "@/shared/utils";

type Status = ReturnType<typeof getOpenStatus>;

/**
 * The live "Open now until 5pm" / "Closed, opens tomorrow at 9am" readout.
 *
 * The page passes the status it rendered with, so the first paint is already
 * right and hydration matches. After that it re-checks every minute, so a tab
 * left open past closing time updates itself.
 *
 * Unlike the previous version this renders in both states rather than
 * disappearing when the studio is closed: it now sits in the hero's ledger,
 * where a row that vanishes reads as a broken layout rather than as tact.
 *
 * "Closed" is burgundy, the same accent the labels and glyphs around it wear.
 * It used to have a red of its own so that a status could not be mistaken for
 * a label — but the dot below already carries that distinction, and it carries
 * it for anyone who cannot separate the two hues at all, which a third shade
 * of red never did.
 */
export function OpenStatus({
  initial,
  className,
}: {
  initial: Status;
  className?: string;
}) {
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => setStatus(getOpenStatus()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2",
        status.open ? "text-sage-lift" : "text-brick",
        className,
      )}
    >
      {/*
        The dot is a second, non-colour signal for the same state: filled
        while open, hollow while closed, so the distinction survives for
        anyone who cannot separate the two hues.
      */}
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full border",
          status.open
            ? "border-sage bg-sage"
            : "border-brick bg-transparent",
        )}
      />
      {status.text}
    </span>
  );
}
