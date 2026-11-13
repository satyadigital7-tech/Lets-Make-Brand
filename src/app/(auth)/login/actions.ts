"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnvConfig } from "@/lib/supabase/env";
import { loginSchema } from "@/lib/security/validation";

/**
 * Server Action for User Login
 * Sets session cookies directly on the server response via @supabase/ssr.
 */
export async function loginAction(rawFormData: unknown) {
  const result = loginSchema.safeParse(rawFormData);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid email or password.",
    };
  }

  const formData = result.data;

  const envConfig = getSupabaseEnvConfig();
  if (!envConfig.isConfigured) {
    return {
      success: false,
      error: envConfig.errorMessage || "Supabase connection is not properly configured.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login credentials")) {
        return {
          success: false,
          error: "Invalid email address or password. Please verify your credentials.",
        };
      }
      if (msg.includes("email not confirmed")) {
        return {
          success: false,
          error: "Please verify your email address before signing in. Check your inbox for the confirmation link.",
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
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed.";
    if (message.includes("fetch") || message.includes("ECONNREFUSED") || message.includes("ENOTFOUND")) {
      return {
        success: false,
        error: "Could not connect to authentication server. Please check your network connection.",
      };
    }
    return {
      success: false,
      error: message,
    };
  }
}
