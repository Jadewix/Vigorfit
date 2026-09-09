"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveals its children once, when scrolled into view. Used sparingly to draw
 * the eye down the page — not on every element. Respects reduced motion via
 * the `.reveal` CSS (which no-ops the animation under that setting).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement | null>(null);
  // "idle" renders with no attribute, so server HTML stays visible without JS.
  const [state, setState] = useState<"idle" | "hidden" | "shown">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setState("shown");
      return;
    }

    // Anything already on screen when we mount is shown outright — hiding it
    // first would flash. Only off-screen content gets the entrance.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      setState("shown");
      return;
    }
    setState("hidden");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("shown");
            io.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-shown={state === "idle" ? undefined : String(state === "shown")}
      className={cn("reveal", className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
