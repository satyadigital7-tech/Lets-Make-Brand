import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function AdminWalletPage() {
  await requireRole(["admin", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Admin Wallet & Escrow Ledger"
      phase="Phase 4"
      description="Inspect vendor escrow deposits, partner pending balances, and ledger transaction journals."
      features={[
        "Vendor campaign escrow lockup monitoring",
        "Partner available vs. pending balance auditing",
        "Discrepancy detection & transaction reconciliation",
        "PostgreSQL double-entry ledger verification",
      ]}
      backHref="/dashboard/admin"
    />
  );
}

