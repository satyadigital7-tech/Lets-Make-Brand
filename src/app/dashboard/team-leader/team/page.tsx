import React from "react";
import { Users2, Mail, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TeamLeaderTeamPage() {
  await requireRole(["team_leader", "super_admin"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad Members & Sub-Agents"
        description="Organize your agency promotional roster, review performance benchmarks, and manage squad assignments."
        badge="Squad Management"
      />

      <EmptyState
        icon={<Users2 className="h-8 w-8 text-slate-400" />}
        title="No members added to your squad yet"
        description="In Phase 2, you will be able to dispatch invitation links to sub-agents and configure custom commission split agreements."
      />
    </div>
  );
}

