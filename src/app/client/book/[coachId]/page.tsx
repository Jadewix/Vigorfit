import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeading } from "@/components/dashboard-shell";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { BookForm } from "./book-form";
import { STUDIO_HOURS_DISPLAY } from "@/lib/booking";
import { zonedToday } from "@/lib/timezone";
import { type Coach, type Profile } from "@/lib/types";

export default async function BookCoachPage({
  params,
}: {
  params: Promise<{ coachId: string }>;
}) {
  const { coachId } = await params;
  const supabase = await createClient();

  const { data: coachData } = await supabase
    .from("coaches")
    .select("*")
    .eq("id", coachId)
    .single();

  if (!coachData) notFound();
  const coach = coachData as Coach;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", coachId)
    .single();

  const p = profile as Profile | null;
  const name = p?.full_name || "Coach";

  return (
    <>
      <PageHeading
        title={`Book ${name}`}
        subtitle={coach.specialty || "Request a session below."}
        action={
          <Link
            href="/client/coaches"
            className="label text-mist transition-colors hover:text-crimson"
          >
            ← Back to coaches
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* min-w-0: a grid item defaults to min-width:auto, so without this a
            wide child (the calendar) stretches the whole track past the page. */}
        <div className="min-w-0 space-y-6">
          {coach.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About {name.split(" ")[0]}</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-sm leading-relaxed text-mist">{coach.bio}</p>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Opening hours</CardTitle>
            </CardHeader>
            <CardBody>
              <ul className="divide-y divide-line text-sm">
                {STUDIO_HOURS_DISPLAY.map((row) => (
                  <li
                    key={row.days}
                    className="flex justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="label text-mist">{row.days}</span>
                    <span className="text-bone">{row.hours}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Request a session</CardTitle>
          </CardHeader>
          <CardBody>
            <BookForm coachId={coachId} today={zonedToday()} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
