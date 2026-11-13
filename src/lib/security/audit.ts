import { createAdminClient } from "@/lib/supabase/admin";
import { Json } from "@/lib/types/database.types";

export interface LogAuditParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Record administrative and security actions in the audit_logs table.
 * Uses the server-side admin client to ensure logs cannot be tampered with.
 */
export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    const adminClient = createAdminClient();
    const detailsJson = (params.details || {}) as unknown as Json;

    await adminClient.from("audit_logs").insert({
      user_id: params.userId || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      details: detailsJson,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    });
  } catch (error) {
    // We log to server stderr if audit log table insertion fails, but do not crash the caller
    console.error("[AUDIT LOG FAILURE]:", error, params);
  }
}

