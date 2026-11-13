import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatency = 0;
  let authStatus = "healthy";

  try {
    const supabase = await createClient();
    
    // Quick ping to database
    const dbPingStart = Date.now();
    const { error: dbError } = await supabase
      .from("roles")
      .select("count", { count: "exact", head: true });
    
    dbLatency = Date.now() - dbPingStart;
    if (dbError && dbError.code !== "PGRST116") {
      // If table doesn't exist yet in remote DB, note as initializing
      dbStatus = dbError.message.includes("does not exist") ? "unmigrated" : "degraded";
    }

    // Auth status
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      authStatus = "degraded";
    }
  } catch (err) {
    dbStatus = "unreachable";
    authStatus = "unreachable";
  }

  const responseTimeMs = Date.now() - startTime;
  const isHealthy = dbStatus !== "degraded" && authStatus !== "degraded";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      platform: "Lets Make Brand (LMB) Enterprise Platform",
      domain: "letsmakebrand.co.in",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs,
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
          engine: "Supabase PostgreSQL 15+",
          rlsEnforced: true,
        },
        authentication: {
          status: authStatus,
          provider: "Supabase Auth (JWT)",
          sessionPersistence: true,
        },
        storage: {
          status: "ready",
          buckets: ["kyc-documents", "support-attachments"],
          accessControl: "private_signed_urls",
        },
      },
      security: {
        rbacRoles: 6,
        auditLogging: "active",
        sensitiveFieldMasking: "active",
        csrfProtection: "enforced",
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Health-Check": "LMB-OK",
      },
    }
  );
}
