import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function VendorLeadsPage() {
  await requireRole(["vendor", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Inbound Lead Review & Verification"
      phase="Phase 2"
      description="Review qualifying customer demo requests, trial signups, and purchase referrals delivered by promotional partners."
      features={[
        "Inbound lead review with conversion timestamps and attribution metadata",
        "Lead validation controls (Approve for payout or flag for compliance review)",
        "Automated CRM webhook synchronizations (HubSpot, Salesforce, Webhooks)",
        "Dispute filing mechanism for suspected non-compliant leads",
      ]}
      backHref="/dashboard/vendor"
    />
  );
}

