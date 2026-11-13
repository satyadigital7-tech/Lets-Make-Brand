import React from "react";
import { Users, Building, ShieldCheck, UserCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function SuperAdminTeamsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { data: teamsData } = await adminClient
    .from("teams")
    .select(`
      id,
      team_code,
      name,
      description,
      status,
      created_at,
      vendor:vendor_id (
        id,
        business_name,
        company_name,
        full_name,
        vendor_id_code
      ),
      leader:leader_id (
        id,
        full_name,
        email,
        phone
      ),
      team_members (
        id,
        status
      )
    `)
    .order("created_at", { ascending: false });

  const rawTeams = (teamsData as any[]) || [];

  const teams = rawTeams.map((t) => {
    const vendorObj = Array.isArray(t.vendor) ? t.vendor[0] : t.vendor;
    const leaderObj = Array.isArray(t.leader) ? t.leader[0] : t.leader;
    const activeMemberCount = Array.isArray(t.team_members)
      ? t.team_members.filter((m: any) => m.status === "active").length
      : 0;

    return {
      id: t.id,
      teamCode: t.team_code,
      name: t.name,
      description: t.description,
      status: t.status,
      vendorName: vendorObj?.business_name || vendorObj?.company_name || vendorObj?.full_name || "Merchant Brand",
      vendorIdCode: vendorObj?.vendor_id_code || null,
      leaderName: leaderObj?.full_name || null,
      leaderEmail: leaderObj?.email || null,
      memberCount: activeMemberCount,
      createdAt: t.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Team Directory & Squad Oversight"
        description="Monitor vendor sales squads, assigned Team Leaders, and promotional capacity across the platform."
        badge={`${teams.length} Registered Teams`}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Platform Teams Overview
          </CardTitle>
          <CardDescription className="text-xs">
            Teams strictly belong to their creating vendor and are isolated via Row Level Security
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {teams.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Code</TableHead>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Owning Merchant / Vendor</TableHead>
                    <TableHead>Team Leader</TableHead>
                    <TableHead>Active Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                        {team.teamCode}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-xs text-slate-900 block">
                          {team.name}
                        </span>
                        {team.description && (
                          <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                            {team.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold">
                          <Building className="h-3.5 w-3.5 text-blue-600" />
                          <span>{team.vendorName}</span>
                        </div>
                        {team.vendorIdCode && (
                          <span className="text-[10px] font-mono text-slate-400 block pl-5">
                            {team.vendorIdCode}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {team.leaderName ? (
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{team.leaderName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No Leader Assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">
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
              No teams established yet across any merchant vendors.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

