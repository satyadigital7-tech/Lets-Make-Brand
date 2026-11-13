import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function PartnerCommissionPage() {
  await requireRole(["independent_partner", "team_leader", "team_member", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Commission Accruals & Milestone Tiers"
      phase="Phase 3"
      description="Inspect detailed commission statements, unlock performance milestone bonuses, and monitor tier advancement."
      features={[
        "Itemized accrual ledger per campaign conversion",
        "Performance tier accelerator progress bar",
        "Clear grace period countdown timers for unconfirmed conversions",
        "Exportable PDF and CSV commission statements",
      ]}
      backHref="/dashboard/partner"
    />
  );
}

