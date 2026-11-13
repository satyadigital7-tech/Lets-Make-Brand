import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function PartnerPayoutsPage() {
  await requireRole(["independent_partner", "team_leader", "team_member", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Disbursement & Payout History"
      phase="Phase 4"
      description="Inspect your historical bank transfers, Stripe remittances, and tax withholding receipts."
      features={[
        "Historical disbursement log with bank reference numbers",
        "Downloadable payment receipt PDFs and annual tax statements",
        "Direct deposit and PayPal payment method management",
        "Automated notification triggers upon bank account credit",
      ]}
      backHref="/dashboard/partner"
    />
  );
}

