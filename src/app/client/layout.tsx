import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { CalendarIcon, UsersIcon } from "@/components/icons";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["client"]);

  const nav = [
    { href: "/client/coaches", label: "Find a coach", icon: <UsersIcon /> },
    { href: "/client/bookings", label: "My bookings", icon: <CalendarIcon /> },
  ];

  return (
    <DashboardShell profile={profile} navItems={nav} className="app-dark">
      {children}
    </DashboardShell>
  );
}
