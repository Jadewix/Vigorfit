import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireRole } from "@/lib/auth";
import { PageHeading } from "@/components/dashboard-shell";
import { CreateAccountPanel } from "./create-account-panel";
import { UsersManager } from "./users-manager";
import type { AdminUser } from "./user-card";
import type { Coach, Profile } from "@/lib/types";

export default async function AdminUsersPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const me = await getCurrentProfile();

  const [{ data: profileData }, { data: coachData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("coaches").select("*"),
  ]);

  const profiles = (profileData ?? []) as Profile[];
  const coachMap = new Map<string, Coach>(
    ((coachData ?? []) as Coach[]).map((c) => [c.id, c]),
  );

  const users: AdminUser[] = profiles.map((p) => {
    const c = coachMap.get(p.id);
    return {
      id: p.id,
      role: p.role,
      username: p.username,
      full_name: p.full_name,
      phone: p.phone,
      email: p.email,
      joined: new Date(p.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      coach:
        p.role === "coach" && c
          ? {
              specialty: c.specialty,
              bio: c.bio,
              active: c.active,
            }
          : null,
    };
  });

  return (
    <>
      <PageHeading
        title="Users"
        subtitle="Create and manage coach, client and admin accounts."
      />

      {/* Section 1 — create */}
      <section className="mb-8">
        <CreateAccountPanel />
      </section>

      {/* Section 2 — view & edit */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          All accounts
        </h2>
        <UsersManager users={users} meId={me?.id ?? ""} />
      </section>
    </>
  );
}
