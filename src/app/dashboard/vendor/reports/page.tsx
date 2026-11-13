import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Users, DollarSign, Filter, Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VendorReportsPage() {
  const user = await requireRole(["vendor", "super_admin"]);
  const adminClient = createAdminClient();

  // 1. Fetch vendor campaigns
  const { data: campaigns } = await adminClient
    .from("campaigns")
    .select("id, name, status")
    .eq("created_by", user.id);

  // 2. Fetch vendor teams
  const { data: teams } = await adminClient
    .from("teams")
    .select("id, name, status")
    .eq("vendor_id", user.id);

  // 3. Fetch vendor leads
  const { data: leads } = await adminClient
    .from("leads")
    .select("id, status, commission_amount, is_duplicate")
    .eq("vendor_id", user.id);

  // 4. Fetch vendor overrides from commission_transactions
  const { data: commissions } = await adminClient
    .from("commission_transactions")
    .select("commission_amount, transaction_type, commission_status")
    .eq("vendor_id", user.id);

  let totalOverrides = 0;
  for (const c of (commissions as any[]) || []) {
    const amt = Number(c.commission_amount || 0);
    if (c.transaction_type === "credit" && c.commission_status === "approved") {
      totalOverrides += amt;
    } else if (c.transaction_type === "reversal") {
      totalOverrides -= amt;
    }
  }

  const totalLeadsCount = leads?.length || 0;
  const approvedLeadsCount = leads?.filter((l) => l.status === "approved").length || 0;
  const duplicateCount = leads?.filter((l) => l.is_duplicate).length || 0;
  const activeTeamsCount = teams?.filter((t) => t.status === "active").length || 0;

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Analytics & Performance Reports"
        description="Comprehensive real-time reporting across your promotional campaigns, promotional squad performance, and earned overrides."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Agency Overrides
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalOverrides)}
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">Verified earnings</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active Marketing Squads
            </span>
            <div className="text-xl font-bold text-blue-700 mt-1">
              {activeTeamsCount}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Managed teams</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Approved Team Leads
            </span>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              {approvedLeadsCount} / {totalLeadsCount}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Total verified conversions</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Duplicate Discrepancies
            </span>
            <div className="text-xl font-bold text-rose-600 mt-1">
              {duplicateCount}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Filtered anti-fraud inquiries</span>
          </CardContent>
        </Card>
      </div>

      {/* Squad Performance Table */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Promotional Teams Breakdown
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Actual performance data aggregated from your agency squads.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Squad Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Campaigns Deployed</th>
                <th className="py-3 px-4 text-right">Accreditation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!teams || teams.length === 0) ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No marketing teams created yet.
                  </td>
                </tr>
              ) : (
                teams.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{t.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant={t.status === "active" ? "success" : "outline"} className="text-[10px] font-bold capitalize">
                        {t.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{campaigns?.length || 0} Campaigns</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">Active Squad</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
