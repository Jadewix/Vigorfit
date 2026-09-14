import { createClient } from "@/backend/supabase/server";
import { getCurrentProfile } from "@/backend/auth";
import { PageHeading } from "@/frontend/components/dashboard-shell";
import { Card, CardBody, CardHeader, CardTitle } from "@/frontend/ui/card";
import { CoachProfileForm } from "./coach-profile-form";
import { CoachPhotoForm } from "./coach-photo-form";
import { PLANS, SESSION_LABEL } from "@/shared/booking";
import { STUDIO_HOURS_DISPLAY } from "@/shared/studio";
import type { Coach } from "@/shared/types";

export default async function CoachProfilePage() {
  const supabase = await createClient();
  const me = await getCurrentProfile();

  const { data: coach } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", me!.id)
    .single();

  return (
    <>
      <PageHeading
        title="My profile"
        subtitle="This is what clients see when they browse coaches."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your coach profile</CardTitle>
          </CardHeader>
          <CardBody>
            <CoachPhotoForm
              coachId={me!.id}
              name={me!.full_name || "Coach"}
              photoUrl={(coach as Coach | null)?.avatar_url ?? null}
            />
            <div className="my-5 border-t border-line-light" />
            <CoachProfileForm coach={(coach as Coach) ?? null} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Studio hours</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-1.5 text-sm text-ink">
              {STUDIO_HOURS_DISPLAY.map((row) => (
                <li key={row.days} className="flex justify-between gap-4">
                  <span className="font-medium text-ink">{row.days}</span>
                  <span>{row.hours}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-muted">
              Clients book hourly slots within these hours. Each session is{" "}
              {SESSION_LABEL}. A semi-private slot seats{" "}
              {PLANS.semi_private.capacity}; a class seats{" "}
              {PLANS.classes.capacity}.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
