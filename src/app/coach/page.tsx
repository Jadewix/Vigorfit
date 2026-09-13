import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeading } from "@/components/dashboard-shell";
import { BookingList } from "@/components/booking-list";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { CalendarIcon, ClockIcon, UsersIcon } from "@/components/icons";
import type { Booking } from "@/lib/types";

export default async function CoachOverview() {
  const supabase = await createClient();
  const me = await getCurrentProfile();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("coach_id", me!.id)
    .order("starts_at", { ascending: true });

  const bookings = (data ?? []) as Booking[];
  const upcoming = bookings.filter(
    (b) => b.starts_at >= now && b.status !== "cancelled",
  );
  const pending = bookings.filter((b) => b.status === "pending");
  const clientCount = new Set(bookings.map((b) => b.client_id)).size;

  const ids = [...new Set(bookings.map((b) => b.client_id))];
  const { data: profs } =
    ids.length > 0
      ? await supabase.from("profiles").select("id, full_name, username").in("id", ids)
      : { data: [] };
  const nameMap = new Map<string, string>(
    (profs ?? []).map((p) => [p.id, p.full_name || p.username || "Unknown"]),
  );
  const getName = (id: string) => nameMap.get(id) ?? "Unknown";

  return (
    <>
      <PageHeading
        title={`Welcome, ${me?.full_name?.split(" ")[0] || "Coach"}`}
        subtitle="Here's what's coming up."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Upcoming sessions"
          value={upcoming.length}
          icon={<CalendarIcon />}
          href="/coach/bookings"
        />
        <StatCard
          label="Pending requests"
          value={pending.length}
          icon={<ClockIcon />}
          href="/coach/bookings"
        />
        <StatCard
          label="Clients"
          value={clientCount}
          icon={<UsersIcon />}
          href="/coach/bookings"
        />
      </div>

      <div className="mb-3 mt-10 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Next sessions
        </h2>
        <Link
          href="/coach/bookings"
          className="text-sm font-medium text-crimson hover:underline"
        >
          View all
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <EmptyState
          title="Nothing on the calendar"
          hint="When clients book you, their sessions show up here. Make sure your profile is set to accept bookings."
          icon={<CalendarIcon />}
        />
      ) : (
        <BookingList items={upcoming.slice(0, 6)} getName={getName} showClient />
      )}
    </>
  );
}
