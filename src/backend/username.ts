/**
 * Usernames instead of emails.
 *
 * Supabase Auth is built around email/phone logins, so we keep using it by
 * mapping each username to a stable "synthetic" email that users never see or
 * type: `<username>@coachbook.local`. Login and account creation work purely
 * off the username; the synthetic email is just Supabase's internal identifier.
 */

export const INTERNAL_EMAIL_DOMAIN = "coachbook.local";

/** Usernames: 3–30 chars, lowercase letters, digits and underscore only. */
export const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(normalizeUsername(username));
}

/** Map a username to its internal Supabase login email. */
export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_EMAIL_DOMAIN}`;
}
