"use client";

import React, { useState, useTransition } from "react";
import {
  Percent,
  TrendingUp,
  ShieldCheck,
  Users,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  FileSpreadsheet,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { saveVendorSplitAction } from "./actions";

export interface VendorSplitItem {
  id: string;
  campaignId: string;
  campaignTitle: string;
  campaignCode: string;
  brandName: string;
  maxCap: number;
  vendorShare: number;
  partnerShare: number;
  version: number;
  isActive: boolean;
}

export interface VendorTransactionItem {
  id: string;
  transactionCode: string;
  leadCode: string;
  campaignTitle: string;
  partnerName: string;
  teamName: string | null;
  beneficiaryRole: string;
  amount: number;
  transactionType: string;
  status: string;
  createdAt: string;
}

export interface MemberEarningsItem {
  memberId: string;
  name: string;
  email: string;
  leadsCount: number;
  approvedCount: number;
  earnings: number;
}

export interface CampaignEarningsItem {
  campaignId: string;
  title: string;
  leadsCount: number;
  vendorEarnings: number;
  partnerEarnings: number;
}

interface VendorCommissionViewProps {
  splits: VendorSplitItem[];
  transactions: VendorTransactionItem[];
  memberEarnings: MemberEarningsItem[];
  campaignEarnings: CampaignEarningsItem[];
  summary: {
    totalVendorEarnings: number;
    pendingCommission: number;
    approvedCommission: number;
    teamCommissionDistributed: number;
  };
}

export function VendorCommissionView({
  splits,
  transactions,
  memberEarnings,
  campaignEarnings,
  summary,
}: VendorCommissionViewProps) {
  const [activeTab, setActiveTab] = useState<"splits" | "ledger" | "breakdowns">("splits");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Split Configuration Modal State
  const [editingSplit, setEditingSplit] = useState<VendorSplitItem | null>(null);
  const [vendorShareInput, setVendorShareInput] = useState(100);
  const [partnerShareInput, setPartnerShareInput] = useState(400);
  const [notesInput, setNotesInput] = useState("");

  const handleOpenEditSplit = (split: VendorSplitItem) => {
    setEditingSplit(split);
    setVendorShareInput(split.vendorShare);
    setPartnerShareInput(split.partnerShare);
    setNotesInput("");
  };

  const handleSaveSplit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSplit) return;
    setFeedback(null);

    const total = Number(vendorShareInput) + Number(partnerShareInput);
    if (total > editingSplit.maxCap) {
      setFeedback({
        type: "error",
        text: `Total split (₹${total}) exceeds Super Admin campaign limit (₹${editingSplit.maxCap}).`,
      });
      return;
    }

    startTransition(async () => {
      try {
        await saveVendorSplitAction({
          campaignId: editingSplit.campaignId,
          vendorShare: Number(vendorShareInput),
          partnerShare: Number(partnerShareInput),
          notes: notesInput || undefined,
        });

        setFeedback({
          type: "success",
          text: `Commission split updated successfully for ${editingSplit.campaignTitle}!`,
        });
        setEditingSplit(null);
      } catch (err: any) {
        setFeedback({ type: "error", text: err?.message || "Failed to save commission split." });
      }
    });
  };

  const currentModalTotal = Number(vendorShareInput) + Number(partnerShareInput);
  const isOverLimit = editingSplit ? currentModalTotal > editingSplit.maxCap : false;

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

      {/* KPI Cards (Module 7) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Vendor Earnings
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(summary.totalVendorEarnings)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Agency override share</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block">
              Approved Commission
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(summary.approvedCommission)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Verified conversions</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
              Pending Commission
            </span>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {formatCurrency(summary.pendingCommission)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Awaiting compliance verification</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
              Squad Member Payouts
            </span>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {formatCurrency(summary.teamCommissionDistributed)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Distributed to partners</span>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Button
          variant={activeTab === "splits" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("splits")}
          className="gap-2 text-xs font-semibold"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Commission Splits</span>
          <Badge variant="outline" className="ml-1 text-[10px]">
            {splits.length}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "ledger" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("ledger")}
          className="gap-2 text-xs font-semibold"
        >
          <Percent className="h-3.5 w-3.5" />
          <span>Commission History</span>
          <Badge variant="outline" className="ml-1 text-[10px]">
            {transactions.length}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "breakdowns" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("breakdowns")}
          className="gap-2 text-xs font-semibold"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Squad & Campaign Distribution</span>
        </Button>
      </div>

      {/* TAB 1: COMMISSION SPLITS (Module 2) */}
      {activeTab === "splits" && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Vendor Commission Split Configuration
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Configure how campaign commission is shared between your Vendor Agency and promoting Squad Members.
              The total distribution can never exceed the Super Admin limit.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {splits.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No active brand campaigns available to configure splits.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-slate-700">Campaign</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Brand</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Max Limit Cap</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Your Agency Share</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Member Share</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700">Version</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-700 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {splits.map((s) => (
                    <TableRow key={s.campaignId} className="hover:bg-slate-50/60 text-xs">
                      <TableCell>
                        <div className="font-bold text-slate-900">{s.campaignTitle}</div>
                        <div className="font-mono text-[10px] text-slate-400">{s.campaignCode}</div>
                      </TableCell>
                      <TableCell className="text-slate-700">{s.brandName}</TableCell>
                      <TableCell className="text-right font-extrabold text-blue-700">
                        {formatCurrency(s.maxCap)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(s.vendorShare)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700">
                        {formatCurrency(s.partnerShare)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          v{s.version}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditSplit(s)}
                          className="h-6 text-xs px-2.5"
                        >
                          Configure Split
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 2: COMMISSION HISTORY (Module 7 & 8) */}
      {activeTab === "ledger" && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Agency Financial Commission History
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Itemized ledger of vendor override earnings and squad member distributions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No commission transactions accrued yet. Approved squad leads will generate automatic earnings here.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Txn Code</TableHead>
                    <TableHead className="text-xs font-semibold">Lead Code</TableHead>
                    <TableHead className="text-xs font-semibold">Campaign</TableHead>
                    <TableHead className="text-xs font-semibold">Member</TableHead>
                    <TableHead className="text-xs font-semibold">Squad</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className="text-xs hover:bg-slate-50/60">
                      <TableCell className="font-mono font-bold text-slate-900">{tx.transactionCode}</TableCell>
                      <TableCell className="font-mono font-medium text-blue-600">{tx.leadCode}</TableCell>
                      <TableCell className="font-medium text-slate-800">{tx.campaignTitle}</TableCell>
                      <TableCell className="text-slate-700">{tx.partnerName}</TableCell>
                      <TableCell className="text-slate-600">{tx.teamName || "-"}</TableCell>
                      <TableCell className="text-right font-extrabold text-slate-900">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                          {tx.transactionType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-teal-50 text-teal-700">
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-[11px]">{formatDate(tx.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: BREAKDOWNS (Module 7) */}
      {activeTab === "breakdowns" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Member-wise Earnings */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Member-Wise Earning Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {memberEarnings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No squad member earnings recorded yet.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Member</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Approved</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Member Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberEarnings.map((m) => (
                      <TableRow key={m.memberId} className="text-xs">
                        <TableCell>
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[10px] text-slate-400">{m.email}</div>
                        </TableCell>
                        <TableCell className="text-center font-bold text-emerald-600">
                          {m.approvedCount}
                        </TableCell>
                        <TableCell className="text-right font-extrabold text-slate-900">
                          {formatCurrency(m.earnings)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Campaign-wise Earnings */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Campaign-Wise Earnings Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {campaignEarnings.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">No campaign conversions recorded yet.</div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Campaign</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Vendor Share</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Member Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignEarnings.map((c) => (
                      <TableRow key={c.campaignId} className="text-xs">
                        <TableCell className="font-medium text-slate-900">{c.title}</TableCell>
                        <TableCell className="text-right font-extrabold text-blue-700">
                          {formatCurrency(c.vendorEarnings)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-emerald-700">
                          {formatCurrency(c.partnerEarnings)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* EDIT SPLIT MODAL (Module 2) */}
      {editingSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Configure Commission Split
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Campaign: {editingSplit.campaignTitle}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSaveSplit}>
              <CardContent className="p-4 space-y-3.5">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
                  <span>Super Admin Maximum Limit Cap:</span>
                  <span className="font-extrabold text-blue-800 text-sm">
                    {formatCurrency(editingSplit.maxCap)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Your Agency Share (₹) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      value={vendorShareInput}
                      onChange={(e) => setVendorShareInput(parseFloat(e.target.value) || 0)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Squad Member Share (₹) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      value={partnerShareInput}
                      onChange={(e) => setPartnerShareInput(parseFloat(e.target.value) || 0)}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Total Split Calculation */}
                <div
                  className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
                    isOverLimit
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <span className="font-semibold">Total Configured Split:</span>
                  <span className="font-extrabold text-sm">
                    {formatCurrency(currentModalTotal)} / {formatCurrency(editingSplit.maxCap)}
                  </span>
                </div>

                {isOverLimit && (
                  <p className="text-[11px] text-rose-600 font-semibold">
                    Warning: Total distribution exceeds the platform cap by{" "}
                    {formatCurrency(currentModalTotal - editingSplit.maxCap)}. Please lower one of the amounts.
                  </p>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Split Version Notes (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Incentive boost for Q3 campaign"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSplit(null)}
                  disabled={isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || isOverLimit}
                  className="text-xs bg-blue-600 hover:bg-blue-700"
                >
                  {isPending ? "Saving Split..." : "Save Commission Split"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

