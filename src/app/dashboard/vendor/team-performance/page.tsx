import React from "react";
import { LineChart, Users, Shield, Megaphone, CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default async function VendorTeamPerformancePage() {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  // 1. Fetch vendor's teams
  const { data: teamsData } = await adminClient
    .from("teams")
    .select(`
      id,
      name,
      team_code,
      team_members (
        id,
        user_id,
        status,
        profiles:user_id (
          id,
          full_name,
          email
        )
      )
    `)
    .eq("vendor_id", currentVendor.id);

  // 2. Fetch leads belonging to this vendor
  const { data: leadsData } = await adminClient
    .from("leads")
    .select(`
      id,
      status,
      is_duplicate,
      commission_amount,
      submitted_by,
      campaign_id,
      team_id,
      created_at,
      campaign:campaign_id (title)
    `)
    .eq("vendor_id", currentVendor.id);

  const rawTeams = (teamsData as any[]) || [];
  const rawLeads = (leadsData as any[]) || [];

  // 3. Compute Real Database Metrics (Module 9)
  let totalMembers = 0;
  const memberMap = new Map<string, { name: string; email: string; squadName: string }>();

  for (const t of rawTeams) {
    const activeMembers = Array.isArray(t.team_members)
      ? t.team_members.filter((m: any) => m.status === "active")
      : [];

    totalMembers += activeMembers.length;

    for (const m of activeMembers) {
      const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      if (prof) {
        memberMap.set(prof.id, {
          name: prof.full_name || prof.email,
          email: prof.email,
          squadName: t.name,
        });
      }
    }
  }

  let pendingLeads = 0;
  let approvedLeads = 0;
  let rejectedLeads = 0;
  let duplicateLeads = 0;

  // Member-wise aggregation
  const memberStats = new Map<
    string,
    { name: string; squad: string; total: number; approved: number; rejected: number; pending: number }
  >();

  // Campaign-wise aggregation
  const campaignStats = new Map<
    string,
    { title: string; total: number; approved: number; payout: number }
  >();

  for (const l of rawLeads) {
    const isDup = l.is_duplicate || l.status === "duplicate";

    if (isDup) duplicateLeads++;
    else if (l.status === "pending" || l.status === "under_verification") pendingLeads++;
    else if (l.status === "approved") approvedLeads++;
    else if (l.status === "rejected") rejectedLeads++;

    // Member aggregation
    if (l.submitted_by) {
      const memberInfo = memberMap.get(l.submitted_by) || {
        name: "Partner",
        email: "",
        squadName: "Direct",
      };
      if (!memberStats.has(l.submitted_by)) {
        memberStats.set(l.submitted_by, {
          name: memberInfo.name,
          squad: memberInfo.squadName,
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
        });
      }
      const ms = memberStats.get(l.submitted_by)!;
      ms.total++;
      if (l.status === "approved") ms.approved++;
      else if (l.status === "rejected") ms.rejected++;
      else if (l.status === "pending" || l.status === "under_verification") ms.pending++;
    }

    // Campaign aggregation
    if (l.campaign_id) {
      const campObj = Array.isArray(l.campaign) ? l.campaign[0] : l.campaign;
      const campTitle = campObj?.title || "Campaign";

      if (!campaignStats.has(l.campaign_id)) {
        campaignStats.set(l.campaign_id, {
          title: campTitle,
          total: 0,
          approved: 0,
          payout: 0,
        });
      }
      const cs = campaignStats.get(l.campaign_id)!;
      cs.total++;
      if (l.status === "approved") {
        cs.approved++;
        cs.payout += Number(l.commission_amount || 0);
      }
    }
  }

  const memberBreakdown = Array.from(memberStats.values());
  const campaignBreakdown = Array.from(campaignStats.values());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad Analytics & Performance Metrics"
        description="Real database metrics tracking promotional workforce allocation, conversion funnel progression, and member attributions."
        badge="Live PostgreSQL Records"
      />

      {/* Primary KPI Grid (Module 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Members</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{totalMembers}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-blue-600 block">Total Leads</span>
            <span className="text-xl font-bold text-blue-800 mt-1 block">{rawLeads.length}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600 block">Pending Leads</span>
            <span className="text-xl font-bold text-amber-700 mt-1 block">{pendingLeads}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Approved Leads</span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">{approvedLeads}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-600 block">Rejected Leads</span>
            <span className="text-xl font-bold text-rose-700 mt-1 block">{rejectedLeads}</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Duplicate Leads</span>
            <span className="text-xl font-bold text-slate-700 mt-1 block">{duplicateLeads}</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Member-Wise Performance (Module 9) */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Member-Wise Performance Attribution
            </CardTitle>
            <CardDescription className="text-xs">
              Promotional lead conversions segmented per individual squad partner
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {memberBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Squad</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberBreakdown.map((m, idx) => {
                      const rate = m.total > 0 ? Math.round((m.approved / m.total) * 100) : 0;
                      return (
                        <TableRow key={idx} className="hover:bg-slate-50/80">
                          <TableCell className="font-bold text-xs text-slate-900">
                            {m.name}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {m.squad}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-slate-800">
                            {m.total}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-emerald-700">
                            {m.approved}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-blue-700">
                            {rate}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No member lead submissions recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign-Wise Performance (Module 9) */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Campaign-Wise Performance Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Lead volume and verified commission totals across promotional campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {campaignBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Total Leads</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Verified Payout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignBreakdown.map((c, idx) => (
                      <TableRow key={idx} className="hover:bg-slate-50/80">
                        <TableCell className="font-bold text-xs text-slate-900">
                          {c.title}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-800">
                          {c.total}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-emerald-700">
                          {c.approved}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-emerald-800">
                          {formatCurrency(c.payout)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No campaign performance records available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
