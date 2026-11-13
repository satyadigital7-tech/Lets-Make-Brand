import { createBrowserClient } from "@supabase/ssr";
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from "./constants";

export function createClient() {
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

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
