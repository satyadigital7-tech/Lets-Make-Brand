import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function TeamMemberLeadsPage() {
  await requireRole(["team_member", "team_leader", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="My Inbound Leads"
      phase="Phase 2"
      description="Track the real-time qualification and conversion status of customer leads attributed to your agent tracking links."
      features={[
        "Real-time lead status updates (Pending Verification, Approved, Rejected)",
        "Direct attribution tracking via agent ID parameter",
        "Dispute submission pipeline for contested conversions",
        "Conversion rate metrics across your promotion channels",
      ]}
      backHref="/dashboard/team-member"
    />
  );
}

