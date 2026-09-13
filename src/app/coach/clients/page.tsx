import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { formatInAppTimezone } from "@/lib/utils";
import { PageHeading } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/empty-state";
import { CoachAvatar } from "@/components/coach-avatar";
import { UsersIcon } from "@/components/icons";
import type { Booking, Profile } from "@/lib/types";

/**
 * The coach's client roster.
 *
 * This page exists because the Overview's "Clients" figure had nowhere to go:
 * it counts the distinct people who have booked this coach, and that list was
 * not viewable anywhere. Derived from bookings rather than stored separately,
 * so the count on the dashboard card and the rows here are the same number by
 * construction.
 */
export default async function CoachClientsPage() {
  const supabase = await createClient();
  const me = await getCurrentProfile();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("coach_id", me!.id)
    .order("starts_at", { ascending: true });

  const bookings = (data ?? []) as Booking[];
  const ids = [...new Set(bookings.map((b) => b.client_id))];

  const { data: profs } =
    ids.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, username, phone")
          .in("id", ids)
      : { data: [] };

  const profileMap = new Map<string, Partial<Profile>>(
    (profs ?? []).map((p) => [p.id, p as Partial<Profile>]),
  );

  // One entry per client, with the figures a coach actually wants at a glance:
  // how many sessions they've had, and when they're next in.
  const clients = ids
    .map((id) => {
      const theirs = bookings.filter((b) => b.client_id === id);
      const active = theirs.filter((b) => b.status !== "cancelled");
      const next = active.find((b) => b.starts_at >= now);
      const past = active.filter((b) => b.starts_at < now);
      const p = profileMap.get(id);

      return {
        id,
        name: p?.full_name || p?.username || "Unknown",
        phone: p?.phone ?? null,
        sessions: active.length,
        completed: past.length,
        next: next?.starts_at ?? null,
      };
    })
    // Clients with an upcoming session first, then by who trains most.
    .sort((a, b) => {
      if (a.next && b.next) return a.next.localeCompare(b.next);
      if (a.next) return -1;
      if (b.next) return 1;
      return b.sessions - a.sessions;
    });

  return (
    <>
      <PageHeading
        title="Clients"
        subtitle="Everyone who has booked a session with you."
      />

      {clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          hint="Once someone books a session with you, they'll appear here with their session history."
          icon={<UsersIcon />}
        />
      ) : (
        <ul className="space-y-3">
          {clients.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-line-light bg-paper-panel p-4 app-dark:rounded-none app-dark:border-line app-dark:bg-panel/50"
            >
              <CoachAvatar name={c.name} className="h-11 w-11 text-sm" />

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink app-dark:text-bone">
                  {c.name}
                </p>
                {c.phone && (
                  <p className="truncate text-sm tabular-nums text-ink-muted app-dark:text-sage-dim">
                    {c.phone}
                  </p>
                )}
              </div>

              {/* The figures, in the ledger's key-over-value form. */}
              <dl className="flex shrink-0 gap-6 text-sm">
                <div>
                  <dt className="tag text-ink-muted app-dark:text-sage-dim">
                    Sessions
                  </dt>
                  <dd className="mt-0.5 tabular-nums text-ink app-dark:text-bone">
                    {c.sessions}
                  </dd>
                </div>
                <div>
                  <dt className="tag text-ink-muted app-dark:text-sage-dim">
                    Next
                  </dt>
                  <dd className="mt-0.5 tabular-nums text-ink app-dark:text-bone">
                    {c.next
                      ? formatInAppTimezone(c.next, {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </dd>
                </div>
              </dl>

              <Link
                href="/coach/bookings"
                className="tag shrink-0 text-forest transition-colors hover:text-ink app-dark:text-sage app-dark:hover:text-bone"
              >
                Sessions
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
