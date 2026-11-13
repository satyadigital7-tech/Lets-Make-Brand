import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function AdminCommissionPage() {
  await requireRole(["admin", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Admin Commission Monitoring"
      phase="Phase 3"
      description="Inspect commission distribution calculations, tier override rules, and promotional earnings."
      features={[
        "Real-time commission accrual inspection",
        "Override calculation auditing across team leader squads",
        "Threshold dispute resolution tools",
        "Commission adjustment logs with mandatory audit reasoning",
      ]}
      backHref="/dashboard/admin"
    />
  );
}

