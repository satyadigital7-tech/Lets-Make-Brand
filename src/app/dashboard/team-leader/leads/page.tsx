import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function TeamLeaderLeadsPage() {
  await requireRole(["team_leader", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Squad Leads Aggregation"
      phase="Phase 2"
      description="Consolidated overview of all promotional lead submissions delivered by members of your agency squad."
      features={[
        "Consolidated squad lead inflow pipeline",
        "Performance attribution segmented per individual squad member",
        "Sub-agent lead verification and compliance review",
        "Dispute handling for rejected squad submissions",
      ]}
      backHref="/dashboard/team-leader"
    />
  );
}

