import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function PartnerLeadsPage() {
  await requireRole(["independent_partner", "team_leader", "team_member", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Submitted Leads & Conversions"
      phase="Phase 2"
      description="Track the real-time status of user referrals, qualification progression, and vendor verification decisions."
      features={[
        "Status tracking per referred customer (Pending, Verified, Rejected)",
        "Attribution audit trails with unique conversion hashes",
        "Estimated commission earnings per qualifying lead",
        "Dispute submission for unverified conversions",
      ]}
      backHref="/dashboard/partner"
    />
  );
}

