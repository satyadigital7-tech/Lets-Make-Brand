import React from "react";
import { Filter, AlertTriangle, Shield, CheckCircle2, Clock, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default async function TeamLeaderLeadsPage() {
  const currentLeader = await requireRole(["team_leader", "super_admin"]);
  const adminClient = createAdminClient();

  // 1. Find squad where current user is appointed as leader
  const { data: teamData } = await adminClient
    .from("teams")
    .select("id, name, team_code")
    .eq("leader_id", currentLeader.id)
    .maybeSingle();

  let leads: any[] = [];

  if (teamData) {
    // 2. Fetch leads belonging strictly to this assigned squad (Module 8 & RLS)
    const { data: teamLeads } = await adminClient
      .from("leads")
      .select(`
        id,
        lead_code,
        customer_name,
        customer_mobile,
        customer_email,
        customer_location,
        status,
        is_duplicate,
        created_at,
        campaign:campaign_id (title),
        submitter:submitted_by (full_name, email)
      `)
      .eq("team_id", teamData.id)
      .order("created_at", { ascending: false });

    leads = (teamLeads as any[]) || [];
  }

  const getStatusBadge = (status: string, isDup: boolean) => {
    if (isDup || status === "duplicate") {
      return (
        <Badge variant="destructive" className="text-[10px] gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Duplicate</span>
        </Badge>
      );
    }
    switch (status) {
      case "approved":
        return <Badge variant="success" className="text-[10px]">Approved</Badge>;
      case "pending":
        return <Badge variant="warning" className="text-[10px]">Pending Verification</Badge>;
      case "under_verification":
        return <Badge variant="brand" className="text-[10px]">Under Review</Badge>;
      case "correction_requested":
        return <Badge variant="outline" className="text-[10px] text-amber-700">Action Required</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad Promotional Leads Oversight"
        description="Monitor lead submissions delivered by authorized members of your promotional squad."
        badge={teamData ? `${teamData.team_code} (${leads.length} Leads)` : "Squad Oversight"}
      />

      {/* Mandatory Module 7 & 13 Restriction Notice */}
      <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>MODULE 7 & 13 GOVERNANCE: PERSONAL LEAD SUBMISSION STRICTLY RESTRICTED</span>
        </div>
        <p className="text-xs text-amber-800/90 leading-relaxed">
          Team Leaders exercise supervisory monitoring rights over team leads but <strong>cannot submit personal earning leads</strong> 
          or receive partner commissions. This separation guarantees impartial squad supervision.
        </p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            {teamData ? `Squad Lead Activity: ${teamData.name}` : "Assigned Squad Leads"}
          </CardTitle>
          <CardDescription className="text-xs">
            Inbound customer applications submitted by members of your supervised squad
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {leads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking Code</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Promotional Campaign</TableHead>
                    <TableHead>Customer Mobile</TableHead>
                    <TableHead>Squad Member Promoter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => {
                    const campObj = Array.isArray(lead.campaign) ? lead.campaign[0] : lead.campaign;
                    const subObj = Array.isArray(lead.submitter) ? lead.submitter[0] : lead.submitter;

                    return (
                      <TableRow key={lead.id} className="hover:bg-slate-50/80">
                        <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                          {lead.lead_code}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-xs text-slate-900 block">
                            {lead.customer_name}
                          </span>
                          {lead.customer_location && (
                            <span className="text-[11px] text-slate-400 block">
                              {lead.customer_location}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-800 font-medium">
                          {campObj?.title || "Campaign"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {lead.customer_mobile}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-800">
                          {subObj?.full_name || subObj?.email || "Member"}
                        </TableCell>
                        <TableCell>{getStatusBadge(lead.status, lead.is_duplicate)}</TableCell>
                        <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                          {formatDate(lead.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Clock className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="font-bold text-slate-700">No squad leads submitted yet</p>
              <p className="text-slate-400">
                Customer leads submitted by your squad members will populate here for supervision.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
