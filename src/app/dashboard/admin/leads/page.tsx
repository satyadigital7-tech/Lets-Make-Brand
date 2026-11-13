import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  await requireRole(["admin", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Admin Leads Review & Qualification"
      phase="Phase 2"
      description="Operational moderation queue for validating inbound partner leads against campaign qualification rules."
      features={[
        "Inbound lead queue with anti-fraud scoring heuristics",
        "Vendor campaign criteria matching & duplicate detection",
        "Manual approval / rejection overrides with reason logging",
        "Cryptographic ledger attribution timestamping",
      ]}
      backHref="/dashboard/admin"
    />
  );
}

