import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnvConfig } from "@/lib/supabase/env";
import { loginSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Invalid email or password.",
        },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvConfig();

    const response = NextResponse.json({ success: true });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      let friendlyMsg = error.message;
      if (msg.includes("invalid login credentials")) {
        friendlyMsg = "Invalid email address or password. Please verify your credentials.";
      } else if (msg.includes("email not confirmed")) {
        friendlyMsg =
          "Please verify your email address before signing in. Check your inbox for the confirmation link.";
      }
      return NextResponse.json({ success: false, error: friendlyMsg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      userId: data.user?.id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed.";
    return NextResponse.json(
      {
        success: false,
        error: message.includes("fetch")
          ? "Could not connect to authentication server. Please verify your internet connection."
          : message,
      },
      { status: 500 }
    );
  }
}

