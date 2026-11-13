import React from "react";
import { Shield, Mail, Phone, Users, Calendar } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function VendorTeamLeadersPage() {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  // Fetch all teams of this vendor that have a leader assigned
  const { data: teamsData } = await adminClient
    .from("teams")
    .select(`
      id,
      name,
      team_code,
      leader_id,
      created_at,
      leader:leader_id (
        id,
        full_name,
        email,
        phone,
        mobile,
        status,
        created_at
      ),
      team_members (
        id,
        status
      )
    `)
    .eq("vendor_id", currentVendor.id)
    .not("leader_id", "is", null);

  const rawTeams = (teamsData as any[]) || [];

  const leaders = rawTeams.map((t) => {
    const leaderObj = Array.isArray(t.leader) ? t.leader[0] : t.leader;
    const memberCount = Array.isArray(t.team_members)
      ? t.team_members.filter((m: any) => m.status === "active").length
      : 0;

    return {
      id: leaderObj?.id || t.leader_id,
      name: leaderObj?.full_name || "Team Leader",
      email: leaderObj?.email || "leader@squad.com",
      phone: leaderObj?.mobile || leaderObj?.phone || "N/A",
      status: leaderObj?.status || "active",
      teamName: t.name,
      teamCode: t.team_code,
      teamId: t.id,
      squadMemberCount: memberCount,
      appointedAt: t.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointed Team Leaders"
        description="Review designated supervisors leading your brand's promotional squads."
        badge={`${leaders.length} Appointed Leaders`}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Supervisor Directory
          </CardTitle>
          <CardDescription className="text-xs">
            Team Leaders supervise squad promotional activities (Earning leads restricted per Module 7)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {leaders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supervisor Name</TableHead>
                    <TableHead>Assigned Squad</TableHead>
                    <TableHead>Squad Members</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Appointed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaders.map((lead) => (
                    <TableRow key={lead.teamId} className="hover:bg-slate-50/80">
                      <TableCell className="font-bold text-xs text-slate-900">
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-blue-600" />
                          <span>{lead.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-xs text-slate-800 block">
                          {lead.teamName}
                        </span>
                        <span className="font-mono text-[10px] text-blue-700 block">
                          {lead.teamCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        <span className="font-bold text-blue-600">{lead.squadMemberCount}</span>{" "}
                        active
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {lead.email}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {lead.phone}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={lead.status === "active" ? "success" : "secondary"}
                          className="text-[10px]"
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(lead.appointedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              No Team Leaders appointed yet. Assign or invite a leader in Squad & Team Management.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

