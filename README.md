# Vigorfit

Booking and coaching site for a gym in Zgharta, Lebanon. Next.js App Router on
React Server Components, Supabase for auth and data, WhatsApp for notifications,
deployed to Cloudflare Workers via [vinext](https://www.npmjs.com/package/vinext).

## Getting started

```bash
npm run dev
```

Then open http://localhost:3000.

Environment variables and the database schema are covered in [SETUP.md](SETUP.md);
the WhatsApp Cloud API templates are in [WHATSAPP.md](WHATSAPP.md).

## Project structure

Application code lives under `src/`, split into four layers. The dependency
arrow only ever points downward — `shared` imports nothing above it, and
`backend` never reaches into UI.

| Folder          | Holds                                                                                   |
| --------------- | --------------------------------------------------------------------------------------- |
| `src/app`       | Routing only: pages, layouts, server actions and API route handlers. Next.js owns these file names. |
| `src/frontend`  | Everything that renders. `components/` (shared app chrome), `ui/` (primitives), `site/` (public marketing page). |
| `src/backend`   | Server-side data access and domain logic: Supabase clients, auth, subscriptions, notifications, WhatsApp. |
| `src/shared`    | Used by both sides: types, date/time helpers, booking rules and constants, studio details. |

`src/app` stays put because the router is a framework convention — a route is
defined by its folder path, so pages cannot be moved out of it. Everything a
route needs is imported from the three layers below it.

Outside `src/`:

| Path            | Holds                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| `public/`       | The two photographs the landing page uses. See below.                    |
| `supabase/`     | SQL migrations, applied by hand in the Supabase SQL editor.              |
| `scripts/`      | One-off tooling: seeding, the timezone regression suite, a WhatsApp ping. |
| `cron-worker/`  | A tiny separate Worker that holds the cron trigger and calls the app's reminders endpoint. |

### The landing page's photographs

The landing page expects two files in `public/`. They are declared once in
`src/frontend/site/photos.ts`, which is the only place to change a filename or
a pixel size.

| File                    | What it is                        | Needs                         |
| ----------------------- | --------------------------------- | ----------------------------- |
| `hero-dumbbell.webp`    | The weight floating in the hero   | **A transparent background**  |
| `gym-interior.jpg`      | The training floor, booking band  | Landscape, roughly 16:9       |

The hero file must be a cut-out with real alpha. The bloom and contact shadow
behind it are what seat it on the olive ground, and they only work against
transparency — a version with its own backdrop baked in reads as a pasted
rectangle.

Neither file is required for the page to work. When one is missing the
component falls back to a ruled placeholder of exactly the same size (the
wireframe plate in the hero, a hairline grid in the booking band), so the
layout never shifts and nothing shows a broken image.

### Two things worth knowing

**Times are on the studio's clock, never the server's.** Workers run in UTC and
the studio keeps Beirut time, so anything going through the server's local zone
lands 2–3 hours off. `src/shared/timezone.ts` is the only place that converts;
`scripts/check-timezones.mjs` runs the real booking code under four different
server timezones and fails if any of them disagree.

```bash
node scripts/check-timezones.mjs
```

**Opening hours are written down once,** in `HOURS` in `src/shared/booking.ts`.
The booking grid sells slots straight from it, and every hours list on the site
is derived from it in `src/shared/studio.ts`.

## Scripts

| Command                  | Does                                               |
| ------------------------ | -------------------------------------------------- |
| `npm run dev`            | Next dev server on :3000                           |
| `npm run build`          | Production build                                   |
| `npm run lint`           | ESLint                                             |
| `npm run dev:vinext`     | Dev server on the Cloudflare runtime (:3001)       |
| `npm run build:vinext`   | Build for Cloudflare                               |
| `npm run deploy:vinext`  | Deploy to Cloudflare Workers                       |
