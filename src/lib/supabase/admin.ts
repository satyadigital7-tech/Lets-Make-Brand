import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerSessionClient } from "./server";
import { getSupabaseEnvConfig } from "./env";

export function isRealServiceRoleKey(key?: string): boolean {
  if (!key) return false;
  if (key.includes("placeholder")) return false;
  return key.length > 20;
}

export function createAdminClient() {
  const { supabaseUrl, serviceRoleKey, supabaseAnonKey } = getSupabaseEnvConfig();
  const keyToUse = isRealServiceRoleKey(serviceRoleKey) ? serviceRoleKey! : supabaseAnonKey;

  return createSupabaseClient(supabaseUrl, keyToUse, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Resilient Database Client:
 * Uses Service Role client if a verified service role key is present (bypasses RLS).
 * If absent, falls back to the Authenticated Session client (preserves session RLS).
 */
export async function getAdminOrSessionClient() {
  const { serviceRoleKey } = getSupabaseEnvConfig();
  if (isRealServiceRoleKey(serviceRoleKey)) {
    return createAdminClient();
  }
  return await createServerSessionClient();
}
