import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function TeamLeaderWalletPage() {
  await requireRole(["team_leader", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Agency Squad Treasury & Payouts"
      phase="Phase 4"
      description="Consolidated agency earnings wallet with automated disbursements to sub-agents and leadership accounts."
      features={[
        "Agency collective earnings ledger and available withdrawal balance",
        "Automated split disbursal direct to individual team member bank accounts",
        "Disbursement history with sub-agent remittance receipts",
        "Tax documentation collation across squad agents",
      ]}
      backHref="/dashboard/team-leader"
    />
  );
}

