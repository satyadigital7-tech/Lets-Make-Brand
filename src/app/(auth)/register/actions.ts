"use server";

import { createClient } from "@/lib/supabase/server";
import { vendorRegisterSchema, partnerRegisterSchema } from "@/lib/security/validation";
import { headers } from "next/headers";

/**
 * Server Action for Vendor Agency Registration
 * Runs on the Next.js server to avoid browser CORS, adblockers, and client-side network drops.
 */
export async function registerVendorAction(rawFormData: unknown) {
  // 1. Validate payload with Zod
  const result = vendorRegisterSchema.safeParse(rawFormData);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid registration information.",
    };
  }

  const formData = result.data;

  // 2. Verify Supabase configuration exists
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || supabaseUrl.includes("placeholder") || !supabaseKey) {
    return {
      success: false,
      error: "Supabase connection is not properly configured in .env.local (NEXT_PUBLIC_SUPABASE_URL or ANON key missing).",
    };
  }

  // 3. Resolve origin for email redirection
  let origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    if (host) {
      origin = `${proto}://${host}`;
    }
  } catch {
    // Fallback to configured site url
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          business_name: formData.businessName,
          company_name: formData.businessName,
          mobile: formData.mobile,
          phone: formData.mobile,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          profile_photo_url: formData.profilePhotoUrl || null,
          role: "vendor",
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit")) {
        return {
          success: false,
          error: "Supabase email rate limit exceeded. In local development or testing, disable 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email), or wait a few minutes before trying again.",
        };
      }
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return {
          success: false,
          error: "An account with this email address already exists. Please log in instead.",
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      userId: data.user?.id,
      sessionCreated: Boolean(data.session),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Vendor registration failed.";
    if (message.includes("fetch") || message.includes("ECONNREFUSED") || message.includes("ENOTFOUND")) {
      return {
        success: false,
        error: "Could not connect to Supabase server. Please verify your internet connection and that NEXT_PUBLIC_SUPABASE_URL is reachable.",
      };
    }
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action for Partner (Independent or Squad Member) Registration
 */
export async function registerPartnerAction(rawFormData: unknown) {
  // 1. Validate payload with Zod
  const result = partnerRegisterSchema.safeParse(rawFormData);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid registration information.",
    };
  }

  const formData = result.data;
  const isTeamMember = Boolean(formData.invitationToken);

  // 2. Verify Supabase configuration exists
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || supabaseUrl.includes("placeholder") || !supabaseKey) {
    return {
      success: false,
      error: "Supabase connection is not properly configured in .env.local (NEXT_PUBLIC_SUPABASE_URL or ANON key missing).",
    };
  }

  // 3. Resolve origin for email redirection
  let origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    if (host) {
      origin = `${proto}://${host}`;
    }
  } catch {
    // Fallback to configured site url
  }

  try {
    const supabase = await createClient();

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
      if (msg.includes("rate limit") || msg.includes("over_email_send_rate_limit")) {
        return {
          success: false,
          error: "Supabase email rate limit exceeded. In local development or testing, disable 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email), or wait a few minutes before trying again.",
        };
      }
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return {
          success: false,
          error: "An account with this email address already exists. Please log in instead.",
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      userId: data.user?.id,
      sessionCreated: Boolean(data.session),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Partner registration failed.";
    if (message.includes("fetch") || message.includes("ECONNREFUSED") || message.includes("ENOTFOUND")) {
      return {
        success: false,
        error: "Could not connect to Supabase server. Please verify your internet connection and that NEXT_PUBLIC_SUPABASE_URL is reachable.",
      };
    }
    return {
      success: false,
      error: message,
    };
  }
}
