import Link from "next/link";
import { createClient } from "@/backend/supabase/server";
import { getCurrentProfile } from "@/backend/auth";
import { getSubscription } from "@/backend/subscription";
import { PageHeading } from "@/frontend/components/dashboard-shell";
import { EmptyState } from "@/frontend/components/empty-state";
import { ClassMark } from "@/frontend/components/class-mark";
import { JoinButton } from "@/frontend/components/join-button";
import { DumbbellIcon } from "@/frontend/components/icons";
import {
  classIconOf,
  comingMessage,
  dateLabel,
  enrollMessage,
  timeRangeLabel,
  upcomingOccurrences,
  type StudioClass,
} from "@/shared/classes";
import { waLink } from "@/shared/studio";
import { utcToZonedTime } from "@/shared/timezone";

/**
 * Upcoming classes for the next two weeks. Nothing is booked here: a Classes
 * member taps "I'm coming" and tells the studio on WhatsApp. Anyone on
 * another plan sees the same list, and the button asks them to enroll.
 */
export default async function ClientClassesPage() {
  const me = await getCurrentProfile();
  const supabase = await createClient();
  const now = utcToZonedTime(new Date());

  const [sub, { data, error }] = await Promise.all([
    getSubscription(me!.id),
    supabase.from("classes").select("*"),
  ]);

  const member = sub.plan === "classes";
  const canJoin = member && !sub.expired;
  const who = me!.full_name || me!.username || "a member";
  const occurrences = error
    ? []
    : upcomingOccurrences((data ?? []) as StudioClass[], now.date, now.time);

  return (
    <>
      <PageHeading
        title="Classes"
        subtitle={
          canJoin
            ? "Tap “I’m coming” and let the studio know you’ll be there."
            : "Group classes over the next two weeks. They’re part of the Classes subscription."
        }
        action={
          <Link
            href="/"
            className="tag text-sage-lift transition-colors hover:text-bone"
          >
            ← Back home
          </Link>
        }
      />

      {occurrences.length === 0 ? (
        <EmptyState
          title="No classes coming up"
          hint="The studio hasn’t scheduled any classes for the next two weeks. Check back soon."
          icon={<DumbbellIcon />}
        />
      ) : (
        <ul className="space-y-3">
          {occurrences.map((o) => (
            <li
              key={`${o.cls.id}-${o.date}`}
              className="flex flex-col gap-4 border border-line bg-ground/50 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 gap-4">
                <ClassMark
                  icon={classIconOf(o.cls)}
                  photoUrl={o.cls.photo_url}
                  className="h-12 w-12"
                />
                <div className="min-w-0">
                  <p className="tag text-sage-lift">{dateLabel(o.date)}</p>
                  <p className="display mt-1 text-xl text-bone">{o.cls.name}</p>
                  <p className="mt-1 text-sm tabular-nums text-bone">
                    {timeRangeLabel(o.cls)}
                  </p>
                  {o.cls.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-sage-dim">
                      {o.cls.description}
                    </p>
                  )}
                </div>
              </div>
              <JoinButton
                className="shrink-0 sm:w-40"
                comingHref={canJoin ? waLink(comingMessage(who, o)) : null}
                enrollHref={waLink(enrollMessage(who, o.cls, member))}
                renew={member}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
