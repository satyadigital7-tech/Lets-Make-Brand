import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  await requireRole(["admin", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Admin Operational Reports"
      phase="Phase 5"
      description="Standard operational metrics on active campaigns, partner referral volumes, and payout throughput."
      features={[
        "Daily, weekly, and monthly partner lead volume trends",
        "Vendor campaign performance and budget burn rates",
        "Platform audit summaries for compliance reviews",
        "Automated report generation with CSV download utilities",
      ]}
      backHref="/dashboard/admin"
    />
  );
}

