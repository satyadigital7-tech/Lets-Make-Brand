import React from "react";
import { Users2, Shield, Building, Mail, Phone, Calendar, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function TeamLeaderTeamPage() {
  const currentLeader = await requireRole(["team_leader", "super_admin"]);
  const adminClient = createAdminClient();

  // 1. Fetch assigned team where user is appointed as leader
  const { data: teamData } = await adminClient
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
      team_members (
        id,
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
      )
    `)
    .eq("leader_id", currentLeader.id)
    .maybeSingle();

  const vendorObj = teamData ? (Array.isArray(teamData.vendor) ? teamData.vendor[0] : teamData.vendor) : null;
  const rawMembers = teamData?.team_members ? (teamData.team_members as any[]) : [];

  const members = rawMembers
    .filter((m) => m.status === "active")
    .map((m) => {
      const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return {
        id: m.id,
        userId: m.user_id,
        fullName: prof?.full_name || "Squad Member",
        email: prof?.email || "member@squad.com",
        phone: prof?.mobile || prof?.phone || "N/A",
        partnerIdCode: prof?.partner_id_code || null,
        roleInTeam: m.role_in_team,
        joinedAt: m.joined_at,
      };
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assigned Squad & Supervised Members"
        description="Monitor promotional workforce allocation and member performance under your supervisory leadership."
        badge={teamData ? `Squad: ${teamData.team_code}` : "Unassigned"}
      />

      {/* Mandatory Module 7 Governance Banner */}
      <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>TEAM LEADER GOVERNANCE & EARNING RESTRICTIONS (MODULE 7)</span>
        </div>
        <p className="text-xs text-amber-800/90 leading-relaxed">
          As an appointed Team Leader, you have supervisory oversight of your assigned squad and authorized members. 
          In accordance with platform security and compliance rules, Team Leaders <strong>cannot submit personal earning leads</strong>, 
          <strong>cannot receive Partner commissions</strong>, and <strong>cannot manage other vendors or teams</strong>.
        </p>
      </div>

      {teamData ? (
        <div className="space-y-6">
          {/* Squad Info Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      {teamData.name}
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-xs text-blue-700">
                      {teamData.team_code}
                    </Badge>
                  </div>
                  {teamData.description && (
                    <CardDescription className="text-xs mt-1">
                      {teamData.description}
                    </CardDescription>
                  )}
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold justify-end">
                    <Building className="h-3.5 w-3.5 text-blue-600" />
                    <span>
                      Owning Brand: {vendorObj?.business_name || vendorObj?.company_name || "Vendor"}
                    </span>
                  </div>
                  {vendorObj?.vendor_id_code && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {vendorObj.vendor_id_code}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-4">
                <span>
                  Active Members: <strong className="text-blue-700">{members.length}</strong>
                </span>
                <span>
                  Status: <strong className="capitalize text-emerald-700">{teamData.status}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 font-mono">
                <Calendar className="h-3.5 w-3.5" />
                <span>Established {formatDate(teamData.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Members Table */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Authorized Squad Members ({members.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Members operating under your squad supervision
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
                            {member.fullName}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                            {member.partnerIdCode || (
                              <span className="text-slate-400 font-normal italic">Pending ID</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono">
                            {member.email}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500 font-mono">
                            {member.phone}
                          </TableCell>
                          <TableCell>
                            {member.roleInTeam === "leader" ? (
                              <Badge variant="brand" className="text-[10px]">Leader (You)</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">Promotional Member</Badge>
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
                <div className="p-8 text-center text-xs text-slate-400">
                  No promotional partners enrolled in your squad yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed border-slate-200">
          <CardContent className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Users2 className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="font-bold text-slate-700">No Squad Assigned Yet</p>
            <p className="text-slate-400">
              You are registered as a Team Leader. Your merchant brand will appoint you to lead an active promotional squad.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
