import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function VendorWalletPage() {
  await requireRole(["vendor", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Vendor Escrow Wallet & Billing"
      phase="Phase 4"
      description="Deposit campaign escrow funds, manage auto-replenishment limits, and inspect monthly billing statements."
      features={[
        "Dedicated corporate escrow balance account for campaign budgets",
        "Automated low-balance alerts and auto-recharge triggers",
        "Itemized commission payout debit records linked to verified leads",
        "Corporate invoice generation with downloadable tax-compliant receipts",
      ]}
      backHref="/dashboard/vendor"
    />
  );
}

