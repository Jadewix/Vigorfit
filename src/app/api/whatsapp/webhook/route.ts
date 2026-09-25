import { NextResponse, type NextRequest } from "next/server";
import { autoReply, wantsAutoReply } from "@/backend/whatsapp-autoreply";
import { whatsAppPhoneId } from "@/backend/whatsapp";

export const dynamic = "force-dynamic";

/**
 * Meta's WhatsApp webhook: delivery reports, and the auto-reply.
 *
 * Meta answers a send with "accepted" and reports what really happened
 * (sent, delivered, read, or failed with an error code) here, later. Without
 * this a failed message is invisible: the app has no other way to learn that
 * a client's number is wrong or that the account is blocked.
 *
 * The number is send-only by the studio's choice, so incoming messages get
 * one line pointing to the studio's chat number (backend/whatsapp-autoreply)
 * and are otherwise dropped. Nothing is stored; reports go to the Worker log
 * (`npx wrangler tail`), with the recipient masked to its last 3 digits.
 *
 * Set up in the Meta app: WhatsApp → Configuration → Webhook, callback
 * https://vigorfit.me/api/whatsapp/webhook, verify token =
 * WHATSAPP_WEBHOOK_VERIFY_TOKEN, and subscribe to the "messages" field.
 */

/** Meta's one-time handshake when the callback URL is saved. */
export function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (
    expected &&
    params.get("hub.mode") === "subscribe" &&
    params.get("hub.verify_token") === expected
  ) {
    return new NextResponse(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

type StatusError = { code?: number; title?: string; error_data?: { details?: string } };
type Status = {
  id?: string;
  status?: string;
  recipient_id?: string;
  errors?: StatusError[];
};

type Incoming = { from?: string; type?: string };

const mask =(n?: string) => (n ? `…${n.slice(-3)}` : "?");

export async function POST(req: NextRequest) {
  // Always 200: Meta retries anything else for days, and a malformed report
  // is not worth that.
  try {
    const body = await req.json();
    for (const entry of body?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        const value = change?.value ?? {};
        for (const s of (value.statuses ?? []) as Status[]) {
          const errors = (s.errors ?? [])
            .map((e) => `${e.code} ${e.title}${e.error_data?.details ? ` — ${e.error_data.details}` : ""}`)
            .join("; ");
          const line = `[whatsapp] ${s.status} to ${mask(s.recipient_id)} (${s.id ?? "no id"})${errors ? `: ${errors}` : ""}`;
          if (s.status === "failed") console.error(line);
          else console.log(line);
        }
        // Another number in the same WhatsApp account isn't ours to answer.
        const ourNumber = whatsAppPhoneId();
        if (ourNumber && value.metadata?.phone_number_id !== ourNumber) continue;
        for (const m of (value.messages ?? []) as Incoming[]) {
          if (wantsAutoReply(m.type)) await autoReply(m.from);
        }
      }
    }
  } catch (e) {
    console.error("[whatsapp] unreadable webhook body", e);
  }
  return NextResponse.json({ ok: true });
}
