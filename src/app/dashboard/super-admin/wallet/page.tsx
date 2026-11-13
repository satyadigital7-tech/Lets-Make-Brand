import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function SuperAdminWalletPage() {
  await requireRole(["super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Platform Treasury & Wallet Ledger"
      phase="Phase 4"
      description="Cryptographic double-entry ledger managing merchant escrow deposits, partner pending accruals, and available balances."
      features={[
        "Double-entry bookkeeping transactions with immutability guarantees",
        "Vendor pre-funded campaign escrow balance tracking",
        "Automated balance reserve holds for active campaign budgets",
        "Real-time reconciliation against PostgreSQL transaction journal",
      ]}
      backHref="/dashboard/super-admin"
    />
  );
}

