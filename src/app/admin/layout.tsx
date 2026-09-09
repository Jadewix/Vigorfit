import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { CalendarIcon, GridIcon, UsersIcon } from "@/components/icons";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["admin"]);

  const nav = [
    { href: "/admin", label: "Overview", icon: <GridIcon />, exact: true },
    { href: "/admin/users", label: "Users", icon: <UsersIcon /> },
    { href: "/admin/bookings", label: "Bookings", icon: <CalendarIcon /> },
  ];

  return (
    <DashboardShell profile={profile} navItems={nav}>
      {children}
    </DashboardShell>
  );
}
