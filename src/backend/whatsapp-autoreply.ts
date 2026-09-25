/**
 * Answers people who write to the send-only notice number.
 *
 * Nobody reads that number, so a client who replies "can I move to 7pm?"
 * would otherwise hear nothing, and people who feel ignored block, which
 * lowers the number's quality rating with Meta. Instead they get one line
 * pointing them at the studio's chat number.
 *
 * Once per person per day: a burst of messages gets a single answer. The
 * answer is plain text inside the 24h window their message opened, which
 * Meta doesn't charge for.
 */
import { sendWhatsAppText, toWaNumber } from "@/backend/whatsapp";
import { STUDIO_WHATSAPP, STUDIO_WHATSAPP_DISPLAY } from "@/shared/studio";

const DAY_SECONDS = 24 * 60 * 60;

export const AUTO_REPLY_TEXT =
  `Hi, this number only sends Vigorfit booking notices, so replies here aren't read. ` +
  `To reach the studio, message us on WhatsApp at ${STUDIO_WHATSAPP_DISPLAY}: ` +
  `https://wa.me/${STUDIO_WHATSAPP}`;

/** Message types that aren't someone talking to us. */
const IGNORED_TYPES = new Set(["reaction", "system", "unsupported"]);

export function wantsAutoReply(type: string | undefined): boolean {
  return !IGNORED_TYPES.has(type ?? "");
}

/*
 * "Already answered today" lives in the Worker's edge cache: no table to
 * create, and it expires by itself. It's per data centre and best effort,
 * so at worst someone gets the line twice. The in-memory map covers local
 * dev, where there is no edge cache, and repeats within one isolate.
 */
const answeredAt = new Map<string, number>();

function edgeCache(): Cache | null {
  const store = (globalThis as { caches?: { default?: Cache } }).caches;
  return store?.default ?? null;
}

const cacheKey = (from: string) =>
  new Request(`https://vigorfit.me/__whatsapp-autoreply/${from}`);

async function answeredRecently(from: string): Promise<boolean> {
  const at = answeredAt.get(from);
  if (at && Date.now() - at < DAY_SECONDS * 1000) return true;
  try {
    return Boolean(await edgeCache()?.match(cacheKey(from)));
  } catch {
    return false;
  }
}

async function markAnswered(from: string): Promise<void> {
  answeredAt.set(from, Date.now());
  try {
    await edgeCache()?.put(
      cacheKey(from),
      new Response("1", {
        headers: { "Cache-Control": `max-age=${DAY_SECONDS}` },
      }),
    );
  } catch {
    // Best effort; the in-memory mark still holds for this isolate.
  }
}

export async function autoReply(fromRaw: string | undefined): Promise<void> {
  const from = toWaNumber(fromRaw);
  if (!from || (await answeredRecently(from))) return;

  const result = await sendWhatsAppText(from, AUTO_REPLY_TEXT);
  if (result.ok) {
    await markAnswered(from);
    console.log(`[whatsapp] auto-replied to …${from.slice(-3)}`);
  }
}
