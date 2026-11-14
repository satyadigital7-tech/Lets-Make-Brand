import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from "./constants";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  const supabaseUrl =
    envUrl && !envUrl.includes("placeholder-project-ref") && envUrl.startsWith("http")
      ? envUrl
      : DEFAULT_SUPABASE_URL;

  const supabaseAnonKey =
    envKey && !envKey.includes("placeholder_anon_key") && envKey.length > 10
      ? envKey
      : DEFAULT_SUPABASE_ANON_KEY;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid using supabase.auth.getSession() in middleware as it
  // doesn't guarantee security on server runtime. Use getUser() instead.
  let user = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    user = null;
  }

  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const isAdminSubdomain = host.startsWith("admin.") || host.startsWith("superadmin.");

  // Subdomain routing for admin.letsmakebrand.co.in
  if (isAdminSubdomain) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = user ? "/dashboard/super-admin" : "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Protected route checking: /dashboard/*
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      // If navigating to super-admin dashboard while unauthenticated, redirect to dedicated admin login
      url.pathname = pathname.startsWith("/dashboard/super-admin") ? "/admin/login" : "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/admin/login")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/admin/login" ? "/dashboard/super-admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
