import { requireRole } from "@/backend/auth";
import { DashboardShell } from "@/frontend/components/dashboard-shell";
import {
  CalendarIcon,
  GridIcon,
  MessageIcon,
  UsersIcon,
} from "@/frontend/components/icons";

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
    { href: "/admin/feedback", label: "Feedback", icon: <MessageIcon /> },
  ];

  return (
    <DashboardShell profile={profile} navItems={nav}>
      {children}
    </DashboardShell>
  );
}
