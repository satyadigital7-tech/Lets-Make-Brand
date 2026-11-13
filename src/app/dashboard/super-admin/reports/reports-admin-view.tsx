"use client";

import React, { useState, useTransition } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  Megaphone,
  Filter,
  DollarSign,
  ShieldCheck,
  LifeBuoy,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlatformReportMetrics } from "@/lib/services/reports";
import { exportReportAction } from "./actions";

interface ReportsAdminViewProps {
  initialMetrics: PlatformReportMetrics;
  recentExports: {
    id: string;
    exportCode: string;
    reportType: string;
    exportFormat: string;
    rowCount: number;
    createdAt: string;
  }[];
}

export function ReportsAdminView({ initialMetrics, recentExports }: ReportsAdminViewProps) {
  const [metrics, setMetrics] = useState<PlatformReportMetrics>(initialMetrics);
  const [exportsList, setExportsList] = useState(recentExports);
  const [selectedReportType, setSelectedReportType] = useState<"users" | "campaigns" | "leads" | "financial" | "kyc" | "support">("financial");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isPending, startTransition] = useTransition();
  const [exportingFormat, setExportingFormat] = useState<"csv" | "pdf" | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amt);
  };

  const handleExport = (format: "csv" | "pdf") => {
    setErrorMsg(null);
    setFeedbackMsg(null);
    setExportingFormat(format);

    startTransition(async () => {
      try {
        const result = await exportReportAction({
          reportType: selectedReportType as any,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          format,
        });

        if (result.success) {
          if (format === "pdf" && result.base64) {
            const link = document.createElement("a");
            link.href = `data:application/pdf;base64,${result.base64}`;
            link.download = `LMB_${selectedReportType}_Report_${result.exportCode}.pdf`;
            link.click();
            setFeedbackMsg(`Official Executive PDF Report (${result.exportCode}) generated and downloaded!`);
          } else if (format === "csv" && result.csvContent) {
            const blob = new Blob([result.csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `LMB_${selectedReportType}_Data_${result.exportCode}.csv`;
            link.click();
            setFeedbackMsg(`CSV Report (${result.exportCode}) generated with ${result.rowCount} rows!`);
          }

          // Prepend export to list
          setExportsList((prev) => [
            {
              id: `exp-${Date.now()}`,
              exportCode: result.exportCode,
              reportType: selectedReportType,
              exportFormat: format,
              rowCount: format === "csv" ? (result as any).rowCount || 14 : 14,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to generate report export.");
      } finally {
        setExportingFormat(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Date Filter & Export Controls Bar */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Date Range:</span>
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs h-8 w-36"
            />
            <span className="text-xs text-slate-400">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs h-8 w-36"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value as any)}
              className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-bold"
            >
              <option value="financial">Financial Treasury</option>
              <option value="leads">Lead Conversions</option>
              <option value="users">User Demographics</option>
              <option value="campaigns">Brand Campaigns</option>
              <option value="kyc">KYC Compliance</option>
              <option value="support">Support Tickets</option>
            </select>

            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleExport("csv")}
              className="text-xs h-8 gap-1 font-bold text-slate-700"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              {isPending && exportingFormat === "csv" ? "Exporting..." : "Export CSV"}
            </Button>

            <Button
              size="sm"
              disabled={isPending}
              onClick={() => handleExport("pdf")}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-8 gap-1 shadow-sm"
            >
              <FileText className="h-3.5 w-3.5 text-blue-400" />
              {isPending && exportingFormat === "pdf" ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 1. FINANCIAL TREASURY METRICS (Module 6) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            Platform Financial Treasury & Liquidity
          </h3>
          <span className="text-[10px] text-slate-400">Derived from verified commission ledger records</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Accrued Commissions
              </span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(metrics.financial.totalCommission)}
              </div>
              <span className="text-[10px] text-emerald-600 mt-0.5 block font-medium">Approved conversions</span>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Partner Direct Earnings
              </span>
              <div className="text-xl font-bold text-blue-700 mt-1">
                {formatCurrency(metrics.financial.partnerEarnings)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Affiliate base commissions</span>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Vendor Agency Overrides
              </span>
              <div className="text-xl font-bold text-indigo-700 mt-1">
                {formatCurrency(metrics.financial.vendorEarnings)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Configured split allocations</span>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-4">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Paid Disbursements
              </span>
              <div className="text-xl font-bold text-teal-700 mt-1">
                {formatCurrency(metrics.financial.totalPaidWithdrawals)}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Completed manual payouts (UTR verified)</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. USER & CAMPAIGN BREAKDOWNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Demographics */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" />
              <span>User & Account Status Overview</span>
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {metrics.users.activeAccounts} Active Accounts
            </Badge>
          </CardHeader>
          <CardContent className="p-4 divide-y divide-slate-100 text-xs">
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Enterprise Agency Vendors</span>
              <span className="font-bold text-slate-900">{metrics.users.totalVendors}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Brand Promotion Partners & Members</span>
              <span className="font-bold text-slate-900">{metrics.users.totalPartners}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Pending Onboarding Approvals</span>
              <span className="font-bold text-amber-600">{metrics.users.pendingAccounts}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Suspended / Inactive Accounts</span>
              <span className="font-bold text-rose-600">{metrics.users.suspendedAccounts}</span>
            </div>
          </CardContent>
        </Card>

        {/* Lead Conversion Pipeline */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-emerald-600" />
              <span>Lead Verification & Anti-Fraud Audit</span>
            </CardTitle>
            <Badge variant="success" className="text-[10px]">
              {metrics.leads.approvedLeads} Approved
            </Badge>
          </CardHeader>
          <CardContent className="p-4 divide-y divide-slate-100 text-xs">
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Total Customer Inquiries Logged</span>
              <span className="font-bold text-slate-900">{metrics.leads.totalLeads}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Approved Conversions</span>
              <span className="font-bold text-emerald-700">{metrics.leads.approvedLeads}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">In Verification Pipeline</span>
              <span className="font-bold text-amber-600">{metrics.leads.pendingLeads}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-slate-600">Duplicate Inquiries Flagged & Blocked</span>
              <span className="font-bold text-rose-600">{metrics.leads.duplicateLeads}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. RECENT EXPORT AUDIT LOGS (Module 6 & 8) */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="p-4 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Download className="h-4 w-4 text-slate-500" />
            <span>Authorized Export History (Audit Log)</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Cryptographic references for generated analytics files.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Export Code</th>
                <th className="py-3 px-4">Report Type</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Rows Included</th>
                <th className="py-3 px-4">Generated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exportsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No export history recorded yet. Use the export buttons above to download reports.
                  </td>
                </tr>
              ) : (
                exportsList.slice(0, 10).map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {exp.exportCode}
                    </td>
                    <td className="py-2.5 px-4 capitalize text-slate-700">
                      {exp.reportType}
                    </td>
                    <td className="py-2.5 px-4 font-bold uppercase text-blue-700 text-[10px]">
                      {exp.exportFormat}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {exp.rowCount} records
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                      {new Date(exp.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
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
