import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function TeamMemberCommissionPage() {
  await requireRole(["team_member", "team_leader", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="My Commission Accruals"
      phase="Phase 3"
      description="Inspect your net commission accruals calculated after squad revenue splits and milestone bonuses."
      features={[
        "Individual earnings breakdown per confirmed lead",
        "Transparent squad split deductions viewable per line item",
        "Performance tier milestone progress trackers",
        "Unconfirmed lead conversion holding period counters",
      ]}
      backHref="/dashboard/team-member"
    />
  );
}

