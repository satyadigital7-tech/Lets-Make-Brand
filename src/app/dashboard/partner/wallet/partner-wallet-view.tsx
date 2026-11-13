"use client";

import React, { useState, useTransition } from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building2,
  RotateCcw,
  Plus,
  ShieldCheck,
  Search,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  requestWithdrawalAction,
  cancelWithdrawalAction,
  savePayoutMethodAction,
} from "./actions";

export interface WalletData {
  id: string;
  walletCode: string;
  totalEarnings: number;
  pendingEarnings: number;
  availableBalance: number;
  reservedBalance: number;
  totalWithdrawn: number;
  currency: string;
  status: string;
}

export interface PayoutMethodItem {
  id: string;
  type: "upi" | "bank_transfer";
  isDefault: boolean;
  upiId: string | null;
  accountHolderName: string;
  accountNumber: string | null;
  ifscCode: string | null;
  bankName: string | null;
}

export interface WithdrawalItem {
  id: string;
  withdrawalCode: string;
  amount: number;
  paymentMethod: string;
  maskedDetails: { maskedAccount: string; accountHolder: string; method: string };
  status: "pending" | "approved" | "processing" | "paid" | "rejected" | "cancelled";
  rejectionReason: string | null;
  adminRemarks: string | null;
  createdAt: string;
}

export interface WalletLedgerRow {
  id: string;
  ledgerCode: string;
  transactionType: string;
  amount: number;
  direction: "credit" | "debit";
  balanceBefore: number;
  balanceAfter: number;
  referenceId: string;
  description: string | null;
  createdAt: string;
}

interface PartnerWalletViewProps {
  wallet: WalletData;
  payoutMethods: PayoutMethodItem[];
  withdrawals: WithdrawalItem[];
  ledger: WalletLedgerRow[];
  minThreshold: number;
}

export function PartnerWalletView({
  wallet,
  payoutMethods,
  withdrawals,
  ledger,
  minThreshold,
}: PartnerWalletViewProps) {
  const [activeTab, setActiveTab] = useState<"withdrawals" | "ledger" | "methods">("withdrawals");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Withdrawal Request Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(minThreshold);
  const [selectedMethodType, setSelectedMethodType] = useState<"upi" | "bank_transfer">("upi");
  const [accountHolderInput, setAccountHolderInput] = useState("");
  const [upiInput, setUpiInput] = useState("");
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [ifscInput, setIfscInput] = useState("");
  const [bankNameInput, setBankNameInput] = useState("");
  const [confirmTerms, setConfirmTerms] = useState(false);

  // Add Payout Method State
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);

  // Auto-fill from default payout method if available
  const handleOpenWithdrawModal = () => {
    setFeedback(null);
    const def = payoutMethods.find((m) => m.isDefault) || payoutMethods[0];
    if (def) {
      setSelectedMethodType(def.type);
      setAccountHolderInput(def.accountHolderName);
      setUpiInput(def.upiId || "");
      setAccountNumberInput(def.accountNumber || "");
      setIfscInput(def.ifscCode || "");
      setBankNameInput(def.bankName || "");
    }
    setWithdrawAmount(Math.min(wallet.availableBalance, Math.max(minThreshold, 500)));
    setConfirmTerms(false);
    setIsWithdrawModalOpen(true);
  };

  const handleExecuteWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (withdrawAmount < minThreshold) {
      setFeedback({ type: "error", text: `Minimum withdrawal amount is ${formatCurrency(minThreshold)}.` });
      return;
    }

    if (withdrawAmount > wallet.availableBalance) {
      setFeedback({ type: "error", text: `Insufficient available balance (${formatCurrency(wallet.availableBalance)}).` });
      return;
    }

    if (!confirmTerms) {
      setFeedback({ type: "error", text: "Please confirm your payout details and terms." });
      return;
    }

    startTransition(async () => {
      try {
        await requestWithdrawalAction({
          amount: Number(withdrawAmount),
          paymentMethod: selectedMethodType === "upi" ? "upi" : "bank_transfer",
          payoutDetails: {
            accountHolderName: accountHolderInput.trim(),
            upiId: selectedMethodType === "upi" ? upiInput.trim() : undefined,
            accountNumber: selectedMethodType === "bank_transfer" ? accountNumberInput.trim() : undefined,
            ifscCode: selectedMethodType === "bank_transfer" ? ifscInput.trim().toUpperCase() : undefined,
            bankName: selectedMethodType === "bank_transfer" ? bankNameInput.trim() : undefined,
          },
          confirmation: true,
        });

        setFeedback({
          type: "success",
          text: `Withdrawal request for ${formatCurrency(withdrawAmount)} submitted successfully! Funds have been reserved.`,
        });
        setIsWithdrawModalOpen(false);
      } catch (err: any) {
        setFeedback({ type: "error", text: err?.message || "Failed to submit withdrawal request." });
      }
    });
  };

  const handleCancelWithdrawal = (withdrawalId: string) => {
    if (!confirm("Are you sure you want to cancel this pending withdrawal request?")) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        await cancelWithdrawalAction(withdrawalId);
        setFeedback({ type: "success", text: "Withdrawal request cancelled. Funds have been returned to available balance." });
      } catch (err: any) {
        setFeedback({ type: "error", text: err?.message || "Failed to cancel withdrawal." });
      }
    });
  };

  const handleSaveMethod = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        await savePayoutMethodAction({
          type: selectedMethodType,
          accountHolderName: accountHolderInput.trim(),
          upiId: selectedMethodType === "upi" ? upiInput.trim() : undefined,
          accountNumber: selectedMethodType === "bank_transfer" ? accountNumberInput.trim() : undefined,
          ifscCode: selectedMethodType === "bank_transfer" ? ifscInput.trim().toUpperCase() : undefined,
          bankName: selectedMethodType === "bank_transfer" ? bankNameInput.trim() : undefined,
          isDefault: true,
        });

        setFeedback({ type: "success", text: "Payout method saved successfully!" });
        setIsAddMethodOpen(false);
      } catch (err: any) {
        setFeedback({ type: "error", text: err?.message || "Failed to save payout method." });
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

      {/* KPI Cards (Module 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Earnings
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(wallet.totalEarnings)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Lifetime credited</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
              Available Balance
            </span>
            <div className="text-xl font-bold text-blue-700 mt-1">
              {formatCurrency(wallet.availableBalance)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Ready for withdrawal</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
              Reserved Balance
            </span>
            <div className="text-xl font-bold text-amber-700 mt-1">
              {formatCurrency(wallet.reservedBalance)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Locked in pending payout</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider block">
              Total Withdrawn
            </span>
            <div className="text-xl font-bold text-teal-700 mt-1">
              {formatCurrency(wallet.totalWithdrawn)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Settled to bank</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Pending Earnings
            </span>
            <div className="text-xl font-bold text-slate-700 mt-1">
              {formatCurrency(wallet.pendingEarnings)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Under lead verification</span>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-sm">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-blue-400" />
            <span>Wallet Account: {wallet.walletCode}</span>
          </h3>
          <p className="text-xs text-blue-200 mt-0.5">
            Minimum withdrawal threshold: {formatCurrency(minThreshold)} | Status: Active
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleOpenWithdrawModal}
            disabled={wallet.availableBalance < minThreshold || isPending}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Request Withdrawal</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddMethodOpen(true);
              setAccountHolderInput("");
              setUpiInput("");
              setAccountNumberInput("");
              setIfscInput("");
              setBankNameInput("");
            }}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-medium gap-1.5"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Manage Payout Details</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Button
          variant={activeTab === "withdrawals" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("withdrawals")}
          className="gap-2 text-xs font-semibold"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          <span>Withdrawal Requests</span>
          <Badge variant="outline" className="ml-1 text-[10px]">
            {withdrawals.length}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "ledger" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("ledger")}
          className="gap-2 text-xs font-semibold"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Wallet Ledger Journal</span>
          <Badge variant="outline" className="ml-1 text-[10px]">
            {ledger.length}
          </Badge>
        </Button>

        <Button
          variant={activeTab === "methods" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("methods")}
          className="gap-2 text-xs font-semibold"
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Saved Payout Accounts</span>
          <Badge variant="outline" className="ml-1 text-[10px]">
            {payoutMethods.length}
          </Badge>
        </Button>
      </div>

      {/* TAB 1: WITHDRAWALS TABLE (Module 2 & 4) */}
      {activeTab === "withdrawals" && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Withdrawal Requests & Disbursement Status
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Track submitted payout requests. Funds remain reserved until paid or released.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {withdrawals.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No withdrawal requests submitted yet. When your available balance reaches at least{" "}
                {formatCurrency(minThreshold)}, you can request a transfer.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Request Code</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold">Method</TableHead>
                    <TableHead className="text-xs font-semibold">Masked Account Details</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((w) => (
                    <TableRow key={w.id} className="text-xs hover:bg-slate-50/60">
                      <TableCell className="font-mono font-bold text-slate-900">{w.withdrawalCode}</TableCell>
                      <TableCell className="text-right font-extrabold text-slate-900">
                        {formatCurrency(w.amount)}
                      </TableCell>
                      <TableCell className="uppercase font-semibold text-slate-700">{w.paymentMethod}</TableCell>
                      <TableCell>
                        <div className="font-mono text-xs text-slate-800">{w.maskedDetails.maskedAccount}</div>
                        <div className="text-[10px] text-slate-400">{w.maskedDetails.accountHolder}</div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            w.status === "paid"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : w.status === "processing"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : w.status === "approved"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : w.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {w.status}
                        </span>
                        {w.rejectionReason && (
                          <div className="text-[10px] text-rose-600 mt-0.5 max-w-[180px] truncate" title={w.rejectionReason}>
                            Reason: {w.rejectionReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-[11px]">{formatDate(w.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {w.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelWithdrawal(w.id)}
                            disabled={isPending}
                            className="h-6 text-[10px] px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                          >
                            Cancel
                          </Button>
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

      {/* TAB 2: WALLET LEDGER (Module 8) */}
      {activeTab === "ledger" && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Immutable Wallet Ledger (Double-Entry Bookkeeping)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Cryptographically verified audit journal of all credits, reservations, releases, and payout disbursements.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {ledger.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No ledger records generated yet.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Ledger Code</TableHead>
                    <TableHead className="text-xs font-semibold">Event Type</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Balance Before</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Balance After</TableHead>
                    <TableHead className="text-xs font-semibold">Reference</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((l) => (
                    <TableRow key={l.id} className="text-xs hover:bg-slate-50/60">
                      <TableCell className="font-mono font-bold text-slate-900">{l.ledgerCode}</TableCell>
                      <TableCell>
                        <Badge
                          variant={l.direction === "credit" ? "secondary" : "outline"}
                          className="text-[10px] capitalize"
                        >
                          {l.transactionType.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${
                          l.direction === "credit" ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {l.direction === "credit" ? "+" : "-"}
                        {formatCurrency(l.amount)}
                      </TableCell>
                      <TableCell className="text-right text-slate-500">{formatCurrency(l.balanceBefore)}</TableCell>
                      <TableCell className="text-right font-extrabold text-slate-900">
                        {formatCurrency(l.balanceAfter)}
                      </TableCell>
                      <TableCell className="font-mono text-slate-600 text-[11px]">{l.referenceId}</TableCell>
                      <TableCell className="text-slate-500 text-[11px]">{formatDate(l.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: PAYOUT METHODS (Module 4) */}
      {activeTab === "methods" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {payoutMethods.map((m) => (
            <Card key={m.id} className="border-slate-200 bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <Badge variant={m.type === "upi" ? "default" : "secondary"} className="uppercase text-[10px]">
                  {m.type === "upi" ? "UPI ID" : "Bank Transfer"}
                </Badge>
                {m.isDefault && (
                  <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200 bg-emerald-50">
                    Default Payout Account
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900">{m.accountHolderName}</div>
                {m.type === "upi" ? (
                  <div className="font-mono text-xs text-blue-700">{m.upiId}</div>
                ) : (
                  <div className="text-xs text-slate-600">
                    <span className="font-mono font-bold block">{m.accountNumber}</span>
                    <span className="text-[11px] block mt-0.5">
                      {m.bankName} (IFSC: {m.ifscCode})
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}

          <Card
            onClick={() => setIsAddMethodOpen(true)}
            className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/60 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition"
          >
            <Plus className="h-6 w-6 text-slate-400 mb-1" />
            <span className="text-xs font-bold text-slate-700">Add New Payout Account</span>
            <span className="text-[10px] text-slate-400">Save your UPI ID or Bank account for quick withdrawals</span>
          </Card>
        </div>
      )}

      {/* REQUEST WITHDRAWAL MODAL (Module 4) */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-blue-600" />
                <span>Request Payout Transfer</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Available Balance:{" "}
                <span className="font-bold text-blue-700">{formatCurrency(wallet.availableBalance)}</span> (Min:{" "}
                {formatCurrency(minThreshold)})
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleExecuteWithdrawal}>
              <CardContent className="p-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Withdrawal Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min={minThreshold}
                    max={wallet.availableBalance}
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(parseFloat(e.target.value) || 0)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Payout Rail / Method *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMethodType("upi")}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition ${
                        selectedMethodType === "upi"
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      UPI Transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMethodType("bank_transfer")}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition ${
                        selectedMethodType === "bank_transfer"
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      NEFT / IMPS Bank
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Account Holder Name *
                  </label>
                  <Input
                    required
                    placeholder="Full legal name on bank/UPI account"
                    value={accountHolderInput}
                    onChange={(e) => setAccountHolderInput(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {selectedMethodType === "upi" ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      UPI ID (VPA) *
                    </label>
                    <Input
                      required
                      placeholder="e.g. yourname@okaxis, 9876543210@paytm"
                      value={upiInput}
                      onChange={(e) => setUpiInput(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Bank Account Number *
                      </label>
                      <Input
                        required
                        placeholder="Account number"
                        value={accountNumberInput}
                        onChange={(e) => setAccountNumberInput(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          IFSC Code *
                        </label>
                        <Input
                          required
                          placeholder="e.g. HDFC0001234"
                          value={ifscInput}
                          onChange={(e) => setIfscInput(e.target.value.toUpperCase())}
                          className="text-xs font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Bank Name
                        </label>
                        <Input
                          placeholder="e.g. HDFC Bank"
                          value={bankNameInput}
                          onChange={(e) => setBankNameInput(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                  <span className="font-bold block">Fund Hold Guarantee:</span>
                  <p>
                    Upon submission, {formatCurrency(withdrawAmount)} will be locked in your reserved balance.
                    The platform admin manually executes the transfer and posts the bank UTR reference.
                  </p>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="confirmTerms"
                    required
                    checked={confirmTerms}
                    onChange={(e) => setConfirmTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="confirmTerms" className="text-[11px] text-slate-600">
                    I confirm that the above payout credentials are accurate and belong to me.
                  </label>
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  disabled={isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !confirmTerms || withdrawAmount > wallet.availableBalance}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isPending ? "Submitting..." : `Withdraw ${formatCurrency(withdrawAmount)}`}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ADD PAYOUT METHOD MODAL */}
      {isAddMethodOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Save Payout Account
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Save your beneficiary details for fast, seamless future withdrawals.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSaveMethod}>
              <CardContent className="p-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Account Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMethodType("upi")}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition ${
                        selectedMethodType === "upi"
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      UPI ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMethodType("bank_transfer")}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition ${
                        selectedMethodType === "bank_transfer"
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Bank Account
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Account Holder Name *
                  </label>
                  <Input
                    required
                    placeholder="Full legal name"
                    value={accountHolderInput}
                    onChange={(e) => setAccountHolderInput(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {selectedMethodType === "upi" ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      UPI ID (VPA) *
                    </label>
                    <Input
                      required
                      placeholder="e.g. mobile@upi, name@okaxis"
                      value={upiInput}
                      onChange={(e) => setUpiInput(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Bank Account Number *
                      </label>
                      <Input
                        required
                        placeholder="Account number"
                        value={accountNumberInput}
                        onChange={(e) => setAccountNumberInput(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          IFSC Code *
                        </label>
                        <Input
                          required
                          placeholder="e.g. SBIN0001234"
                          value={ifscInput}
                          onChange={(e) => setIfscInput(e.target.value.toUpperCase())}
                          className="text-xs font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Bank Name
                        </label>
                        <Input
                          placeholder="e.g. State Bank of India"
                          value={bankNameInput}
                          onChange={(e) => setBankNameInput(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddMethodOpen(false)}
                  disabled={isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="text-xs bg-blue-600 hover:bg-blue-700">
                  {isPending ? "Saving..." : "Save Payout Method"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

