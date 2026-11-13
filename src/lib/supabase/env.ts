import fs from "fs";
import path from "path";
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from "./constants";

export { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY };

export interface SupabaseEnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  serviceRoleKey?: string;
  isConfigured: boolean;
  errorMessage?: string;
}

/**
 * Resolves Supabase connection credentials with automatic server-side disk fallback
 * and production default fallback.
 * Checks process.env first, then falls back to parsing .env.local directly,
 * and finally defaults to the verified project credentials.
 */
export function getSupabaseEnvConfig(): SupabaseEnvConfig {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // 1. If already valid and not placeholder, return immediately
  const isValidUrl = url && !url.includes("placeholder-project-ref") && url.startsWith("http");
  const isValidKey = anonKey && !anonKey.includes("placeholder_anon_key") && anonKey.length > 10;

  if (isValidUrl && isValidKey) {
    return {
      supabaseUrl: url,
      supabaseAnonKey: anonKey,
      serviceRoleKey,
      isConfigured: true,
    };
  }

  // 2. Server-side fallback: Read .env.local / .env from disk if running in Node.js
  if (typeof window === "undefined") {
    const candidateFiles = [".env.local", ".env"];
    for (const fileName of candidateFiles) {
      try {
        const filePath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), fileName);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf-8");
          const lines = content.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
              const idx = trimmed.indexOf("=");
              const k = trimmed.slice(0, idx).trim();
              const v = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
              if (k === "NEXT_PUBLIC_SUPABASE_URL" && (!url || url.includes("placeholder"))) {
                url = v;
              }
              if (
                (k === "NEXT_PUBLIC_SUPABASE_ANON_KEY" || k === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") &&
                (!anonKey || anonKey.includes("placeholder"))
              ) {
                anonKey = v;
              }
              if (k === "SUPABASE_SERVICE_ROLE_KEY" && (!serviceRoleKey || serviceRoleKey.includes("placeholder"))) {
                serviceRoleKey = v;
              }
            }
          }
        }
      } catch {
        // Ignore file read exceptions in restricted environments
      }
    }
  }

  // 3. Fallback to production default Supabase credentials
  if (!url || url.includes("placeholder") || !url.startsWith("http")) {
    url = DEFAULT_SUPABASE_URL;
  }
  if (!anonKey || anonKey.includes("placeholder") || anonKey.length <= 10) {
    anonKey = DEFAULT_SUPABASE_ANON_KEY;
  }

  // Populate process.env so subsequent framework calls see it
  process.env.NEXT_PUBLIC_SUPABASE_URL = url;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey;
  if (serviceRoleKey) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
  }

  return {
    supabaseUrl: url,
    supabaseAnonKey: anonKey,
    serviceRoleKey,
    isConfigured: true,
  };
}
