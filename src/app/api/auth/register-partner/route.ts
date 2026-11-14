import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnvConfig } from "@/lib/supabase/env";
import { partnerRegisterSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = partnerRegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error.issues[0]?.message || "Invalid registration information.",
        },
        { status: 400 }
      );
    }

    const formData = result.data;
    const isTeamMember = Boolean(formData.invitationToken);
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

    const origin = request.nextUrl.origin || "http://localhost:3000";

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          mobile: formData.mobile,
          phone: formData.mobile,
          dob: formData.dob,
          gender: formData.gender,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          profile_photo_url: formData.profilePhotoUrl || null,
          referral_code: formData.referralCode || null,
          registration_type: isTeamMember ? "team_member" : "independent",
          role: "independent_partner",
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      let friendlyMsg = error.message;
      if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit")) {
        friendlyMsg =
          "Supabase email rate limit reached. In development or testing, disable 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email), or wait a few minutes.";
      } else if (msg.includes("already registered") || msg.includes("already exists")) {
        friendlyMsg = "An account with this email address already exists. Please log in instead.";
      }
      return NextResponse.json({ success: false, error: friendlyMsg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      userId: data.user?.id,
      sessionCreated: Boolean(data.session),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Partner registration failed.";
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

