"use client";

import { useEffect, useState } from "react";
import { getOpenStatus } from "@/lib/studio";

type Status = ReturnType<typeof getOpenStatus>;

/**
 * "Open now until 5pm" while the studio is open, and nothing at all while it's
 * closed, so the hero never leads with "Closed".
 *
 * The page passes the status it rendered with, so the first paint is already
 * right and hydration matches. After that it re-checks every minute, so a tab
 * left open past closing time drops the line.
 */
export function OpenStatus({
  initial,
  className,
  style,
}: {
  initial: Status;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [status, setStatus] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => setStatus(getOpenStatus()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!status.open) return null;
  return (
    <div className={className} style={style}>
      <p className="label text-crimson">{status.text}</p>
    </div>
  );
}
