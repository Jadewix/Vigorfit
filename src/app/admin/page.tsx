import { createClient } from "@/lib/supabase/server";
import { PageHeading } from "@/components/dashboard-shell";
import { BookingList } from "@/components/booking-list";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { CalendarIcon, ClockIcon, UsersIcon, WhistleIcon } from "@/components/icons";
import type { Booking } from "@/lib/types";

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </Card>
  );
}

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
  const ids = [
    ...new Set(recent.flatMap((b) => [b.client_id, b.coach_id])),
  ];
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
        title="Overview"
        subtitle="A snapshot of your coaching studio."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Coaches"
          value={coachesRes.count ?? 0}
          icon={<WhistleIcon />}
        />
        <StatCard
          label="Clients"
          value={clientsRes.count ?? 0}
          icon={<UsersIcon />}
        />
        <StatCard
          label="Total bookings"
          value={bookingsRes.count ?? 0}
          icon={<CalendarIcon />}
        />
        <StatCard
          label="Pending"
          value={pendingRes.count ?? 0}
          icon={<ClockIcon />}
        />
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold text-slate-900">
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
