import React from "react";
import { LineChart, Users, Shield, Megaphone, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function VendorTeamPerformancePage() {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  // 1. Fetch vendor's teams and their member counts
  const { data: teamsData } = await adminClient
    .from("teams")
    .select(`
      id,
      name,
      team_code,
      status,
      created_at,
      leader:leader_id (
        full_name
      ),
      team_members (
        id,
        status
      )
    `)
    .eq("vendor_id", currentVendor.id);

  // 2. Fetch vendor campaigns count
  const { count: campaignsCount } = await adminClient
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("created_by", currentVendor.id);

  const rawTeams = (teamsData as any[]) || [];

  let totalMembers = 0;
  let totalLeaders = 0;

  const teamStats = rawTeams.map((t) => {
    const leaderObj = Array.isArray(t.leader) ? t.leader[0] : t.leader;
    const activeMembers = Array.isArray(t.team_members)
      ? t.team_members.filter((m: any) => m.status === "active").length
      : 0;

    totalMembers += activeMembers;
    if (leaderObj?.full_name) {
      totalLeaders += 1;
    }

    return {
      id: t.id,
      name: t.name,
      teamCode: t.team_code,
      leaderName: leaderObj?.full_name || "Unassigned",
      memberCount: activeMembers,
      status: t.status,
      createdAt: t.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad Analytics & Performance Metrics"
        description="Monitor promotional workforce allocation, appointed leadership coverage, and squad readiness."
        badge="Live Metrics"
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Squads
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {rawTeams.length}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Appointed Leaders
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {totalLeaders}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Active Partners
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {totalMembers}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Brand Campaigns
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {campaignsCount || 0}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Megaphone className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Squad Breakdown Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Squad Breakdown & Roster Density
          </CardTitle>
          <CardDescription className="text-xs">
            Review distribution of promotional partners across brand squads
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {teamStats.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Squad Name</TableHead>
                    <TableHead>Team Code</TableHead>
                    <TableHead>Appointed Leader</TableHead>
                    <TableHead>Active Squad Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Established</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamStats.map((team) => (
                    <TableRow key={team.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-bold text-xs text-slate-900">
                        {team.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                        {team.teamCode}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {team.leaderName}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800">
                        <span className="text-blue-600 font-bold">{team.memberCount}</span>{" "}
                        {team.memberCount === 1 ? "member" : "members"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={team.status === "active" ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {team.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(team.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              No squads established yet to report metrics.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
