"use server";

import { createAdminClient } from "@/backend/supabase/admin";
import { FEEDBACK_MESSAGE_MAX, FEEDBACK_NAME_MAX } from "@/shared/feedback";

export type FeedbackState = { error?: string; sent?: boolean };

const NOT_SENT =
  "That didn’t go through. Please try again, or message us on WhatsApp.";

/**
 * The landing page's "Feedback & Thoughts" box.
 *
 * Anyone can send one, signed in or not, and nothing about the sender is
 * recorded beyond the name they choose to type. The row is written with the
 * service role because the table deliberately has no insert policy: the
 * public API offers no way in, so this action — with its honeypot and its
 * limits — is the only door.
 */
export async function sendFeedbackAction(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  // A field people never see. Anything that fills it in is a bot; tell it
  // the message went, so it has no reason to try again.
  if (String(formData.get("website") ?? "") !== "") return { sent: true };

  const message = String(formData.get("message") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (message.length < 2) return { error: "Write a few words first." };
  if (message.length > FEEDBACK_MESSAGE_MAX) {
    return {
      error: `Please keep it under ${FEEDBACK_MESSAGE_MAX} characters.`,
    };
  }
  if (name.length > FEEDBACK_NAME_MAX) {
    return { error: `Please keep the name under ${FEEDBACK_NAME_MAX} characters.` };
  }

  try {
    const { error } = await createAdminClient()
      .from("feedback")
      .insert({ message, name: name || null });
    if (error) throw error;
  } catch (e) {
    console.error("[feedback]", e);
    return { error: NOT_SENT };
  }
  return { sent: true };
}
