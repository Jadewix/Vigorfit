// Seed test accounts for local end-to-end testing.
// Run with:  node --env-file=.env.local scripts/seed.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1. Schema sanity check
{
  const { error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });
  if (error) {
    console.error(
      "\nSchema not ready. Run supabase/schema.sql in the Supabase SQL Editor first.\nDetails:",
      error.message,
    );
    process.exit(1);
  }
}

const PASS = "Test1234!";
const users = [
  { username: "testadmin", full_name: "Test Admin", role: "admin", phone: "+9613000001" },
  {
    username: "testcoach",
    full_name: "Casey Coach",
    role: "coach",
    phone: "+9613000002",
    specialty: "Strength & Conditioning",
    bio: "Turning beginners into athletes for 20 years.",
  },
  { username: "testclient", full_name: "Robin Client", role: "client", phone: "+9613000003" },
];

async function findUserIdByEmail(email) {
  let page = 1;
  for (;;) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    const list = data?.users ?? [];
    const hit = list.find((u) => u.email === email);
    if (hit) return hit.id;
    if (list.length < 200) return null;
    page++;
  }
}

async function ensureUser(u) {
  const email = `${u.username}@coachbook.local`;
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASS,
    email_confirm: true,
    user_metadata: u,
  });
  if (!error) {
    console.log(`+ created ${u.username} (${u.role})`);
    return data.user.id;
  }
  if (/already|registered|exists|duplicate/i.test(error.message)) {
    console.log(`= ${u.username} already exists`);
    return findUserIdByEmail(email);
  }
  throw error;
}

const ids = {};
for (const u of users) ids[u.username] = await ensureUser(u);

// Coach availability: Mon–Fri 09:00–17:00
const coachId = ids["testcoach"];
if (coachId) {
  const { count } = await supabase
    .from("availability")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", coachId);
  if (!count) {
    const rows = [1, 2, 3, 4, 5].map((weekday) => ({
      coach_id: coachId,
      weekday,
      start_time: "09:00:00",
      end_time: "17:00:00",
    }));
    const { error } = await supabase.from("availability").insert(rows);
    console.log(error ? `availability error: ${error.message}` : "+ added Mon–Fri 9–17 availability");
  } else {
    console.log("= coach already has availability");
  }
}

console.log(`\nDone. Login at http://localhost:3000/login  (password for all: ${PASS})`);
console.log("  admin  -> testadmin");
console.log("  coach  -> testcoach");
console.log("  client -> testclient");
