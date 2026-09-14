import type { Viewport } from "next";
import { requireRole } from "@/backend/auth";
import { DashboardShell } from "@/frontend/components/dashboard-shell";
import { CalendarIcon, UsersIcon } from "@/frontend/components/icons";

// The client area runs on the dark brand; phone browsers that tint their
// toolbars from theme-color match it instead of showing a light bar.
export const viewport: Viewport = { themeColor: "#16281b" };

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
