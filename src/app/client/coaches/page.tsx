import Link from "next/link";
import { createClient } from "@/backend/supabase/server";
import { PageHeading } from "@/frontend/components/dashboard-shell";
import { EmptyState } from "@/frontend/components/empty-state";
import { buttonClasses } from "@/frontend/ui/button";
import { UsersIcon } from "@/frontend/components/icons";
import { CoachAvatar } from "@/frontend/components/coach-avatar";
import type { Coach, Profile } from "@/shared/types";

export default async function BrowseCoachesPage() {
  const supabase = await createClient();

  const { data: coachesData } = await supabase
    .from("coaches")
    .select("*")
    .eq("active", true);

  const coaches = (coachesData ?? []) as Coach[];
  const ids = coaches.map((c) => c.id);
  const { data: profs } =
    ids.length > 0
      ? await supabase.from("profiles").select("*").in("id", ids)
      : { data: [] };
  const profileMap = new Map<string, Profile>(
    (profs ?? []).map((p) => [p.id, p as Profile]),
  );

  return (
    <>
      <PageHeading
        title="Find a coach"
        subtitle="Choose a coach and book your next session."
      />

      {coaches.length === 0 ? (
        <EmptyState
          title="No coaches available yet"
          hint="Check back soon — your studio is setting up its coaches."
          icon={<UsersIcon />}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c) => {
            const p = profileMap.get(c.id);
            const name = p?.full_name || "Coach";

            return (
              <div
                key={c.id}
                className="flex h-full flex-col border border-line bg-ground/50 p-6 transition-colors hover:border-sage"
              >
                <div className="flex items-center gap-3.5">
                  <CoachAvatar
                    name={name}
                    photoUrl={c.avatar_url}
                    className="h-12 w-12 text-lg"
                  />
                  <div className="min-w-0">
                    <p className="display text-xl text-bone">{name}</p>
                    {c.specialty && (
                      <p className="tag mt-1 text-sage">{c.specialty}</p>
                    )}
                  </div>
                </div>

                {c.bio && (
                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-sage-dim">
                    {c.bio}
                  </p>
                )}

                <div className="mt-auto border-t border-rule pt-5">
                  <Link
                    href={`/client/book/${c.id}`}
                    className={buttonClasses(
                      "primary",
                      "sm",
                      "tag w-full px-4",
                    )}
                  >
                    Book a session
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
