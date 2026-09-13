import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireRole } from "@/lib/auth";
import { formatInAppTimezone } from "@/lib/utils";
import { PageHeading } from "@/components/dashboard-shell";
import { CreateAccountPanel } from "./create-account-panel";
import { UsersManager } from "./users-manager";
import type { AdminUser } from "./user-card";
import type { Coach, Profile, Role } from "@/lib/types";

/**
 * `?role=coach` seeds the roster's filter so the Overview stat cards can point
 * straight at the accounts they counted. Anything unrecognised falls back to
 * "all", since this value comes from a URL a person can type.
 */
function parseRole(value: string | string[] | undefined): Role | "all" {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "admin" || v === "coach" || v === "client" ? v : "all";
}

export default async function AdminUsersPage(
  props: PageProps<"/admin/users">,
) {
  await requireRole(["admin"]);
  const supabase = await createClient();
  const me = await getCurrentProfile();

  // `searchParams` is a promise in this version of Next; it must be awaited.
  const initialFilter = parseRole((await props.searchParams).role);

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
      joined: formatInAppTimezone(p.created_at, {
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
        <h2 className="tag mb-3 text-ink-muted">
          All accounts
        </h2>
        <UsersManager
          users={users}
          meId={me?.id ?? ""}
          initialFilter={initialFilter}
        />
      </section>
    </>
  );
}
