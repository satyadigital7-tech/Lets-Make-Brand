import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { ReportsAdminView } from "./reports-admin-view";
import { fetchPlatformReportMetrics } from "@/lib/services/reports";

export const dynamic = "force-dynamic";

export default async function SuperAdminReportsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const metrics = await fetchPlatformReportMetrics(adminClient);

  const { data: exportRows } = await adminClient
    .from("report_exports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const recentExports = ((exportRows as any[]) || []).map((e: any) => ({
    id: e.id,
    exportCode: e.export_code,
    reportType: e.report_type,
    exportFormat: e.export_format,
    rowCount: e.row_count,
    createdAt: e.created_at,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics & Executive Reports"
        description="Comprehensive real-time reporting across partner performance, lead audits, and financial treasury dispatches."
      />
      <ReportsAdminView
        initialMetrics={metrics}
        recentExports={recentExports}
      />
    </div>
  );
}
