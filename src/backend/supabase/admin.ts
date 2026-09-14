import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client that uses the SERVICE ROLE key.
 * This BYPASSES Row-Level Security, so it must ONLY ever be created and used
 * on the server (Server Actions / Route Handlers) after verifying the caller
 * is an admin. Never import this into a Client Component.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
