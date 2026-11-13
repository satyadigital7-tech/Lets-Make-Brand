import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function TeamMemberWalletPage() {
  await requireRole(["team_member", "team_leader", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Agent Payout Wallet"
      phase="Phase 4"
      description="View your net available withdrawal balance and historical payouts disbursed by your squad leader."
      features={[
        "Available vs. pending withdrawal balances in real time",
        "Disbursement history with individual remittance slips",
        "Direct bank and digital wallet withdrawal settings",
        "Automated notification upon wallet credit",
      ]}
      backHref="/dashboard/team-member"
    />
  );
}

