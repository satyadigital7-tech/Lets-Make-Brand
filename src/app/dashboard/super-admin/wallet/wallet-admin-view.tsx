"use client";

import React, { useState, useTransition } from "react";
import {
  Wallet,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  CreditCard,
  Building2,
  Users,
  Clock,
  Send,
  FileCheck,
  Ban,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  reviewWithdrawalAction,
  recordManualPaymentAction,
  manualWalletAdjustmentAction,
} from "./actions";

export interface AdminWithdrawalItem {
  id: string;
  withdrawalCode: string;
  walletId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  vendorId: string | null;
  vendorName: string | null;
  amount: number;
  paymentMethod: string;
  maskedDetails: { maskedAccount: string; accountHolder: string; method: string };
  payoutDetails: any;
  status: "pending" | "approved" | "processing" | "paid" | "rejected" | "cancelled";
  rejectionReason: string | null;
  adminRemarks: string | null;
  createdAt: string;
}

export interface TreasurySummary {
  totalAvailable: number;
  totalReserved: number;
  totalWithdrawn: number;
  pendingCount: number;
  pendingAmount: number;
  approvedCount: number;
  approvedAmount: number;
  paidCount: number;
  paidAmount: number;
  rejectedCount: number;
}

interface WalletAdminViewProps {
  withdrawals: AdminWithdrawalItem[];
  summary: TreasurySummary;
}

export function WalletAdminView({ withdrawals, summary }: WalletAdminViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reject Modal State
  const [rejectingItem, setRejectingItem] = useState<AdminWithdrawalItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Pay Modal State (Module 7)
  const [payingItem, setPayingItem] = useState<AdminWithdrawalItem | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [adminRemarks, setAdminRemarks] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const filtered = withdrawals.filter((w) => {
    const matchesSearch =
      w.withdrawalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.maskedDetails.maskedAccount.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || w.status === statusFilter;
    const matchesRole = roleFilter === "all" || w.userRole === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleSimpleReview = (withdrawalId: string, action: "approve" | "mark_processing") => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await reviewWithdrawalAction({ withdrawalId, action });
        setFeedback({
          type: "success",
          text: `Withdrawal successfully marked as ${action.replace("mark_", "")}!`,
        });
      } catch (err: any) {
        setFeedback({ type: "error", text: err?.message || "Failed to update withdrawal." });
      }
    });
  };

  const handleExecuteReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    if (!rejectReason.trim()) {
      setFeedback({ type: "error", text: "Please enter a mandatory rejection reason." });
      return;
    }

    startTransition(async () => {
      try {
        await reviewWithdrawalAction({
          withdrawalId: rejectingItem.id,
          action: "reject",
          reason: rejectReason.trim(),
        });
        setFeedback({
          type: "success",
          text: `Withdrawal ${rejectingItem.withdrawalCode} rejected. Reserved funds released back to user wallet.`,
        });
        setRejectingItem(null);
        setRejectReason("");
      } catch (err: any) {
        setFeedback({ type: "error", text: err?.message || "Failed to reject withdrawal." });
      }
    });
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem) return;
    if (!utrNumber.trim()) {
      setFeedback({ type: "error", text: "Payment Reference / UTR Number is required." });
      return;
    }

    startTransition(async () => {
      try {
        await recordManualPaymentAction({
          withdrawalId: payingItem.id,
          paymentReference: utrNumber.trim(),
          paymentMethod: payingItem.paymentMethod,
          paymentDate,
          adminRemarks: adminRemarks.trim() || undefined,
          proofUrl: proofUrl.trim() || undefined,
        });

        setFeedback({
          type: "success",
          text: `Payment recorded successfully! Reference: ${utrNumber}. Withdrawal marked as Paid.`,
        });
        setPayingItem(null);
        setUtrNumber("");
        setAdminRemarks("");
        setProofUrl("");
      } catch (err: any) {
        setFeedback({ type: "error", text: err?.message || "Failed to record manual payment." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
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
          <button onClick={() => setFeedback(null)} className="text-xs font-bold underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Treasury KPIs (Module 10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Platform Available
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(summary.totalAvailable)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Held across all user wallets</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
              Total In Queue (Reserved)
            </span>
            <div className="text-xl font-bold text-amber-700 mt-1">
              {formatCurrency(summary.totalReserved)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {summary.pendingCount} pending requests
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
              Approved / Processing
            </span>
            <div className="text-xl font-bold text-blue-700 mt-1">
              {formatCurrency(summary.approvedAmount)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {summary.approvedCount} awaiting bank transfer
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider block">
              Total Paid Out
            </span>
            <div className="text-xl font-bold text-teal-700 mt-1">
              {formatCurrency(summary.paidAmount)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{summary.paidCount} completed payouts</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
              Rejected Requests
            </span>
            <div className="text-xl font-bold text-rose-700 mt-1">{summary.rejectedCount}</div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Funds safely released</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card (Module 5) */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Platform Withdrawal Queue & Disbursements
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Review, approve, and execute manual payouts with bank UTR reference tracking.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-56">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search user, code, account..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-8 bg-slate-50 w-full"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 flex-1 sm:flex-initial"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 flex-1 sm:flex-initial"
            >
              <option value="all">All Roles</option>
              <option value="vendor">Vendor</option>
              <option value="independent_partner">Independent Partner</option>
              <option value="team_member">Team Member</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No withdrawal requests found matching the current filters.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Request Code</TableHead>
                  <TableHead className="text-xs font-semibold">Beneficiary</TableHead>
                  <TableHead className="text-xs font-semibold">Role</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Method</TableHead>
                  <TableHead className="text-xs font-semibold">Masked Account Details</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Review Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((w) => (
                  <TableRow key={w.id} className="text-xs hover:bg-slate-50/60">
                    <TableCell className="font-mono font-bold text-slate-900">{w.withdrawalCode}</TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900">{w.userName}</div>
                      <div className="text-[10px] text-slate-400">{w.userEmail}</div>
                      {w.vendorName && (
                        <span className="text-[9px] text-blue-600 block">Via: {w.vendorName}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px]">
                        {w.userRole.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-extrabold text-slate-900">
                      {formatCurrency(w.amount)}
                    </TableCell>
                    <TableCell className="uppercase font-semibold text-slate-700">{w.paymentMethod}</TableCell>
                    <TableCell>
                      <div className="font-mono text-xs font-semibold text-slate-800">
                        {w.maskedDetails.maskedAccount}
                      </div>
                      <div className="text-[10px] text-slate-400">{w.maskedDetails.accountHolder}</div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          w.status === "paid"
                            ? "bg-teal-50 text-teal-700"
                            : w.status === "processing"
                            ? "bg-blue-50 text-blue-700"
                            : w.status === "approved"
                            ? "bg-indigo-50 text-indigo-700"
                            : w.status === "rejected"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {w.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-[11px]">{formatDate(w.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {/* Review Buttons based on status state machine */}
                      <div className="flex items-center justify-end gap-1.5">
                        {w.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSimpleReview(w.id, "approve")}
                              disabled={isPending}
                              className="h-6 text-[10px] px-2 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRejectingItem(w);
                                setRejectReason("");
                              }}
                              disabled={isPending}
                              className="h-6 text-[10px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                            >
                              Reject
                            </Button>
                          </>
                        )}

                        {w.status === "approved" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSimpleReview(w.id, "mark_processing")}
                              disabled={isPending}
                              className="h-6 text-[10px] px-2 text-blue-700 border-blue-200 hover:bg-blue-50"
                            >
                              Processing
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setPayingItem(w);
                                setUtrNumber("");
                                setAdminRemarks("");
                                setProofUrl("");
                              }}
                              disabled={isPending}
                              className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                              Mark Paid
                            </Button>
                          </>
                        )}

                        {w.status === "processing" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setPayingItem(w);
                              setUtrNumber("");
                              setAdminRemarks("");
                              setProofUrl("");
                            }}
                            disabled={isPending}
                            className="h-6 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                          >
                            Mark Paid
                          </Button>
                        )}

                        {w.status === "paid" && (
                          <span className="text-[10px] text-teal-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Disbursed
                          </span>
                        )}

                        {w.status === "rejected" && (
                          <span className="text-[10px] text-rose-600 italic">Rejected</span>
                        )}
                        {w.status === "cancelled" && (
                          <span className="text-[10px] text-slate-400 italic">Cancelled</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* REJECT MODAL (Module 5 & 6) */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-rose-700 flex items-center gap-2">
                <Ban className="h-4 w-4" />
                <span>Reject Withdrawal Request</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Request: {rejectingItem.withdrawalCode} | Beneficiary: {rejectingItem.userName} (
                {formatCurrency(rejectingItem.amount)})
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleExecuteReject}>
              <CardContent className="p-4 space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <span className="font-bold block">Automatic Balance Release:</span>
                  Rejecting this request will immediately release {formatCurrency(rejectingItem.amount)} back
                  into the user&apos;s available balance and generate an audited ledger entry.
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Mandatory Rejection Reason *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g. Invalid IFSC code, account name mismatch, compliance discrepancy..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRejectingItem(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                  {isPending ? "Rejecting..." : "Confirm Rejection"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MARK PAID MODAL (Module 7) */}
      {payingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                <span>Record Manual Bank / UPI Payout</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Disbursement: {payingItem.withdrawalCode} &bull; Amount:{" "}
                <span className="font-bold text-slate-900">{formatCurrency(payingItem.amount)}</span>
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleExecutePayment}>
              <CardContent className="p-4 space-y-3.5">
                {/* Beneficiary Details Box */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-slate-900">Beneficiary Details for Manual Transfer:</div>
                  <div className="text-slate-700">Account Holder: {payingItem.payoutDetails?.accountHolderName}</div>
                  {payingItem.paymentMethod === "upi" ? (
                    <div className="font-mono text-blue-700">UPI ID: {payingItem.payoutDetails?.upiId}</div>
                  ) : (
                    <div>
                      <span className="font-mono font-bold">A/C: {payingItem.payoutDetails?.accountNumber}</span>
                      <span className="ml-2 font-mono text-slate-500">IFSC: {payingItem.payoutDetails?.ifscCode}</span>
                      <div className="text-[11px] text-slate-500">Bank: {payingItem.payoutDetails?.bankName || "Bank"}</div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Bank Reference / UTR Number *
                  </label>
                  <Input
                    required
                    placeholder="e.g. UTR123456789012, UPI transaction ID"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    className="text-xs font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Must be unique. Entered after completing manual bank transfer.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Payment Date *
                    </label>
                    <Input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Remittance Proof URL (Optional)
                    </label>
                    <Input
                      placeholder="https://..."
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Administrative Remarks
                  </label>
                  <Input
                    placeholder="Optional notes regarding the disbursement..."
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPayingItem(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !utrNumber.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isPending ? "Recording..." : `Confirm Payment (₹${payingItem.amount})`}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

