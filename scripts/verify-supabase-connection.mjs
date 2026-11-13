import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
let env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("====================================================");
console.log("       LMB PLATFORM - SUPABASE CONNECTION TEST      ");
console.log("====================================================");
console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Key Prefix:   ${supabaseKey ? supabaseKey.substring(0, 16) + "..." : "MISSING"}`);
console.log(`Service Role: ${serviceRoleKey && !serviceRoleKey.includes("placeholder") ? "CONFIGURED" : "PLACEHOLDER / NOT SET"}`);
console.log("----------------------------------------------------");

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ CRITICAL: Supabase URL or Anon/Publishable Key is missing from .env.local");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function runVerification() {
  const results = {
    network: false,
    auth: false,
    database: false,
    tablesFound: [],
    tablesMissing: [],
    errors: [],
  };

  // 1. Test Network Reachability to Supabase Auth endpoint
  console.log("\n[1] Testing Auth Endpoint Health...");
  try {
    const healthUrl = `${supabaseUrl}/auth/v1/health`;
    const res = await fetch(healthUrl);
    if (res.ok) {
      console.log(`✓ PASS: Supabase Auth service reachable (HTTP ${res.status})`);
      results.network = true;
    } else {
      console.log(`! NOTE: Auth health check returned HTTP ${res.status}`);
      results.network = res.status < 500;
    }
  } catch (err) {
    console.error(`❌ FAIL: Network connection to ${supabaseUrl} failed:`, err.message);
    results.errors.push(`Network error: ${err.message}`);
  }

  // 2. Test Supabase Auth Client
  console.log("\n[2] Testing Supabase Auth Client Initialization...");
  try {
    const { data, error } = await client.auth.getSession();
    if (error) {
      console.error("❌ Auth getSession returned error:", error.message);
      results.errors.push(`Auth error: ${error.message}`);
    } else {
      console.log("✓ PASS: Supabase Auth client initialized cleanly (session is null as expected for unauthenticated client)");
      results.auth = true;
    }
  } catch (err) {
    console.error("❌ Auth exception:", err.message);
    results.errors.push(`Auth exception: ${err.message}`);
  }

  // 3. Test Database Queries against core Phase 1 tables
  console.log("\n[3] Testing PostgreSQL Database Tables & Public Schema Access...");
  const coreTables = ["roles", "campaigns", "permissions", "profiles", "system_settings"];

  for (const table of coreTables) {
    try {
      const { data, error, status } = await client.from(table).select("*").limit(1);
      if (error) {
        if (error.code === "PGRST205" || error.code === "42P01" || error.message.includes("does not exist") || error.message.includes("Could not find")) {
          console.log(`ℹ TABLE MISSING: public.${table} (Migration not yet executed in Supabase project)`);
          results.tablesMissing.push(table);
        } else if (error.code === "PGRST301" || error.message.includes("JWT") || error.message.includes("API key")) {
          console.error(`❌ API KEY / AUTH REJECTED on public.${table}:`, error.message);
          results.errors.push(`API Key error on ${table}: ${error.message}`);
        } else {
          console.log(`! RLS / Query response on public.${table}: [${error.code}] ${error.message}`);
          results.tablesFound.push(table);
        }
      } else {
        console.log(`✓ PASS: Queried public.${table} successfully (HTTP ${status}, ${data?.length ?? 0} rows retrieved)`);
        results.tablesFound.push(table);
        results.database = true;
      }
    } catch (err) {
      console.error(`❌ Query exception on public.${table}:`, err.message);
      results.errors.push(`Query exception on ${table}: ${err.message}`);
    }
  }

  console.log("\n----------------------------------------------------");
  console.log("VERIFICATION SUMMARY:");
  console.log(`Network Connected: ${results.network ? "YES" : "NO"}`);
  console.log(`Auth Connected:    ${results.auth ? "YES" : "NO"}`);
  console.log(`Database Tables:   ${results.tablesFound.length} available, ${results.tablesMissing.length} missing`);
  if (results.errors.length > 0) {
    console.log(`Errors encountered:\n  - ${results.errors.join("\n  - ")}`);
  }
  console.log("====================================================");
}

runVerification();
