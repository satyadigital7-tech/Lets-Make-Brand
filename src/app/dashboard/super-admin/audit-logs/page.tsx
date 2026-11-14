import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { AuditLogsView, AuditLogItem } from "./audit-logs-view";

export const dynamic = "force-dynamic";

export default async function SuperAdminAuditLogsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { data: logsData } = await adminClient
    .from("audit_logs")
    .select(`
      id,
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent,
      created_at,
      profiles:user_id (
        id,
        email,
        full_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const rawLogs = (logsData as any[]) || [];

  const initialLogs: AuditLogItem[] = rawLogs.map((log) => {
    const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
    return {
      id: log.id,
      userId: log.user_id,
      userEmail: profile?.email || null,
      userFullName: profile?.full_name || null,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      details: (log.details as Record<string, unknown>) || {},
      ipAddress: log.ip_address,
      userAgent: log.user_agent,
      createdAt: log.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Audit Logs & Compliance Trail"
        description="Immutable record of all administrator actions, authentication events, commission approvals, and system state modifications."
        badge="Immutable Ledger"
      />

      <AuditLogsView initialLogs={initialLogs} />
    </div>
  );
}
