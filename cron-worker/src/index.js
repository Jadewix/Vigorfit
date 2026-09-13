/**
 * Vigorfit reminders cron.
 *
 * The app itself cannot carry a Cloudflare cron trigger: vinext generates its
 * Worker entry (`vinext/server/fetch-handler`) with only a `fetch` handler, and
 * a trigger needs a `scheduled` one. Rather than eject from vinext's entry,
 * this tiny Worker holds the schedule and calls the app's endpoint.
 *
 * It sends WhatsApp session reminders (~24h before a confirmed session) and
 * subscription-expiry reminders. Both are idempotent: the app marks what it has
 * already sent, so running hourly never double-sends.
 *
 * Deploy:
 *   npx wrangler deploy --config cron-worker/wrangler.jsonc
 * Set the shared secret (must match CRON_SECRET on the vigorfit Worker):
 *   npx wrangler secret put CRON_SECRET --config cron-worker/wrangler.jsonc
 * Watch it run:
 *   npx wrangler tail --config cron-worker/wrangler.jsonc
 */

const ENDPOINT = "/api/cron/reminders";

async function runReminders(env) {
  if (!env.CRON_SECRET) {
    console.error("[cron] CRON_SECRET is not set; refusing to call the app.");
    return;
  }

  const url = `${env.APP_URL}${ENDPOINT}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const body = await res.text();
    // Visible in `wrangler tail`. A 401 here means the two Workers disagree
    // about CRON_SECRET; a 200 reports how many messages went out.
    console.log(`[cron] ${res.status} ${body.slice(0, 200)}`);
  } catch (e) {
    console.error("[cron] request failed", e);
  }
}

const worker = {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runReminders(env));
  },

  // Not the point of this Worker, but a plain response beats a runtime error
  // if anyone opens its URL.
  fetch() {
    return new Response("Vigorfit reminders cron. Runs on a schedule.", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  },
};

export default worker;
