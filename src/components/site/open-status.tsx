"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getOpenStatus } from "@/lib/studio";

/**
 * Live "Open now until 5pm" / "Closed, opens Monday at 9am" line.
 *
 * Worked out in the browser only: a server-rendered time would go stale in a
 * cached copy of the page and wouldn't match the client at hydration. So the
 * first render is a blank placeholder that holds the line's height, and the
 * status fills in after mount, re-checked every minute.
 */
export function OpenStatus({ className }: { className?: string }) {
  const [status, setStatus] = useState<ReturnType<
    typeof getOpenStatus
  > | null>(null);

  useEffect(() => {
    const update = () => setStatus(getOpenStatus());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <p className={cn(status?.open ? "text-crimson" : "text-mist", className)}>
      {status ? status.text : <>&nbsp;</>}
    </p>
  );
}
