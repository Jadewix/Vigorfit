import { requireRole } from "@/backend/auth";
import { DashboardShell } from "@/frontend/components/dashboard-shell";
import {
  CalendarIcon,
  DumbbellIcon,
  GridIcon,
  UsersIcon,
  WeekIcon,
  WhistleIcon,
} from "@/frontend/components/icons";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["coach"]);

  /*
    Schedule sits directly under Overview, above the lists. It answers "what
    am I doing this week", which is the question a coach opens the app with;
    "My sessions" answers "what needs confirming", which is the one they come
    back to during the day. The order is that, not the order they were built.
  */
  const nav = [
    { href: "/coach", label: "Overview", icon: <GridIcon />, exact: true },
    { href: "/coach/schedule", label: "Weekly schedule", icon: <WeekIcon /> },
    { href: "/coach/bookings", label: "My sessions", icon: <CalendarIcon /> },
    { href: "/coach/classes", label: "My classes", icon: <DumbbellIcon /> },
    { href: "/coach/clients", label: "Clients", icon: <UsersIcon /> },
    { href: "/coach/profile", label: "My profile", icon: <WhistleIcon /> },
  ];

  return (
    <DashboardShell profile={profile} navItems={nav}>
      {children}
    </DashboardShell>
  );
}
