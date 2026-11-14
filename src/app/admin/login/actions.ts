"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseEnvConfig } from "@/lib/supabase/env";
import { logAuditEvent } from "@/lib/security/audit";
import { loginSchema } from "@/lib/security/validation";
import { headers } from "next/headers";

/**
 * Dedicated Server Action for Super Admin Portal Authentication
 * Strictly validates that the authenticated account holds the 'super_admin' role in PostgreSQL.
 * If unauthorized, immediately terminates the session and returns an explicit access denial.
 */
export async function superAdminLoginAction(rawFormData: unknown) {
  const result = loginSchema.safeParse(rawFormData);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues[0]?.message || "Invalid credentials format.",
    };
  }

  const { email, password } = result.data;

  const envConfig = getSupabaseEnvConfig();
  if (!envConfig.isConfigured) {
    return {
      success: false,
      error: envConfig.errorMessage || "Supabase connection is not properly configured.",
    };
  }

  let ipAddress = "127.0.0.1";
  let userAgent = "Admin-Terminal";
  try {
    const h = await headers();
    ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "127.0.0.1";
    userAgent = h.get("user-agent") || "Admin-Terminal";
  } catch {
    // Fallback if headers cannot be resolved
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      await logAuditEvent({
        action: "super_admin_login_failed",
        entityType: "auth",
        details: { email, reason: error?.message || "Invalid credentials" },
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        error: "Invalid email or password. Please verify your Super Admin credentials.",
      };
    }

    const userId = data.user.id;
    const adminClient = createAdminClient();

    // Verify whether this user holds the 'super_admin' role
    const { data: roleRecords, error: roleError } = await adminClient
      .from("user_roles")
      .select("roles!inner(code)")
      .eq("user_id", userId);

    if (roleError) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Unable to verify administrative authorization. Please try again.",
      };
    }

    const hasSuperAdminRole = (roleRecords || []).some(
      (r: any) => (r.roles?.code || r.roles?.[0]?.code) === "super_admin"
    );

    if (!hasSuperAdminRole) {
      // Immediately sign out unauthorized user
      await supabase.auth.signOut();

      await logAuditEvent({
        userId,
        action: "super_admin_access_rejected",
        entityType: "auth",
        details: {
          email,
          reason: "User lacks super_admin role",
        },
        ipAddress,
        userAgent,
      });

      return {
        success: false,
        error: "Access Denied: This portal is strictly restricted to Super Administrators.",
      };
    }

    // Record successful privileged login
    await logAuditEvent({
      userId,
      action: "super_admin_login_success",
      entityType: "auth",
      details: { email, portal: "admin_portal" },
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      redirectUrl: "/dashboard/super-admin",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Super Admin authentication failed.";
    return {
      success: false,
      error: msg.includes("fetch")
        ? "Network error connecting to authentication service. Please check your internet connection."
        : msg,
    };
  }
}
