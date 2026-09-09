import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_PREFIX: Record<string, string> = {
  admin: "/admin",
  coach: "/coach",
  client: "/client",
};

/**
 * Runs on every matched request (Next 16 "proxy" convention). It:
 *   1. Refreshes the Supabase auth session (keeps cookies fresh).
 *   2. Gates the /admin, /coach and /client areas by role.
 *   3. Bounces signed-in users away from /login to their dashboard.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected =
    path.startsWith("/admin") ||
    path.startsWith("/coach") ||
    path.startsWith("/client");

  // Not signed in -> keep out of protected areas.
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", path);
    return NextResponse.redirect(url);
  }

  // Signed in -> look up role and enforce the right area.
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as keyof typeof ROLE_PREFIX | undefined;
    // A client's "home" is the public landing page; staff go to their area.
    const home = role === "client" ? "/" : role ? ROLE_PREFIX[role] : "/login";

    // On the public sign-in page while already authenticated -> home.
    if (path === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }

    // In a protected area that isn't yours -> send home.
    if (isProtected && role && !path.startsWith(ROLE_PREFIX[role])) {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  /*
   * Only the paths this proxy actually decides anything about. It used to run
   * on every request, which cost each one two round trips to Supabase — the
   * getUser call above plus the profiles role lookup — before the handler even
   * started, including on /api routes and the public marketing pages, where
   * none of the rules above apply. Route handlers get a cookie-writable
   * Supabase client, so they still refresh an expiring session on their own.
   */
  matcher: ["/admin/:path*", "/coach/:path*", "/client/:path*", "/login"],
};
