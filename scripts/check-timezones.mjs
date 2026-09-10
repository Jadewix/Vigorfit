// Checks that booking times don't depend on the server's clock.
//
// Cloudflare Workers always run in UTC, but the studio keeps Lebanon time.
// This runs the app's own booking code (createBookingAction, the slots route,
// BookingList and the WhatsApp message) once per server timezone in RUNS, with
// Supabase, auth and WhatsApp faked in memory. It fails unless every run
// stores the same instants and shows the same slots and strings, and those
// are the Lebanon times in EXPECTED.
//
//   node scripts/check-timezones.mjs

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKER = "@@check-timezones@@";

// One process per run: Node reads TZ once, at startup.
const RUNS = [
  { TZ: "UTC", APP_TIMEZONE: "Asia/Beirut" }, // Cloudflare Workers
  { TZ: "Asia/Beirut", APP_TIMEZONE: "Asia/Beirut" }, // a dev machine in Lebanon
  { TZ: "America/Los_Angeles", APP_TIMEZONE: "Asia/Beirut" }, // west of UTC
  { TZ: "UTC", APP_TIMEZONE: "" }, // unset, which must still mean Lebanon
];

const COACH = "coach-1";
const ME = "client-1";

// Beirut is UTC+3 until the clocks go back on Sunday 25 Oct 2026, then UTC+2.
const EXPECTED = {
  appTimezone: "Asia/Beirut",
  calendar: { today: "2026-09-11", bookable: ["2026-09-11"] },
  friday10am: {
    outcome: { redirect: "/client/bookings?booked=1" },
    capacityCheckedAt: "2026-09-11T07:00:00.000Z",
    stored: {
      starts_at: "2026-09-11T07:00:00.000Z",
      ends_at: "2026-09-11T08:10:00.000Z",
    },
    whatsapp: ["Fri, Sep 11, 10:00 AM"],
    dashboard: "Sep 11 Fri · 10:00 AM – 11:10 AM pending",
    formatDateTime: "Fri, Sep 11, 10:00 AM",
  },
  pastSlot: {
    outcome: { error: "Please choose a time in the future." },
    stored: null,
  },
  winter: {
    stored: {
      starts_at: "2026-11-02T08:00:00.000Z",
      ends_at: "2026-11-02T09:10:00.000Z",
    },
    whatsapp: ["Mon, Nov 2, 10:00 AM"],
    dashboard: "Nov 2 Mon · 10:00 AM – 11:10 AM pending",
  },
  slotsToday: {
    window: ["2026-09-10T21:00:00.000Z", "2026-09-11T21:00:00.000Z"],
    slots: ["13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  },
  slotsBooked: {
    window: ["2026-09-11T21:00:00.000Z", "2026-09-12T21:00:00.000Z"],
    slots: [
      "08:00 (yours)",
      "09:00",
      "10:00 (full)",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00 (1 left)",
    ],
  },
  slotsLongDay: {
    window: ["2026-10-23T21:00:00.000Z", "2026-10-24T22:00:00.000Z"],
    slots: [
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00 (1 left)",
    ],
  },
  helpers: {
    shortDay: ["2027-03-27T22:00:00.000Z", "2027-03-28T21:00:00.000Z"],
    skippedTime: "2027-03-27T22:30:00.000Z",
    repeatedTime: "2026-10-24T20:30:00.000Z",
    invalid: [null, null, null, null],
    weekday: 5,
    joined: "Sep 11, 2026",
  },
};

// ---------------------------------------------------------------- parent --

async function parent() {
  const runs = [];
  for (const run of RUNS) runs.push(await spawnRun(run));

  console.log(
    "server TZ".padEnd(21) +
      "APP_TIMEZONE".padEnd(14) +
      "Fri 10:00 AM stored as".padEnd(27) +
      "dashboard".padEnd(43) +
      "WhatsApp",
  );
  for (const { run, results } of runs) {
    const b = results.friday10am;
    console.log(
      run.TZ.padEnd(21) +
        (run.APP_TIMEZONE || "(unset)").padEnd(14) +
        String(b.stored?.starts_at).padEnd(27) +
        String(b.dashboard).padEnd(43) +
        b.whatsapp[0],
    );
  }
  console.log();

  const checks = [];
  const check = (name, problems) => checks.push({ name, problems });

  // Agreeing proves nothing unless the runs really had different clocks.
  check(
    `each run had its own server clock (${runs.map((r) => r.meta.localZone).join(", ")})`,
    runs
      .filter(({ run, meta }) => !sameZone(run.TZ, meta.localZone))
      .map(({ run, meta }) => `${label(run)} Node reports ${meta.localZone}`),
  );

  const base = flatten(runs[0].results);
  check(
    `all ${runs.length} runs produced identical results (${Object.keys(base).length} values)`,
    runs.slice(1).flatMap(({ run, results }) => {
      const other = flatten(results);
      return [...new Set([...Object.keys(base), ...Object.keys(other)])]
        .filter((key) => !Object.is(base[key], other[key]))
        .map(
          (key) =>
            `${label(run)} ${key}: ${JSON.stringify(other[key])}, but ` +
            `${label(runs[0].run)} gave ${JSON.stringify(base[key])}`,
        );
    }),
  );

  check(
    "the results are the expected Lebanon times",
    runs.flatMap(({ run, results }) =>
      differences(results, EXPECTED).map((d) => `${label(run)} ${d}`),
    ),
  );

  const native = runs.flatMap((r) => r.meta.nativeChecks);
  check(
    "the helpers match new Date()'s own local-time handling: " +
      native.map((c) => `${c.zone} (${c.compared} half-hours)`).join(", "),
    [
      ...(native.length ? [] : ["no run compared against new Date()"]),
      ...native
        .filter((c) => c.mismatches)
        .map((c) => `${c.zone}: ${c.mismatches} of ${c.compared} differ`),
    ],
  );

  for (const { name, problems } of checks) {
    console.log(`${problems.length ? "✗" : "✓"} ${name}`);
    for (const p of problems) console.log(`    ${p}`);
  }
  const failed = checks.some((c) => c.problems.length);
  console.log(failed ? "\nFAIL" : "\nPASS");
  process.exitCode = failed ? 1 : 0;
}

function spawnRun(run) {
  const env = { ...process.env, TZ: run.TZ };
  if (run.APP_TIMEZONE) env.APP_TIMEZONE = run.APP_TIMEZONE;
  else delete env.APP_TIMEZONE;
  const proc = spawn(
    process.execPath,
    [fileURLToPath(import.meta.url), "--child"],
    { env, stdio: ["ignore", "pipe", "inherit"] },
  );
  let out = "";
  proc.stdout.setEncoding("utf8").on("data", (chunk) => (out += chunk));
  return new Promise((resolve, reject) => {
    proc.on("error", reject);
    proc.on("close", (code) => {
      const line = out.split("\n").find((l) => l.startsWith(MARKER));
      if (code === 0 && line) {
        resolve({ run, ...JSON.parse(line.slice(MARKER.length)) });
      } else {
        reject(new Error(`${label(run)} exited with ${code}\n${out}`));
      }
    });
  });
}

function label(run) {
  return `[TZ=${run.TZ}${run.APP_TIMEZONE ? "" : ", APP_TIMEZONE unset"}]`;
}

function sameZone(requested, reported) {
  return reported === requested || (requested === "UTC" && reported === "Etc/UTC");
}

function flatten(value, at = "", out = {}) {
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      flatten(v, at ? `${at}.${k}` : k, out);
    }
  } else {
    out[at] = value;
  }
  return out;
}

// Leaves of `expected` that `actual` doesn't match; arrays compare whole.
function differences(actual, expected, at = "") {
  if (expected && typeof expected === "object" && !Array.isArray(expected)) {
    return Object.entries(expected).flatMap(([k, v]) =>
      differences(actual?.[k], v, at ? `${at}.${k}` : k),
    );
  }
  return JSON.stringify(actual) === JSON.stringify(expected)
    ? []
    : [`${at}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`];
}

// ----------------------------------------------------------------- child --

async function child() {
  const { createServer, createServerModuleRunner } = await import("vite");
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = (await import("react-dom/server")).default;

  const state = { now: 0, tables: {}, queries: [], sent: [] };
  globalThis.__checkTimezones = {
    supabase: () => ({
      auth: { getUser: async () => ({ data: { user: { id: ME } } }) },
      from: (table) => fakeQuery(state, table),
    }),
    send: (message) => state.sent.push(message),
  };

  // Stand-ins for everything that would reach the network, the session or
  // Next's request context. Everything else is the app's real code.
  const mocks = {
    "@/lib/auth": `
      export async function requireRole() {}
      export async function getCurrentProfile() { return { id: ${JSON.stringify(ME)} }; }`,
    "@/lib/supabase/server": `
      export async function createClient() { return globalThis.__checkTimezones.supabase(); }`,
    "@/lib/supabase/admin": `
      export function createAdminClient() { return globalThis.__checkTimezones.supabase(); }`,
    "@/lib/whatsapp": `
      export const WA_TEMPLATES = { bookingRequest: "booking_request", bookingUpdate: "booking_update", sessionReminder: "session_reminder" };
      export async function sendWhatsAppTemplate(message) { globalThis.__checkTimezones.send(message); return { ok: true }; }`,
    "next/navigation": `
      export function redirect(url) { throw Object.assign(new Error("NEXT_REDIRECT"), { redirectTo: url }); }`,
    "next/server": `
      export const NextResponse = { json: (body, init) => Response.json(body, init) };`,
  };

  const src = path.join(root, "src").replaceAll("\\", "/");
  const vite = await createServer({
    root,
    configFile: false,
    logLevel: "error",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true },
    resolve: {
      alias: [
        ...Object.keys(mocks).map((find) => ({
          find,
          replacement: `\0mock:${find}`,
        })),
        { find: /^@\//, replacement: `${src}/` },
      ],
    },
    plugins: [
      {
        name: "check-timezones:mocks",
        resolveId: (id) => (id.startsWith("\0mock:") ? id : undefined),
        load: (id) =>
          id.startsWith("\0mock:") ? mocks[id.slice("\0mock:".length)] : undefined,
      },
    ],
  });
  const runner = createServerModuleRunner(vite.environments.ssr, { hmr: false });
  const load = (file) =>
    runner.import(path.join(root, file).replaceAll("\\", "/"));

  const tz = await load("src/lib/timezone.ts");
  const utils = await load("src/lib/utils.ts");
  const { createBookingAction } = await load(
    "src/app/client/book/[coachId]/actions.ts",
  );
  const { GET } = await load("src/app/api/coaches/[coachId]/slots/route.ts");
  const { BookingList } = await load("src/components/booking-list.tsx");

  function reset(now, bookings = []) {
    state.now = Date.parse(now);
    state.queries = [];
    state.sent = [];
    state.tables = {
      coaches: [{ id: COACH, active: true }],
      profiles: [
        { id: COACH, full_name: "Casey Coach", phone: "+9613000002" },
        { id: ME, full_name: "Robin Client", phone: "+9613000003" },
      ],
      bookings: bookings.map((b, i) =>
        pgRow({ id: `seeded-${i}`, coach_id: COACH, status: "confirmed", ...b }),
      ),
    };
  }

  // Date.now() is the only clock the booking code reads.
  async function at(fn) {
    const realNow = Date.now;
    Date.now = () => state.now;
    try {
      return await fn();
    } finally {
      Date.now = realNow;
    }
  }

  async function book(now, date, time) {
    reset(now);
    const form = new FormData();
    form.set("coach_id", COACH);
    form.set("date", date);
    form.set("time", time);
    let outcome;
    try {
      outcome = await at(() => createBookingAction({}, form));
    } catch (e) {
      if (!e?.redirectTo) throw e;
      outcome = { redirect: e.redirectTo };
    }
    const row = state.tables.bookings.at(-1) ?? null;
    const capacity = state.queries.find(
      (q) => q.table === "bookings" && q.filters.some((f) => f.col === "starts_at"),
    );
    return {
      outcome,
      capacityCheckedAt: capacity
        ? iso(capacity.filters.find((f) => f.col === "starts_at").value)
        : null,
      stored: row && { starts_at: iso(row.starts_at), ends_at: iso(row.ends_at) },
      whatsapp: state.sent.map((m) => m.params[2]),
      dashboard:
        row && text(createElement(BookingList, { items: [row], getName: () => "" })),
      formatDateTime: row && utils.formatDateTime(row.starts_at),
    };
  }

  async function slots(now, date, bookings) {
    reset(now, bookings);
    const req = {
      nextUrl: new URL(`http://localhost/api/coaches/${COACH}/slots?date=${date}`),
    };
    const res = await at(() =>
      GET(req, { params: Promise.resolve({ coachId: COACH }) }),
    );
    const body = await res.json();
    const range = state.queries.find((q) => q.filters.some((f) => f.op === "gte"));
    return {
      window:
        range &&
        range.filters
          .filter((f) => f.op === "gte" || f.op === "lt")
          .map((f) => iso(f.value)),
      slots: body.slots.map(
        (s) =>
          s.time +
          (s.mine ? " (yours)" : s.taken ? " (full)" : s.remaining === 1 ? " (1 left)" : ""),
      ),
    };
  }

  function text(element) {
    return renderToStaticMarkup(element)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // The booking calendar at 01:30 on Fri 11 Sep in Beirut, still Thursday in
  // UTC and Los Angeles: the 11th must be today and the first bookable day.
  async function calendar(now) {
    reset(now);
    const { BookForm } = await load("src/app/client/book/[coachId]/book-form.tsx");
    // What the booking page passes in.
    const today = await at(() => tz.zonedToday());
    const html = renderToStaticMarkup(
      createElement(BookForm, { coachId: COACH, today }),
    );
    const cell = (day) =>
      html.match(new RegExp(`<td[^>]*data-day="${day}"[^>]*>`))?.[0] ?? "";
    const todayCell = html.match(/<td[^>]*data-today="true"[^>]*>/)?.[0] ?? "";
    return {
      today: /data-day="([^"]+)"/.exec(todayCell)?.[1] ?? null,
      bookable: ["2026-09-10", "2026-09-11"].filter(
        (day) => !cell(day).includes('data-disabled="true"'),
      ),
    };
  }

  const nativeChecks = [];
  const results = {
    appTimezone: tz.APP_TIMEZONE,
    calendar: await calendar("2026-09-10T22:30:00Z"),
    // The booking from the bug report, made the day before.
    friday10am: await book("2026-09-10T09:00:00Z", "2026-09-11", "10:00"),
    // At 12:30 PM that Friday, 10:00 AM has gone.
    pastSlot: await book("2026-09-11T09:30:00Z", "2026-09-11", "10:00"),
    // A November session, once the clocks have gone back to UTC+2.
    winter: await book("2026-10-26T07:00:00Z", "2026-11-02", "10:00"),
    // At 12:30 PM on Friday only the afternoon is left.
    slotsToday: await slots("2026-09-11T09:30:00Z", "2026-09-11"),
    slotsBooked: await slots("2026-09-10T09:00:00Z", "2026-09-12", [
      { starts_at: "2026-09-12T05:00:00Z", client_id: ME }, // 08:00, the viewer's own
      { starts_at: "2026-09-12T06:00:00Z", client_id: "c2", status: "cancelled" }, // 09:00, doesn't count
      { starts_at: "2026-09-12T07:00:00Z", client_id: "c2", status: "pending" }, // 10:00, one of two
      { starts_at: "2026-09-12T07:00:00Z", client_id: "c3" }, // 10:00, two of two
      { starts_at: "2026-09-12T08:00:00Z", client_id: "c2", coach_id: "coach-2" }, // 11:00, another coach
      { starts_at: "2026-09-12T12:00:00Z", client_id: "c2" }, // 15:00, one of two
    ]),
    // The Saturday before the clocks go back is 25 hours (23:00 happens twice).
    slotsLongDay: await slots("2026-10-20T09:00:00Z", "2026-10-24", [
      { starts_at: "2026-10-24T12:00:00Z", client_id: "c2" }, // 15:00
    ]),
    helpers: {
      // Clocks go forward at midnight: the day starts at 01:00, 23 hours long.
      shortDay: dayRange(tz.zonedDayRange("2027-03-28")),
      skippedTime: iso(tz.zonedTimeToUtc("2027-03-28", "00:30")),
      repeatedTime: iso(tz.zonedTimeToUtc("2026-10-24", "23:30")),
      invalid: [
        ["2026-02-30", "10:00"],
        ["2026-09-11", "24:00"],
        ["2026-9-11", "10:00"],
        ["2026-09-11", "10:00:00"],
      ].map(([d, t]) => tz.zonedTimeToUtc(d, t)),
      weekday: tz.weekdayOf("2026-09-11"),
      // The admin Users page: 00:30 on 11 Sep in Beirut is still 10 Sep in UTC.
      joined: utils.formatInAppTimezone("2026-09-10T21:30:00Z", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      sweep: sweep(tz, nativeChecks),
    },
  };

  await runner.close();
  await vite.close();
  const meta = {
    localZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    nativeChecks,
  };
  process.stdout.write(`${MARKER}${JSON.stringify({ meta, results })}\n`, () =>
    process.exit(0),
  );
}

// Every half hour from March 2026 to April 2027 (three clock changes in each
// zone), both ways: clock time -> instant and instant -> clock time. The
// digests must match across runs. In a run whose own zone is the one being
// swept, the helpers must also match new Date()'s built-in local-time handling.
function sweep(tz, nativeChecks) {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const digests = {};
  for (const zone of ["Asia/Beirut", "America/Los_Angeles"]) {
    const hash = createHash("sha256");
    let compared = 0;
    let mismatches = 0;
    for (let t = Date.UTC(2026, 2, 1); t < Date.UTC(2027, 4, 1); t += 30 * 60_000) {
      // t written out in UTC doubles as a clock reading, e.g. 2026-03-01 00:30.
      const text = new Date(t).toISOString();
      const [date, time] = [text.slice(0, 10), text.slice(11, 16)];
      const instant = tz.zonedTimeToUtc(date, time, zone).getTime();
      const clock = tz.utcToZonedTime(t, zone);
      hash.update(`${instant} ${clock.date} ${clock.time}\n`);
      if (zone !== localZone) continue;

      compared++;
      const local = new Date(t);
      const localClock =
        `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())} ` +
        `${pad(local.getHours())}:${pad(local.getMinutes())}`;
      if (
        instant !== new Date(`${date}T${time}:00`).getTime() ||
        localClock !== `${clock.date} ${clock.time}`
      ) {
        mismatches++;
      }
    }
    digests[zone] = hash.digest("hex").slice(0, 16);
    if (compared) nativeChecks.push({ zone, compared, mismatches });
  }
  return digests;
}

// Just enough of Supabase's query builder for the booking code, over a few
// rows in memory. Every query is logged so the checks can see what was asked.
function fakeQuery(state, table) {
  const q = { table, filters: [], insert: null, single: false };
  const filter = (col, op, value) => {
    q.filters.push({ col, op, value });
    return builder;
  };
  const builder = {
    select: () => builder,
    eq: (col, value) => filter(col, "eq", value),
    in: (col, value) => filter(col, "in", value),
    gte: (col, value) => filter(col, "gte", value),
    lt: (col, value) => filter(col, "lt", value),
    insert: (row) => ((q.insert = row), builder),
    single: () => ((q.single = true), builder),
    then: (ok, fail) =>
      Promise.resolve()
        .then(() => execute(state, q))
        .then(ok, fail),
  };
  return builder;
}

function execute(state, q) {
  state.queries.push(q);
  const rows = state.tables[q.table];
  if (q.insert) {
    const row = pgRow({
      id: `new-${rows.length}`,
      created_at: state.now,
      reminder_sent_at: null,
      ...q.insert,
    });
    rows.push(row);
    return { data: row, error: null };
  }
  const hits = rows.filter((row) => q.filters.every((f) => matches(row[f.col], f)));
  if (!q.single) return { data: hits, error: null };
  return hits.length === 1
    ? { data: hits[0], error: null }
    : { data: null, error: { message: `${hits.length} rows` } };
}

// Postgres compares timestamps as instants, whatever text they arrive as.
function matches(actual, { col, op, value }) {
  if (op === "in") return value.includes(actual);
  const [a, b] = col.endsWith("_at")
    ? [Date.parse(actual), Date.parse(value)]
    : [actual, value];
  return op === "eq" ? a === b : op === "gte" ? a >= b : a < b;
}

// PostgREST hands timestamptz back as e.g. "2026-09-11T07:00:00+00:00".
function pgRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [
      k,
      k.endsWith("_at") && v != null
        ? new Date(v).toISOString().replace(".000Z", "+00:00")
        : v,
    ]),
  );
}

function iso(value) {
  return value == null ? null : new Date(value).toISOString();
}

function dayRange(range) {
  return range && [iso(range.start), iso(range.end)];
}

function pad(n) {
  return String(n).padStart(2, "0");
}

if (process.argv.includes("--child")) await child();
else await parent();
