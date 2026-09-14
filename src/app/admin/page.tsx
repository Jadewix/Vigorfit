import { createClient } from "@/backend/supabase/server";
import { loadNames } from "@/backend/profile-names";
import { PageHeading } from "@/frontend/components/dashboard-shell";
import { BookingList } from "@/frontend/components/booking-list";
import { EmptyState } from "@/frontend/components/empty-state";
import { StatCard } from "@/frontend/ui/stat-card";
import { CalendarIcon, ClockIcon, UsersIcon, WhistleIcon } from "@/frontend/components/icons";
import type { Booking } from "@/shared/types";

export default async function AdminOverview() {
  const supabase = await createClient();

  const [coachesRes, clientsRes, bookingsRes, pendingRes, recentRes] =
    await Promise.all([
      supabase.from("coaches").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client"),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("bookings")
        .select("*")
        .order("starts_at", { ascending: false })
        .limit(8),
    ]);

  const recent = (recentRes.data ?? []) as Booking[];
  const getName = await loadNames(
    supabase,
    recent.flatMap((b) => [b.client_id, b.coach_id]),
  );

  return (
    <>
      <PageHeading
        title="Overview"
        subtitle="A snapshot of your coaching studio."
      />

      {/*
        Each card links to the records behind its figure, using the same
        filters the destination pages read, so the number you tap matches the
        number of rows you land on.
      */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Coaches"
          value={coachesRes.count ?? 0}
          icon={<WhistleIcon />}
          href="/admin/users?role=coach"
        />
        <StatCard
          label="Clients"
          value={clientsRes.count ?? 0}
          icon={<UsersIcon />}
          href="/admin/users?role=client"
        />
        <StatCard
          label="Total bookings"
          value={bookingsRes.count ?? 0}
          icon={<CalendarIcon />}
          href="/admin/bookings"
        />
        <StatCard
          label="Pending"
          value={pendingRes.count ?? 0}
          icon={<ClockIcon />}
          href="/admin/bookings?status=pending"
        />
      </div>

      <h2 className="panel-title mb-3 mt-10 text-lg text-ink app-dark:text-bone">
        Recent bookings
      </h2>
      {recent.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          hint="Once clients start booking sessions, they'll show up here."
          icon={<CalendarIcon />}
        />
      ) : (
        <BookingList
          items={recent}
          getName={getName}
          showClient
          showCoach
        />
      )}
    </>
  );
}
