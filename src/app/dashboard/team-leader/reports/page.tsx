import React from "react";
import { BarChart3, Users, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeamLeaderReportsPage() {
  const currentLeader = await requireRole(["team_leader", "super_admin"]);
  const adminClient = createAdminClient();

  const { data: teamData } = await adminClient
    .from("teams")
    .select(`
      id,
      name,
      team_code,
      team_members (
        id,
        status
      )
    `)
    .eq("leader_id", currentLeader.id)
    .maybeSingle();

  const activeMembers = teamData?.team_members
    ? (teamData.team_members as any[]).filter((m) => m.status === "active").length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad Analytics & Productivity Reports"
        description="Review promotional outreach productivity and member participation metrics for your squad."
        badge={teamData ? teamData.team_code : "Squad Analytics"}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Supervised Squad
              </span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {teamData?.name || "Unassigned"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Active Squad Members
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {activeMembers}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Earning Lead Status
              </span>
              <span className="text-xs font-bold text-rose-600 mt-2 block">
                Personal Earning Restricted (M7)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Promotional Attribution Breakdown
          </CardTitle>
          <CardDescription className="text-xs">
            Aggregated member performance reports for campaigns in your squad
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center text-xs text-slate-500 space-y-2">
          <BarChart3 className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
          <p className="font-bold text-slate-700">Analytics pipeline initialized</p>
          <p className="text-slate-400">
            Real-time conversion reports and attribution metrics will populate as campaigns launch.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
