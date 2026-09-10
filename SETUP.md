# Vigorfit — Setup

A coaching studio booking platform with role-based access:

- **Admin** — creates every account (coaches, clients, other admins) and sees all bookings.
- **Coach** — sets a public profile + weekly availability, and confirms/declines/completes sessions.
- **Client** — browses coaches, requests sessions, and manages their own bookings.

Built with **Next.js 16** (App Router) + **Supabase** (Postgres, Auth, Row-Level Security).

---

## 1. Create a Supabase project

1. Go to https://supabase.com → **New project** (free tier is fine).
2. Give it a name + database password, pick a region, and wait for it to spin up.

## 2. Load the database schema

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   This creates the tables (`profiles`, `coaches`, `availability`, `bookings`),
   the role enum, RLS policies, and the trigger that builds a profile whenever
   a user is created.

## 3. Add your environment variables

1. In the dashboard: **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key
   - **service_role** key (secret)
2. In this project, copy the example env file and fill it in:

   ```bash
   cp .env.local.example .env.local
   ```

   ```
   NEXT_PUBLIC_SUPABASE_URL=...          # Project URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...     # anon public key
   SUPABASE_SERVICE_ROLE_KEY=...         # service_role secret (server-only)
   ```

   > The service_role key bypasses all security rules. It is only used
   > server-side (creating accounts) and must never be committed or exposed
   > to the browser. `.env.local` is already git-ignored.

## 4. Create the first admin

Accounts use a **username**, not an email. Internally each username maps to a
hidden email `<username>@coachbook.local` — you never type it, but you use it
once here to bootstrap the first admin.

1. Supabase dashboard → **Authentication → Users → Add user**.
   For the email, enter your chosen username in that internal form — e.g.
   **`admin@coachbook.local`** for the username `admin` — set a password, and
   **check "Auto Confirm User"**.
2. Give that account the admin role + username in the **SQL Editor**:

   ```sql
   update public.profiles
      set role = 'admin', username = 'admin'
    where email = 'admin@coachbook.local';
   ```

Then sign in with the **username** `admin` and your password. Every other
account is created from the app's **Users** page (no dashboard needed).

## 5. Run it

```bash
npm run dev
```

Open http://localhost:3000, click **Sign in**, and log in as your admin.
From **Users** you can now create coaches and clients — everyone else logs in
with the credentials you set for them.

---

## How the roles flow

| Role   | Lands on  | Can do                                                        |
| ------ | --------- | ------------------------------------------------------------ |
| admin  | `/admin`  | Create/delete any user, view & delete every booking          |
| coach  | `/coach`  | Edit profile & availability, confirm/decline/complete sessions |
| client | `/client` | Browse coaches, request bookings, cancel their own           |

Access is enforced in **two layers**: `src/proxy.ts` gates routes by role, and
Postgres **Row-Level Security** (in `supabase/schema.sql`) enforces data access
at the database — so even direct API calls can't read or change another user's
data.

## Notes / next steps

- **Timezones**: booking times are always on the studio's clock — Lebanon
  (`Asia/Beirut`), or whichever IANA zone `APP_TIMEZONE` names — never the
  server's, which is UTC on Workers. Go through `src/lib/timezone.ts` and
  `formatInAppTimezone()` rather than `new Date("…T10:00")`, `getHours()` or
  `toLocaleString()` without a `timeZone`. `node scripts/check-timezones.mjs`
  runs the booking code under several server timezones and checks they agree.
- **Deploy**: the app runs on Cloudflare Workers via
  [vinext](https://github.com/cloudflare/vinext) (`vite.config.ts` +
  `wrangler.jsonc`). Push to GitHub and import the repo under Workers. The
  build writes its own `dist/server/wrangler.json`, so both deploy commands
  have to point at it:

  | Setting | Value |
  | --- | --- |
  | Build command | `npm run build:vinext` |
  | Deploy command | `npx wrangler deploy --config dist/server/wrangler.json` |
  | Non-production branch | `npx wrangler versions upload --config dist/server/wrangler.json` |

  `next dev` still works for local development; `npm run dev:vinext` runs the
  app the way Workers will.

  Env vars land in two separate places. The `NEXT_PUBLIC_*` three are inlined
  into the client bundle at build time, so they belong in the **Workers Builds**
  build variables. Everything else is read at request time through
  `process.env` (populated from bindings by `nodejs_compat`), so it belongs on
  the Worker under **Settings -> Variables and Secrets** —
  `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_ACCESS_TOKEN` and `CRON_SECRET` as
  Secret, the rest as Text.
- **Reminders cron**: `/api/cron/reminders` needs an hourly caller. On Workers
  that is a Cron Trigger, not Vercel Cron.
