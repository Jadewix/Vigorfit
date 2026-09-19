import { requireRole } from "@/backend/auth";
import { createClient } from "@/backend/supabase/server";
import { PageHeading } from "@/frontend/components/dashboard-shell";
import { EmptyState } from "@/frontend/components/empty-state";
import { ConfirmSubmit } from "@/frontend/components/confirm-button";
import { MessageIcon } from "@/frontend/components/icons";
import { Card, CardBody } from "@/frontend/ui/card";
import { formatInAppTimezone } from "@/shared/utils";
import { deleteFeedbackAction } from "./actions";

type Feedback = {
  id: string;
  name: string | null;
  message: string;
  created_at: string;
};

/**
 * The "Feedback & Thoughts" inbox. Only admin accounts reach this page, and
 * only admin accounts can read the table behind it — coaches never see what
 * members write here.
 */
export default async function AdminFeedbackPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feedback")
    .select("id, name, message, created_at")
    .order("created_at", { ascending: false });
  // PGRST205: PostgREST has no such table, i.e. feedback.sql has not run.
  const notSetUp = error?.code === "PGRST205" || error?.code === "42P01";
  if (error && !notSetUp) throw error;

  const items = (data ?? []) as Feedback[];

  return (
    <>
      <PageHeading
        title="Feedback"
        subtitle="Messages from the Feedback & Thoughts box on the landing page. Only admins can see them."
      />

      {notSetUp ? (
        <p className="rounded-lg bg-oxblood/10 px-4 py-3 text-sm text-oxblood">
          The feedback box isn&rsquo;t switched on yet. Run{" "}
          <code className="font-semibold">
            supabase/feedback.sql
          </code>{" "}
          in the Supabase SQL editor, then reload this page.
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing yet"
          hint="When someone sends feedback from the landing page, it lands here."
          icon={<MessageIcon />}
        />
      ) : (
        <ul className="space-y-4">
          {items.map((f) => (
            <li key={f.id}>
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-sm font-semibold text-ink">
                      {f.name || (
                        <span className="font-normal italic text-ink-muted">
                          No name given
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {formatInAppTimezone(f.created_at, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                    {f.message}
                  </p>
                  <form action={deleteFeedbackAction} className="mt-4">
                    <input type="hidden" name="id" value={f.id} />
                    <ConfirmSubmit
                      variant="ghost"
                      message="Delete this message permanently?"
                    >
                      Delete
                    </ConfirmSubmit>
                  </form>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
