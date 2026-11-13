"use client";

import React, { useState, useTransition } from "react";
import {
  Percent,
  Search,
  Filter,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Megaphone,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { saveCommissionRuleAction, reverseCommissionAction } from "./actions";

export interface CommissionTransactionItem {
  id: string;
  transactionCode: string;
  leadId: string;
  leadCode: string;
  campaignId: string;
  campaignTitle: string;
  vendorId: string | null;
  vendorName: string | null;
  partnerId: string;
  partnerName: string;
  teamId: string | null;
  teamName: string | null;
  userId: string;
  beneficiaryName: string;
  beneficiaryRole: "partner" | "vendor";
  commissionAmount: number;
  transactionType: "credit" | "debit" | "reversal" | "adjustment";
  commissionStatus: "pending" | "approved" | "paid" | "reversed";
  referenceCode: string;
  description: string | null;
  createdAt: string;
}

export interface CampaignRuleItem {
  campaignId: string;
  campaignTitle: string;
  campaignCode: string;
  brandName: string;
  maxCommissionAmount: number;
  partnerDefaultCommission: number;
  vendorMaxCommission: number;
  independentPartnerCommission: number;
  isActive: boolean;
  version: number;
  updatedAt: string;
}

export interface CommissionOverviewProps {
  transactions: CommissionTransactionItem[];
  rules: CampaignRuleItem[];
  campaignsList: { id: string; title: string; code: string }[];
  summary: {
    totalCommission: number;
    vendorCommission: number;
    partnerCommission: number;
    approvedCommission: number;
    pendingCommission: number;
    reversedCommission: number;
    totalTransactions: number;
  };
}

export function CommissionAdminView({
  transactions,
  rules,
  campaignsList,
  summary,
}: CommissionOverviewProps) {
  const [activeTab, setActiveTab] = useState<"ledger" | "rules" | "reports">("ledger");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reversal Modal State
  const [reversingTxn, setReversingTxn] = useState<CommissionTransactionItem | null>(null);
  const [reversalReason, setReversalReason] = useState("");

  // Edit Rule Modal State
  const [editingRule, setEditingRule] = useState<CampaignRuleItem | null>(null);
  const [ruleForm, setRuleForm] = useState({
    campaignId: "",
    maxCommissionAmount: 500,
    partnerDefaultCommission: 400,
    vendorMaxCommission: 100,
    independentPartnerCommission: 500,
    notes: "",
  });

  // Filter Transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.transactionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.leadCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.campaignTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || t.commissionStatus === statusFilter;
    const matchesRole = roleFilter === "all" || t.beneficiaryRole === roleFilter;
    const matchesCampaign = campaignFilter === "all" || t.campaignId === campaignFilter;

    return matchesSearch && matchesStatus && matchesRole && matchesCampaign;
  });

  const handleOpenEditRule = (rule: CampaignRuleItem) => {
    setEditingRule(rule);
    setRuleForm({
      campaignId: rule.campaignId,
      maxCommissionAmount: rule.maxCommissionAmount,
      partnerDefaultCommission: rule.partnerDefaultCommission,
      vendorMaxCommission: rule.vendorMaxCommission,
      independentPartnerCommission: rule.independentPartnerCommission,
      notes: "",
    });
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validation
    if (ruleForm.independentPartnerCommission > ruleForm.maxCommissionAmount) {
      setFeedback({
        type: "error",
        text: "Independent partner commission cannot exceed the maximum campaign limit.",
      });
      return;
    }

    if (ruleForm.partnerDefaultCommission > ruleForm.maxCommissionAmount) {
      setFeedback({
        type: "error",
        text: "Partner default commission cannot exceed the maximum campaign limit.",
      });
      return;
    }

    startTransition(async () => {
      try {
        await saveCommissionRuleAction({
          campaignId: ruleForm.campaignId,
          maxCommissionAmount: Number(ruleForm.maxCommissionAmount),
          partnerDefaultCommission: Number(ruleForm.partnerDefaultCommission),
          vendorMaxCommission: Number(ruleForm.vendorMaxCommission),
          independentPartnerCommission: Number(ruleForm.independentPartnerCommission),
          notes: ruleForm.notes || undefined,
        });

        setFeedback({ type: "success", text: "Campaign commission rule saved successfully!" });
        setEditingRule(null);
      } catch (err: any) {
        setFeedback({ type: "error", text: err?.message || "Failed to save rule." });
      }
    });
  };

  const handleExecuteReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingTxn) return;
    if (reversalReason.trim().length < 5) {
      setFeedback({ type: "error", text: "Please enter a detailed reversal justification (min 5 chars)." });
      return;
    }

    startTransition(async () => {
      try {
        await reverseCommissionAction({
          transactionId: reversingTxn.id,
          reason: reversalReason.trim(),
        });

        setFeedback({
          type: "success",
          text: `Transaction ${reversingTxn.transactionCode} reversed successfully. Compensating entry recorded.`,
        });
        setReversingTxn(null);
        setReversalReason("");
      } catch (err: any) {
        setFeedback({ type: "error", text: err?.message || "Failed to reverse transaction." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Accrued
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(summary.totalCommission)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {summary.totalTransactions} transactions
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Partner Share
            </span>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              {formatCurrency(summary.partnerCommission)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Affiliate payouts</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
              Vendor Share
            </span>
            <div className="text-xl font-bold text-blue-700 mt-1">
              {formatCurrency(summary.vendorCommission)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Agency overrides</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider block">
              Approved
            </span>
            <div className="text-xl font-bold text-teal-700 mt-1">
              {formatCurrency(summary.approvedCommission)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Ready for settlement</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
              Pending
            </span>
            <div className="text-xl font-bold text-amber-700 mt-1">
              {formatCurrency(summary.pendingCommission)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Awaiting review</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
              Reversed
            </span>
            <div className="text-xl font-bold text-rose-700 mt-1">
              {formatCurrency(summary.reversedCommission)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Compensated audit entries</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Button
          variant={activeTab === "ledger" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("ledger")}
          className="gap-2 text-xs font-semibold"
        >
          <Percent className="h-3.5 w-3.5" />
          <span>Commission Ledger</span>
          <Badge variant="outline" className="ml-1 text-[10px]">
            {transactions.length}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "rules" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("rules")}
          className="gap-2 text-xs font-semibold"
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Campaign Rules & Caps</span>
          <Badge variant="outline" className="ml-1 text-[10px]">
            {rules.length}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "reports" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("reports")}
          className="gap-2 text-xs font-semibold"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Financial Reports</span>
        </Button>
      </div>

      {/* TAB 1: IMMUTABLE COMMISSION LEDGER (Module 8) */}
      {activeTab === "ledger" && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Immutable Financial Commission Ledger
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Append-only financial records protected by database-level triggers. Direct updates/deletes prohibited.
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-56">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search code, lead, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-xs h-8 bg-slate-50"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="reversed">Reversed</option>
              </select>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="all">All Roles</option>
                <option value="partner">Partner</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No commission transactions found matching the selected filters.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-700">Txn Code</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Lead Code</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Campaign</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Beneficiary</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Role</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Type</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-slate-50/60 text-xs">
                      <TableCell className="font-mono font-bold text-slate-900">
                        {tx.transactionCode}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-blue-600">
                        {tx.leadCode}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={tx.campaignTitle}>
                        {tx.campaignTitle}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">
                        {tx.beneficiaryName}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tx.beneficiaryRole === "vendor" ? "default" : "secondary"}
                          className="capitalize text-[10px]"
                        >
                          {tx.beneficiaryRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(tx.commissionAmount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            tx.transactionType === "credit"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : tx.transactionType === "reversal"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {tx.transactionType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            tx.commissionStatus === "approved"
                              ? "bg-teal-50 text-teal-700"
                              : tx.commissionStatus === "reversed"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {tx.commissionStatus}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-[11px]">
                        {formatDate(tx.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {tx.transactionType !== "reversal" && tx.commissionStatus !== "reversed" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReversingTxn(tx);
                              setReversalReason("");
                            }}
                            className="h-6 text-[10px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reverse
                          </Button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Reversed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: RULES & CAPS (Module 1) */}
      {activeTab === "rules" && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Super Admin Commission Rules & Caps
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Only Super Admin controls the maximum permissible campaign commission. Vendor splits can never exceed these thresholds.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="text-xs font-semibold text-slate-700">Campaign</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Brand</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Max Cap (Limit)</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Partner Default</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Vendor Max</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Independent Partner</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700">Version</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-700 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.campaignId} className="hover:bg-slate-50/60 text-xs">
                    <TableCell>
                      <div className="font-bold text-slate-900">{rule.campaignTitle}</div>
                      <div className="font-mono text-[10px] text-slate-400">{rule.campaignCode}</div>
                    </TableCell>
                    <TableCell className="text-slate-700">{rule.brandName}</TableCell>
                    <TableCell className="text-right font-extrabold text-blue-700">
                      {formatCurrency(rule.maxCommissionAmount)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-700 font-semibold">
                      {formatCurrency(rule.partnerDefaultCommission)}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 font-semibold">
                      {formatCurrency(rule.vendorMaxCommission)}
                    </TableCell>
                    <TableCell className="text-right text-teal-700 font-bold">
                      {formatCurrency(rule.independentPartnerCommission)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        v{rule.version}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditRule(rule)}
                        className="h-6 text-xs px-2.5"
                      >
                        Configure Cap
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: FINANCIAL REPORTS & BREAKDOWNS (Module 9) */}
      {activeTab === "reports" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campaign-wise Commission */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Campaign-Wise Commission Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Campaign</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Transactions</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Total Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignsList.map((c) => {
                    const campTxns = transactions.filter((t) => t.campaignId === c.id);
                    const total = campTxns.reduce((acc, t) => acc + (t.transactionType === "reversal" ? -t.commissionAmount : t.commissionAmount), 0);
                    return (
                      <TableRow key={c.id} className="text-xs">
                        <TableCell className="font-medium text-slate-800">{c.title}</TableCell>
                        <TableCell className="text-right">{campTxns.length}</TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {formatCurrency(total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Role-wise Summary */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Beneficiary Summary & Payout Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">Affiliate Partner Commissions</span>
                  <span className="text-[11px] text-emerald-700">Direct earning for qualified conversions</span>
                </div>
                <span className="text-base font-extrabold text-emerald-800">
                  {formatCurrency(summary.partnerCommission)}
                </span>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-900 block">Vendor Organization Overrides</span>
                  <span className="text-[11px] text-blue-700">Agency commission split shares</span>
                </div>
                <span className="text-base font-extrabold text-blue-800">
                  {formatCurrency(summary.vendorCommission)}
                </span>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-900 block">Reversed Transactions</span>
                  <span className="text-[11px] text-rose-700">Audited cancellations and chargebacks</span>
                </div>
                <span className="text-base font-extrabold text-rose-800">
                  {formatCurrency(summary.reversedCommission)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EDIT RULE MODAL */}
      {editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Configure Commission Cap & Rules
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Campaign: {editingRule.campaignTitle} ({editingRule.campaignCode})
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSaveRule}>
              <CardContent className="p-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Maximum Commission Cap per Approved Lead (₹) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    min={0}
                    value={ruleForm.maxCommissionAmount}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, maxCommissionAmount: parseFloat(e.target.value) || 0 })
                    }
                    className="text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Absolute upper limit. Vendor splits cannot exceed this amount.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Partner Default (₹) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      min={0}
                      value={ruleForm.partnerDefaultCommission}
                      onChange={(e) =>
                        setRuleForm({ ...ruleForm, partnerDefaultCommission: parseFloat(e.target.value) || 0 })
                      }
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Vendor Max Allowed (₹)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      min={0}
                      value={ruleForm.vendorMaxCommission}
                      onChange={(e) =>
                        setRuleForm({ ...ruleForm, vendorMaxCommission: parseFloat(e.target.value) || 0 })
                      }
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Independent Partner Commission (₹) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    min={0}
                    value={ruleForm.independentPartnerCommission}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        independentPartnerCommission: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Direct payout for affiliates without an agency association (Vendor share = ₹0).
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Rule Change Notes / Version Justification
                  </label>
                  <textarea
                    rows={2}
                    value={ruleForm.notes}
                    onChange={(e) => setRuleForm({ ...ruleForm, notes: e.target.value })}
                    placeholder="Rationale for rule adjustment..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRule(null)}
                  disabled={isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="text-xs bg-blue-600 hover:bg-blue-700">
                  {isPending ? "Saving..." : "Save Commission Rule"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* REVERSAL MODAL */}
      {reversingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                <span>Execute Commission Reversal</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Transaction: {reversingTxn.transactionCode} | Amount: {formatCurrency(reversingTxn.commissionAmount)}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleExecuteReversal}>
              <CardContent className="p-4 space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <span className="font-bold block">Immutable Ledger Protection:</span>
                  This action will NOT delete the original record. An audited compensating entry with type
                  &apos;reversal&apos; will be appended to the ledger.
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mandatory Reversal Justification *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reversalReason}
                    onChange={(e) => setReversalReason(e.target.value)}
                    placeholder="Provide detailed compliance reason (e.g., fraudulent lead discovered, customer chargeback)..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReversingTxn(null)}
                  disabled={isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="text-xs bg-rose-600 hover:bg-rose-700 text-white">
                  {isPending ? "Reversing..." : "Confirm Reversal"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

