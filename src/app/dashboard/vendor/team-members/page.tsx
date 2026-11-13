import React from "react";
import { Users, Mail, Phone, Calendar, Building } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function VendorTeamMembersPage() {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  // 1. Fetch vendor's teams
  const { data: teamsData } = await adminClient
    .from("teams")
    .select("id, name, team_code")
    .eq("vendor_id", currentVendor.id);

  const teamIds = ((teamsData as any[]) || []).map((t: any) => t.id);
  const teamMap: Record<string, { name: string; code: string }> = {};
  for (const t of (teamsData as any[]) || []) {
    teamMap[t.id] = { name: t.name, code: t.team_code };
  }

  // 2. Fetch team members in these teams
  let membersList: any[] = [];
  if (teamIds.length > 0) {
    const { data: membersData } = await adminClient
      .from("team_members")
      .select(`
        id,
        team_id,
        user_id,
        role_in_team,
        status,
        joined_at,
        profiles:user_id (
          id,
          full_name,
          email,
          mobile,
          phone,
          partner_id_code,
          status
        )
      `)
      .in("team_id", teamIds)
      .eq("status", "active")
      .order("joined_at", { ascending: false });

    membersList = (membersData as any[]) || [];
  }

  const members = membersList.map((m) => {
    const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    const team = teamMap[m.team_id] || { name: "Squad", code: "N/A" };

    return {
      id: m.id,
      userId: m.user_id,
      name: prof?.full_name || "Squad Partner",
      email: prof?.email || "partner@squad.com",
      phone: prof?.mobile || prof?.phone || "N/A",
      partnerIdCode: prof?.partner_id_code || null,
      teamName: team.name,
      teamCode: team.code,
      roleInTeam: m.role_in_team,
      status: m.status,
      joinedAt: m.joined_at,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad Members Directory"
        description="All promotional partners active within your brand's promotional squads."
        badge={`${members.length} Active Members`}
      />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Enrolled Squad Members
          </CardTitle>
          <CardDescription className="text-xs">
            Members can execute promotional campaigns and track referral conversions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {members.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner Name</TableHead>
                    <TableHead>Partner ID</TableHead>
                    <TableHead>Squad Assignment</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role in Squad</TableHead>
                    <TableHead>Joined Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-bold text-xs text-slate-900">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-blue-600" />
                          <span>{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                        {member.partnerIdCode || (
                          <span className="text-slate-400 font-normal italic">Pending ID</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-xs text-slate-800 block">
                          {member.teamName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 block">
                          {member.teamCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {member.email}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {member.phone}
                      </TableCell>
                      <TableCell>
                        {member.roleInTeam === "leader" ? (
                          <Badge variant="brand" className="text-[10px]">Leader</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">Member</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(member.joinedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              No members enrolled in your squads yet. Dispatch invitations to build your team.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

