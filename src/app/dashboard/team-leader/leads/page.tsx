import React from "react";
import { Filter, AlertTriangle, Shield, CheckCircle2, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeamLeaderLeadsPage() {
  const currentLeader = await requireRole(["team_leader", "super_admin"]);
  const adminClient = createAdminClient();

  // Find leader's team
  const { data: teamData } = await adminClient
    .from("teams")
    .select("id, name, team_code")
    .eq("leader_id", currentLeader.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad Leads Oversight & Validation"
        description="Monitor lead submissions delivered by authorized members of your promotional squad."
        badge={teamData ? teamData.team_code : "Squad Leads"}
      />

      {/* Mandatory Restriction Notice */}
      <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>MODULE 7 MANDATE: PERSONAL LEAD SUBMISSION STRICTLY RESTRICTED</span>
        </div>
        <p className="text-xs text-amber-800/90 leading-relaxed">
          Team Leaders have supervisory monitoring rights over team leads but <strong>cannot submit personal earning leads</strong> 
          or receive partner commissions. This separation guarantees impartial squad supervision.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            {teamData ? `Squad Lead Activity: ${teamData.name}` : "Squad Leads"}
          </CardTitle>
          <CardDescription className="text-xs">
            Leads submitted by promotional members enrolled in your squad
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center text-xs text-slate-500 space-y-2">
          <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <p className="font-bold text-slate-700">No squad leads submitted yet</p>
          <p className="text-slate-400">
            Promotional leads submitted by your squad members for active campaigns will appear here for verification.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
