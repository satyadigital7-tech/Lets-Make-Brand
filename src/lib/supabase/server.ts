import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnvConfig } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnvConfig();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be safely ignored if middleware refreshes user sessions.
        }
      },
    },
  });
}
