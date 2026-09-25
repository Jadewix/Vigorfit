import { createClient } from "@/backend/supabase/server";
import { loadNames } from "@/backend/profile-names";
import { PageHeading } from "@/frontend/components/dashboard-shell";
import { EmptyState } from "@/frontend/components/empty-state";
import { ConfirmSubmit } from "@/frontend/components/confirm-button";
import { ClassMark } from "@/frontend/components/class-mark";
import { WeekIcon } from "@/frontend/components/icons";
import { PHOTO_HINT } from "@/frontend/components/square-photo";
import { Card, CardBody, CardHeader, CardTitle } from "@/frontend/ui/card";
import {
  classIconOf,
  isOver,
  timeRangeLabel,
  whenLabel,
  type StudioClass,
} from "@/shared/classes";
import { zonedToday } from "@/shared/timezone";
import type { Profile } from "@/shared/types";
import { deleteClassAction } from "./actions";
import { ClassForm } from "./class-form";
import { ClassPhotoControl } from "./class-photo";

/**
 * The class timetable, as the admin and the coaches see it. One component for
 * both, so either can add a class when the other can't: the admin schedules
 * any coach, a coach schedules (and sees) only their own. The coach's slots
 * close for everyone while a class runs.
 */
export async function ClassesPanel({ viewer }: { viewer: Profile }) {
  const isAdmin = viewer.role === "admin";
  const supabase = await createClient();
  const today = zonedToday();

  let classesQuery = supabase
    .from("classes")
    .select("*")
    .order("class_date", { ascending: true })
    .order("start_time", { ascending: true });
  if (!isAdmin) classesQuery = classesQuery.eq("coach_id", viewer.id);

  const [classesRes, coachesRes, photoProbe] = await Promise.all([
    classesQuery,
    isAdmin
      ? supabase.from("coaches").select("id").eq("active", true)
      : Promise.resolve({ data: [] as { id: string }[] }),
    // Whether class-photos.sql has run. Naming a column that isn't there is
    // an error, where the `*` above would quietly leave it out.
    supabase.from("classes").select("photo_url").limit(1),
  ]);

  // PGRST205: PostgREST has no such table, i.e. classes.sql has not run.
  const notSetUp =
    classesRes.error?.code === "PGRST205" || classesRes.error?.code === "42P01";
  if (classesRes.error && !notSetUp) throw classesRes.error;
  const photosReady = !photoProbe.error;

  const classes = (classesRes.data ?? []) as StudioClass[];
  const coachIds = (coachesRes.data ?? []).map((c) => c.id as string);
  const getName = await loadNames(supabase, [
    ...coachIds,
    ...classes.map((c) => c.coach_id),
  ]);
  const coaches = coachIds
    .map((id) => ({ id, name: getName(id) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // A one-off class whose day has gone no longer blocks anything.
  const current = classes.filter((c) => !isOver(c, today));
  const past = classes.filter((c) => isOver(c, today));

  return (
    <>
      <PageHeading
        title={isAdmin ? "Classes" : "My classes"}
        subtitle={
          isAdmin
            ? "Schedule classes for your coaches. Their booking slots close while a class runs."
            : "Schedule the classes you run. Your booking slots close while a class runs."
        }
      />

      {notSetUp ? (
        <p className="rounded-lg bg-oxblood/10 px-4 py-3 text-sm text-oxblood">
          Classes aren&rsquo;t switched on yet.{" "}
          {isAdmin ? (
            <>
              Run <code className="font-semibold">supabase/classes.sql</code>{" "}
              in the Supabase SQL editor, then reload this page.
            </>
          ) : (
            "Ask the studio to switch them on."
          )}
        </p>
      ) : (
        <>
          {!photosReady && (
            <p className="mb-6 rounded-lg bg-oxblood/10 px-4 py-3 text-sm text-oxblood">
              Class photos aren&rsquo;t switched on yet, so every class shows an
              icon instead.{" "}
              {isAdmin ? (
                <>
                  Run{" "}
                  <code className="font-semibold">supabase/class-photos.sql</code>{" "}
                  in the Supabase SQL editor, then reload this page.
                </>
              ) : (
                "Ask the studio to switch them on."
              )}
            </p>
          )}

          <Card className="mb-10">
            <CardHeader>
              <CardTitle>Add a class</CardTitle>
            </CardHeader>
            <CardBody>
              <ClassForm
                coaches={isAdmin ? coaches : undefined}
                today={today}
                uploaderId={viewer.id}
                photosReady={photosReady}
              />
            </CardBody>
          </Card>

          <h2 className="panel-title mb-1 text-lg text-ink">Timetable</h2>
          <p className="mb-3 text-xs text-ink-muted">
            {photosReady
              ? `Each class shows its photo on the home page. ${PHOTO_HINT}`
              : "Each class shows on the home page."}
          </p>
          {current.length === 0 ? (
            <EmptyState
              title="No classes yet"
              hint="Classes you add above show up here and on the home page."
              icon={<WeekIcon />}
            />
          ) : (
            <ClassList
              items={current}
              getName={isAdmin ? getName : null}
              photoUploaderId={photosReady ? viewer.id : null}
            />
          )}

          {past.length > 0 && (
            <>
              <h2 className="panel-title mb-3 mt-10 text-lg text-ink-muted">
                Past
              </h2>
              <ClassList
                items={past}
                getName={isAdmin ? getName : null}
                muted
              />
            </>
          )}
        </>
      )}
    </>
  );
}

function ClassList({
  items,
  getName,
  photoUploaderId = null,
  muted,
}: {
  items: StudioClass[];
  /** Null on a coach's own list, where every class is theirs. */
  getName: ((id: string) => string) | null;
  /** Who uploads if a photo is changed; null offers no photo controls,
   *  as on past classes or before class-photos.sql has run. */
  photoUploaderId?: string | null;
  muted?: boolean;
}) {
  return (
    <ul className="space-y-4">
      {items.map((c) => (
        <li key={c.id}>
          <Card className={muted ? "opacity-70" : undefined}>
            <CardBody>
              <div className="flex gap-4">
                <ClassMark
                  icon={classIconOf(c)}
                  photoUrl={c.photo_url}
                  className="h-11 w-11 rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-base font-semibold text-ink">{c.name}</p>
                    {getName && (
                      <p className="text-sm text-ink-muted">
                        with {getName(c.coach_id)}
                      </p>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-ink">
                    {whenLabel(c)} · {timeRangeLabel(c)}
                  </p>
                </div>
              </div>
              {c.description && (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-muted">
                  {c.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {photoUploaderId && (
                  <ClassPhotoControl
                    classId={c.id}
                    uploaderId={photoUploaderId}
                    photoUrl={c.photo_url ?? null}
                  />
                )}
                <form action={deleteClassAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmSubmit
                    variant="ghost"
                    message="Delete this class? Its hours open up for booking again."
                  >
                    Delete
                  </ConfirmSubmit>
                </form>
              </div>
            </CardBody>
          </Card>
        </li>
      ))}
    </ul>
  );
}
