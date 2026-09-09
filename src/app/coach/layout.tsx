import { requireRole } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { CalendarIcon, GridIcon, WhistleIcon } from "@/components/icons";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["coach"]);

  const nav = [
    { href: "/coach", label: "Overview", icon: <GridIcon />, exact: true },
    { href: "/coach/bookings", label: "My sessions", icon: <CalendarIcon /> },
    { href: "/coach/profile", label: "My profile", icon: <WhistleIcon /> },
  ];

  return (
    <DashboardShell profile={profile} navItems={nav}>
      {children}
    </DashboardShell>
  );
}
