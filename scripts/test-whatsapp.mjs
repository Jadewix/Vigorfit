// Send a real WhatsApp test message to verify Meta Cloud API credentials.
// Uses Meta's built-in "hello_world" template, so it works before your own
// templates are approved.
//
// Usage:
//   node --env-file=.env.local scripts/test-whatsapp.mjs +9617XXXXXXX
//
// The number must be one you've added as a recipient in Meta's API Setup while
// your app is still in test mode.

const version = process.env.WHATSAPP_API_VERSION || "v21.0";
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const token = process.env.WHATSAPP_ACCESS_TOKEN;
const to = (process.argv[2] || "").replace(/\D/g, "");

if (!phoneId || !token) {
  console.error(
    "Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN in .env.local",
  );
  process.exit(1);
}
if (!to) {
  console.error("Pass a phone number, e.g.  ...test-whatsapp.mjs +96170123456");
  process.exit(1);
}

const res = await fetch(
  `https://graph.facebook.com/${version}/${phoneId}/messages`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name: "hello_world", language: { code: "en_US" } },
    }),
  },
);

const body = await res.json().catch(() => ({}));
if (res.ok) {
  console.log(`✅ Sent to ${to}. Check WhatsApp.`);
  console.log(JSON.stringify(body, null, 2));
} else {
  console.error(`❌ Failed (HTTP ${res.status}):`);
  console.error(JSON.stringify(body, null, 2));
}
