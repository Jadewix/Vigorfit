"use client";

import { useRef } from "react";
import { buttonClasses } from "@/frontend/ui/button";
import { resetPasswordAction } from "./actions";

/**
 * Admin resets a user's password. Prompts for the new password, then submits.
 */
export function ResetPasswordButton({
  id,
  username,
}: {
  id: string;
  username: string;
}) {
  const passwordRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form action={resetPasswordAction} ref={formRef} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="password" ref={passwordRef} />
      <button
        type="button"
        className={buttonClasses("outline", "sm")}
        onClick={() => {
          const pw = window.prompt(
            `New temporary password for "${username}" (at least 8 characters):`,
          );
          if (pw == null) return;
          if (pw.length < 8) {
            window.alert("Password must be at least 8 characters.");
            return;
          }
          if (passwordRef.current) passwordRef.current.value = pw;
          formRef.current?.requestSubmit();
          window.alert(`Password reset for "${username}".`);
        }}
      >
        Reset password
      </button>
    </form>
  );
}
