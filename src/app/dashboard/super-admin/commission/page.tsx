import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function SuperAdminCommissionPage() {
  await requireRole(["super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Commission Structures & Multi-Tier Overrides"
      phase="Phase 3"
      description="Automated calculation engine executing tiered commission splits, agency overrides, and bonus incentive rules across partner networks."
      features={[
        "Dynamic percentage vs. fixed bounty calculation per conversion event",
        "Team Leader hierarchy override splits (Leader share + Member payout)",
        "Volume milestone threshold accelerator bonuses",
        "Configurable holding/grace period before funds unlock for withdrawal",
      ]}
      backHref="/dashboard/super-admin"
    />
  );
}

