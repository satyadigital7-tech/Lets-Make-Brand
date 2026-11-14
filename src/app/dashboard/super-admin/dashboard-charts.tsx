"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Calendar,
  CreditCard,
  Megaphone,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface MonthlyMetric {
  month: string;
  vendors: number;
  partners: number;
  commission: number;
  withdrawals: number;
}

export interface CampaignPerfMetric {
  title: string;
  category: string;
  totalLeads: number;
  approvedLeads: number;
  conversionRate: number;
}

interface DashboardChartsProps {
  monthlyMetrics: MonthlyMetric[];
  campaignMetrics: CampaignPerfMetric[];
  leadsBreakdown: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  };
  financialSummary: {
    totalCommission: number;
    totalWithdrawn: number;
    totalPendingWithdrawals: number;
  };
}

export function SuperAdminDashboardCharts({
  monthlyMetrics,
  campaignMetrics,
  leadsBreakdown,
  financialSummary,
}: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<"growth" | "campaigns" | "financials">("growth");

  const approvedPercent = leadsBreakdown.total > 0
    ? Math.round((leadsBreakdown.approved / leadsBreakdown.total) * 100)
    : 0;
  const rejectedPercent = leadsBreakdown.total > 0
    ? Math.round((leadsBreakdown.rejected / leadsBreakdown.total) * 100)
    : 0;
  const pendingPercent = leadsBreakdown.total > 0
    ? Math.round((leadsBreakdown.pending / leadsBreakdown.total) * 100)
    : 0;

  const maxCommission = Math.max(...monthlyMetrics.map((m) => m.commission), 100);

  return (
    <div className="space-y-6">
      {/* Chart Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("growth")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "growth"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Network Growth & Registrations
          </button>
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "campaigns"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Campaign Performance & Leads
          </button>
          <button
            onClick={() => setActiveTab("financials")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === "financials"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Commissions & Cashflow
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-medium hidden sm:flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>Real-time PostgreSQL aggregation</span>
        </div>
      </div>

      {/* Tab 1: Network Growth Trends */}
      {activeTab === "growth" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Monthly Partner Registrations</span>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  Affiliates & Squads
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Monthly onboarding velocity for independent partners and sales teams
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-44 flex items-end gap-3 pt-6 pb-2 border-b border-slate-100">
                {monthlyMetrics.map((item, idx) => {
                  const maxPartners = Math.max(...monthlyMetrics.map((m) => m.partners), 10);
                  const barHeight = Math.max(Math.round((item.partners / maxPartners) * 100), 12);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.partners}
                      </div>
                      <div
                        style={{ height: `${barHeight}%` }}
                        className="w-full max-w-[32px] bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-md transition-all group-hover:brightness-110 shadow-sm"
                      />
                      <span className="text-[10px] font-medium text-slate-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Total onboarded partners</span>
                <span className="font-bold text-slate-800">
                  {monthlyMetrics.reduce((sum, m) => sum + m.partners, 0)} Members
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Monthly Vendor Agency Registrations</span>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  Brand Merchants
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Acquisition of new merchants and performance advertisers
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-44 flex items-end gap-3 pt-6 pb-2 border-b border-slate-100">
                {monthlyMetrics.map((item, idx) => {
                  const maxVendors = Math.max(...monthlyMetrics.map((m) => m.vendors), 5);
                  const barHeight = Math.max(Math.round((item.vendors / maxVendors) * 100), 12);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.vendors}
                      </div>
                      <div
                        style={{ height: `${barHeight}%` }}
                        className="w-full max-w-[32px] bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-md transition-all group-hover:brightness-110 shadow-sm"
                      />
                      <span className="text-[10px] font-medium text-slate-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Total registered brands</span>
                <span className="font-bold text-slate-800">
                  {monthlyMetrics.reduce((sum, m) => sum + m.vendors, 0)} Brands
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Campaigns & Leads Quality Breakdown */}
      {activeTab === "campaigns" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Active Campaign Performance Benchmarks</span>
                <Megaphone className="h-4 w-4 text-emerald-600" />
              </CardTitle>
              <CardDescription className="text-xs">
                Real lead conversion ratios across top live promotion campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {campaignMetrics.length > 0 ? (
                campaignMetrics.slice(0, 5).map((camp, idx) => (
                  <div key={idx} className="space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate max-w-[240px]">{camp.title}</span>
                      <span className="font-mono text-emerald-600 font-bold">{camp.conversionRate}% Conv.</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                      <div
                        style={{ width: `${Math.min(camp.conversionRate, 100)}%` }}
                        className="bg-emerald-500 h-full rounded-full transition-all"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Category: {camp.category}</span>
                      <span>
                        {camp.approvedLeads} / {camp.totalLeads} Leads Approved
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">No campaign metrics recorded.</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Lead Approval vs Rejection</span>
                <PieChart className="h-4 w-4 text-blue-600" />
              </CardTitle>
              <CardDescription className="text-xs">
                Fraud prevention & qualification status
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Stacked Percentage Bar */}
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
                <div
                  style={{ width: `${approvedPercent}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Approved: ${approvedPercent}%`}
                />
                <div
                  style={{ width: `${rejectedPercent}%` }}
                  className="bg-red-500 h-full transition-all"
                  title={`Rejected: ${rejectedPercent}%`}
                />
                <div
                  style={{ width: `${pendingPercent}%` }}
                  className="bg-amber-400 h-full transition-all"
                  title={`Under Review: ${pendingPercent}%`}
                />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-medium">Approved Leads</span>
                  </div>
                  <span className="font-bold font-mono">
                    {leadsBreakdown.approved} ({approvedPercent}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 text-red-800">
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                    <span className="font-medium">Rejected / Duplicate</span>
                  </div>
                  <span className="font-bold font-mono">
                    {leadsBreakdown.rejected} ({rejectedPercent}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 text-amber-800">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    <span className="font-medium">Pending Review</span>
                  </div>
                  <span className="font-bold font-mono">
                    {leadsBreakdown.pending} ({pendingPercent}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Commission & Financial Overview */}
      {activeTab === "financials" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Monthly Commission Generated</span>
                <Badge variant="secondary" className="font-mono text-emerald-700 bg-emerald-50">
                  Double-Entry Ledger
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Gross performance commissions calculated from approved partner leads
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-44 flex items-end gap-3 pt-6 pb-2 border-b border-slate-100">
                {monthlyMetrics.map((item, idx) => {
                  const barHeight = Math.max(Math.round((item.commission / maxCommission) * 100), 10);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        ${item.commission}
                      </div>
                      <div
                        style={{ height: `${barHeight}%` }}
                        className="w-full max-w-[32px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md transition-all group-hover:brightness-110 shadow-sm"
                      />
                      <span className="text-[10px] font-medium text-slate-500">{item.month}</span>
                    </div>
                  );
                })}
              </div>
              <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Total platform commissions</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">
                  ${financialSummary.totalCommission.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Withdrawals & Payout Treasury</span>
                <CreditCard className="h-4 w-4 text-blue-600" />
              </CardTitle>
              <CardDescription className="text-xs">
                Disbursements verified via external corporate banking UTRs
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-slate-500 font-medium">Total Paid Out</span>
                  <div className="text-xl font-black text-slate-900 font-mono">
                    ${financialSummary.totalWithdrawn.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Reconciled</span>
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                  <span className="text-blue-600 font-medium">Pending Requests</span>
                  <div className="text-xl font-black text-blue-900 font-mono">
                    {financialSummary.totalPendingWithdrawals}
                  </div>
                  <span className="text-[10px] text-blue-500 font-semibold">
                    Awaiting UTR entry
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-700" />
                  <span>Strict Manual Bank Disbursement Policy</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  In compliance with Phase 7 financial security requirements, automated payout APIs remain inactive. All payments require manual banking settlement and UTR validation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

