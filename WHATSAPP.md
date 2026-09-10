# WhatsApp notifications (Meta Cloud API)

The app sends WhatsApp messages on booking events. Until you add credentials it
runs in **dry-run mode** — messages are printed to the server console instead of
being sent, so you can develop the whole flow first.

## What gets sent

| Event                          | Recipient | Template          |
| ------------------------------ | --------- | ----------------- |
| Client requests a session      | Coach     | `booking_request` |
| Coach confirms                 | Client    | `booking_update`  |
| Coach declines                 | Client    | `booking_update`  |
| Coach cancels a confirmed one  | Client    | `booking_update`  |
| Client cancels                 | Coach     | `booking_update`  |
| ~24h before a confirmed session| Both      | `session_reminder`|

## 1. Create a Meta app + WhatsApp number

1. Go to https://developers.facebook.com → create an app (type: **Business**).
2. Add the **WhatsApp** product. Meta gives you a **test number** to start.
3. Note your **Phone number ID** and a **temporary access token** (WhatsApp →
   API Setup). For production, create a **System User** with a **permanent
   token** (Business Settings → Users → System users) that has
   `whatsapp_business_messaging` permission.

## 2. Create the message templates

Meta requires pre-approved templates for business-initiated messages.
WhatsApp Manager → **Message templates → Create template** (category
**Utility**, language **English**). Create these three, using `{{1}}`, `{{2}}`…
placeholders **in this exact order** (the app fills them positionally):

**`booking_request`**
```
Hi {{1}}, you have a new session request from {{2}} for {{3}}.
Open Vigorfit to confirm or decline.
```
Order: 1 = coach first name, 2 = client name, 3 = date/time.

**`booking_update`**
```
Hi {{1}}, update on your session with {{2}} for {{3}}: {{4}}.
```
Order: 1 = recipient first name, 2 = other person, 3 = date/time, 4 = status
(e.g. "Confirmed ✅", "Cancelled").

**`session_reminder`**
```
Hi {{1}}, reminder: your session with {{2}} is coming up on {{3}}. See you there!
```
Order: 1 = recipient first name, 2 = other person, 3 = date/time.

> Approval usually takes minutes to a few hours. If you name a template
> differently, set the matching `WHATSAPP_TEMPLATE_*` env var.

## 3. Add env vars

In `.env.local` (see `.env.local.example`):

```
WHATSAPP_PHONE_NUMBER_ID=...        # from API Setup
WHATSAPP_ACCESS_TOKEN=...           # permanent system-user token
WHATSAPP_API_VERSION=v21.0
WHATSAPP_LANG=en
APP_TIMEZONE=Asia/Beirut           # studio clock for bookings + messages (the default)
```

Restart `npm run dev` after changing env.

## 4. Phone number format

Numbers are stored per user (admin sets them when creating accounts) and must
include the **country code**, e.g. `+961 70 123 456`. The app strips spaces and
the `+` before sending. During Meta's test phase you can only message numbers
you've added as **recipients** in the API Setup screen.

## 5. Reminders (scheduled)

Reminders are sent by an endpoint you call on a schedule:

```
GET /api/cron/reminders     Authorization: Bearer <CRON_SECRET>
```

It messages both parties for confirmed sessions starting within
`REMINDER_LEAD_MINUTES` (default 24h) that haven't been reminded yet, then marks
them so they aren't reminded twice.

- **Vercel**: add a `vercel.json` cron (e.g. hourly) hitting that path — Vercel
  sends the `Authorization` header automatically when you set `CRON_SECRET`.
- **Anywhere else**: any cron service / GitHub Action that does an hourly
  authenticated GET works.

Set `CRON_SECRET` to a long random string in `.env.local`.
