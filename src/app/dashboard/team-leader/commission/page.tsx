import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function TeamLeaderCommissionPage() {
  await requireRole(["team_leader", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Group Commission Splits & Overrides"
      phase="Phase 3"
      description="Manage custom revenue share agreements, leader override bonuses, and squad milestone distributions."
      features={[
        "Custom rev-share tier configurations per team member",
        "Automated split deduction at the time of conversion confirmation",
        "Leader override bonus ledger tracking",
        "Squad performance leaderboard and reward payouts",
      ]}
      backHref="/dashboard/team-leader"
    />
  );
}

