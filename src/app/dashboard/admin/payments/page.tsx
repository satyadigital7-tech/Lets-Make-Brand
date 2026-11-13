import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireRole(["admin", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Admin Payment Queue & Disbursals"
      phase="Phase 4"
      description="Operational management of partner payout requests, remittance processing, and banking transfers."
      features={[
        "Payout request verification & KYC threshold checks",
        "Disbursement batch staging & execution",
        "Failed transfer retry queues & reconciliation",
        "Immutable transaction logs linked with bank transaction IDs",
      ]}
      backHref="/dashboard/admin"
    />
  );
}

