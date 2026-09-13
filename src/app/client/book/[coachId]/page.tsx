import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeading } from "@/components/dashboard-shell";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { CoachAvatar } from "@/components/coach-avatar";
import { BookForm } from "./book-form";
import { PLANS, STUDIO_HOURS_DISPLAY, TRACKS } from "@/lib/booking";
import { getCurrentProfile } from "@/lib/auth";
import {
  getAllowance,
  getSubscription,
  hasFreeSessionAvailable,
} from "@/lib/subscription";
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

  // The viewer's subscription decides which days the calendar offers and
  // how many people share a slot. Without one they can't book at all.
  // Only clients reach /client/*, so the profile is always there.
  const me = await getCurrentProfile();
  const sub = await getSubscription(me!.id);
  // No subscription still buys one free first session.
  const isTrial = sub.configured && !sub.plan;
  const freeSession = isTrial ? await hasFreeSessionAvailable(me!.id) : false;
  const needsPlan = isTrial && !freeSession;
  // Only worth counting when they can actually book.
  const allowance =
    sub.plan && !sub.expired
      ? await getAllowance(me!.id, sub.endsOn)
      : null;

  return (
    <>
      <PageHeading
        title={`Book ${name}`}
        subtitle={coach.specialty || "Request a session below."}
        action={
          <Link
            href="/client/coaches"
            className="tag text-sage-dim transition-colors hover:text-sage"
          >
            ← Back to coaches
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* min-w-0: a grid item defaults to min-width:auto, so without this a
            wide child (the calendar) stretches the whole track past the page. */}
        <div className="min-w-0 space-y-6">
          {(coach.bio || coach.avatar_url) && (
            <Card>
              <CardHeader>
                <CardTitle>About {name.split(" ")[0]}</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex items-start gap-4">
                  {coach.avatar_url && (
                    <CoachAvatar
                      name={name}
                      photoUrl={coach.avatar_url}
                      className="h-20 w-20"
                    />
                  )}
                  {coach.bio && (
                    <p className="text-sm leading-relaxed text-sage-dim">
                      {coach.bio}
                    </p>
                  )}
                </div>
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
                    <span className="tag text-sage-dim">{row.days}</span>
                    <span className="text-bone">{row.hours}</span>
                  </li>
                ))}
              </ul>
              {sub.plan && (
                <p className="mt-3 border-t border-line pt-3 text-xs text-sage-dim">
                  Your plan: {PLANS[sub.plan].label}
                  {sub.track ? ` · ${TRACKS[sub.track].short}` : ""}
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Request a session</CardTitle>
          </CardHeader>
          <CardBody>
            {needsPlan ? (
              <div className="border border-oxblood/70 bg-panel-red px-4 py-4 text-sm text-red-lift">
                <p className="font-medium">
                  No subscription on your account yet.
                </p>
                <p className="mt-1 text-red-lift/80">
                  The studio adds your plan when you sign up at the gym. Once
                  it&rsquo;s set, your days and times appear here.
                </p>
              </div>
            ) : sub.expired ? (
              <div className="border border-oxblood/70 bg-panel-red px-4 py-4 text-sm text-red-lift">
                <p className="font-medium">Your subscription has ended.</p>
                <p className="mt-1 text-red-lift/80">
                  It ran out on {sub.endsOn}. Ask the studio to renew it and
                  your calendar comes straight back.
                </p>
              </div>
            ) : (
              <>
                {freeSession && (
                  <div className="mb-4 border border-sage/50 bg-panel-green px-4 py-3 text-sm text-bone">
                    <span className="font-medium">
                      Your first session is free.
                    </span>{" "}
                    <span className="text-sage-dim">
                      Pick any open day. After it, the studio sets up your
                      subscription.
                    </span>
                  </div>
                )}
                {sub.expiringSoon && (
                  <div className="mb-4 border border-oxblood/70 bg-panel-red px-4 py-3 text-sm text-red-lift">
                    <span className="font-medium">
                      {sub.daysLeft === 0
                        ? "Your subscription ends today."
                        : `Your subscription ends in ${sub.daysLeft} day${
                            sub.daysLeft === 1 ? "" : "s"
                          }.`}
                    </span>{" "}
                    <span className="text-red-lift/80">
                      Renew with the studio to keep booking after {sub.endsOn}.
                    </span>
                  </div>
                )}
                {allowance && (
                  <p className="mb-4 text-xs text-sage-dim">
                    {allowance.monthLimit - allowance.monthUsed} of{" "}
                    {allowance.monthLimit} sessions left this month ·{" "}
                    {allowance.weekLimit - allowance.weekUsed} of{" "}
                    {allowance.weekLimit} left this week.
                  </p>
                )}
                <BookForm
                  coachId={coachId}
                  today={zonedToday()}
                  plan={sub.plan}
                  track={sub.track}
                />
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
