"use client";

import { useEffect, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "hairline";

/**
 * A submit button that asks for confirmation before submitting its form.
 * Use inside a <form action={serverAction}>.
 *
 * Confirmation is done inline rather than with `window.confirm()`: a native
 * dialog is blocked outright in some embedded browsers and by the "prevent this
 * page from creating additional dialogs" option, in which case it returns false
 * and the click is silently dropped — the button just looks dead. The two-step
 * inline version always works and gives visible feedback.
 */
export function ConfirmSubmit({
  children,
  message,
  variant = "outline",
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  /** Shown as the prompt while the action is armed. */
  message: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  // Disarm on its own if the confirmation is ignored.
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 6000);
    return () => clearTimeout(t);
  }, [armed]);

  if (!armed) {
    return (
      <button
        type="button"
        title={message}
        onClick={() => setArmed(true)}
        className={buttonClasses(variant, size, className)}
      >
        {children}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="sr-only">{message}</span>
      <button
        type="submit"
        autoFocus
        className={buttonClasses("danger", size, className)}
      >
        Confirm
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className={cn(
          buttonClasses("ghost", size),
          "app-dark:text-sage-dim app-dark:hover:bg-panel-2 app-dark:hover:text-bone",
        )}
      >
        Cancel
      </button>
    </span>
  );
}
