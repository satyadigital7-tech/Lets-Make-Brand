import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function PartnerWalletPage() {
  await requireRole(["independent_partner", "team_leader", "team_member", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Partner Earnings Wallet"
      phase="Phase 4"
      description="Manage your available withdrawal balances, review ledger credits, and initiate scheduled bank transfers."
      features={[
        "Available vs. pending withdrawal balances in real time",
        "Minimum payout threshold enforcement ($50 USD minimum)",
        "Double-entry bookkeeping journal entries for all credit adjustments",
        "Instant withdrawal request trigger for KYC-verified partners",
      ]}
      backHref="/dashboard/partner"
    />
  );
}

