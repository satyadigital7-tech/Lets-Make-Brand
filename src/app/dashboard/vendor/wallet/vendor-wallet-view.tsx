"use client";

import React, { useState, useTransition } from "react";
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { requestVendorWithdrawalAction, cancelVendorWithdrawalAction } from "./actions";
import {
  WalletData,
  WithdrawalItem,
  WalletLedgerRow,
  PayoutMethodItem,
} from "@/app/dashboard/partner/wallet/partner-wallet-view";

interface VendorWalletViewProps {
  wallet: WalletData;
  payoutMethods: PayoutMethodItem[];
  withdrawals: WithdrawalItem[];
  ledger: WalletLedgerRow[];
  teamDistributedAmount: number;
  minThreshold: number;
}

export function VendorWalletView({
  wallet,
  payoutMethods,
  withdrawals,
  ledger,
  teamDistributedAmount,
  minThreshold,
}: VendorWalletViewProps) {
  const [activeTab, setActiveTab] = useState<"withdrawals" | "ledger">("withdrawals");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amountInput, setAmountInput] = useState(minThreshold);
  const [methodType, setMethodType] = useState<"upi" | "bank_transfer">("bank_transfer");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [upiId, setUpiId] = useState("");
  const [confirmTerms, setConfirmTerms] = useState(false);

  const handleOpenModal = () => {
    setFeedback(null);
    const def = payoutMethods[0];
    if (def) {
      setMethodType(def.type);
      setAccountHolder(def.accountHolderName);
      setAccountNumber(def.accountNumber || "");
      setIfscCode(def.ifscCode || "");
      setBankName(def.bankName || "");
      setUpiId(def.upiId || "");
    }
    setAmountInput(Math.min(wallet.availableBalance, Math.max(minThreshold, 1000)));
    setConfirmTerms(false);
    setIsModalOpen(true);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (amountInput < minThreshold) {
      setFeedback({ type: "error", text: `Minimum withdrawal is ${formatCurrency(minThreshold)}.` });
      return;
    }
    if (amountInput > wallet.availableBalance) {
      setFeedback({ type: "error", text: "Insufficient available balance." });
      return;
    }
    if (!confirmTerms) {
      setFeedback({ type: "error", text: "Confirmation of payout details is required." });
      return;
    }

    startTransition(async () => {
      try {
        await requestVendorWithdrawalAction({
          amount: Number(amountInput),
          paymentMethod: methodType === "upi" ? "upi" : "bank_transfer",
          payoutDetails: {
            accountHolderName: accountHolder.trim(),
            upiId: methodType === "upi" ? upiId.trim() : undefined,
            accountNumber: methodType === "bank_transfer" ? accountNumber.trim() : undefined,
            ifscCode: methodType === "bank_transfer" ? ifscCode.trim().toUpperCase() : undefined,
            bankName: methodType === "bank_transfer" ? bankName.trim() : undefined,
          },
          confirmation: true,
        });

        setFeedback({
          type: "success",
          text: `Agency payout request for ${formatCurrency(amountInput)} submitted. Funds have been reserved.`,
        });
        setIsModalOpen(false);
      } catch (err: any) {
        setFeedback({ type: "error", text: err?.message || "Failed to submit payout request." });
      }
    });
  };

  const handleCancel = (wdrId: string) => {
    if (!confirm("Are you sure you want to cancel this pending withdrawal request?")) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        await cancelVendorWithdrawalAction(wdrId);
        setFeedback({ type: "success", text: "Withdrawal cancelled. Funds returned to available balance." });
      } catch (err: any) {
        setFeedback({ type: "error", text: err?.message || "Failed to cancel withdrawal." });
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
          <button onClick={() => setFeedback(null)} className="text-xs font-bold underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards (Module 3) */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Vendor Earnings
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(wallet.totalEarnings)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Agency override total</span>
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
            <span className="text-[10px] text-slate-400 mt-0.5 block">Ready for settlement</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
              Reserved Amount
            </span>
            <div className="text-xl font-bold text-amber-700 mt-1">
              {formatCurrency(wallet.reservedBalance)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Locked in payout queue</span>
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
            <span className="text-[10px] text-slate-400 mt-0.5 block">Settled agency payouts</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
              Squad Payouts
            </span>
            <div className="text-xl font-bold text-indigo-700 mt-1">
              {formatCurrency(teamDistributedAmount)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Earned by squad members</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Pending Accruals
            </span>
            <div className="text-xl font-bold text-slate-700 mt-1">
              {formatCurrency(wallet.pendingEarnings)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Unverified leads</span>
          </CardContent>
        </Card>
      </div>

      {/* Header Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-xl shadow-sm">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-400" />
            <span>Corporate Agency Wallet: {wallet.walletCode}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Available agency override balance: {formatCurrency(wallet.availableBalance)}
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenModal}
          disabled={wallet.availableBalance < minThreshold || isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 shadow"
        >
          <ArrowUpRight className="h-4 w-4" />
          <span>Request Agency Payout</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Button
          variant={activeTab === "withdrawals" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("withdrawals")}
          className="gap-2 text-xs font-semibold"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          <span>Agency Disbursements</span>
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
          <span>Agency Wallet Ledger</span>
          <Badge variant="outline" className="ml-1 text-[10px]">
            {ledger.length}
          </Badge>
        </Button>
      </div>

      {/* TAB 1: DISBURSEMENTS */}
      {activeTab === "withdrawals" && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Agency Payout Disbursements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {withdrawals.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No agency withdrawals recorded yet.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Request Code</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold">Method</TableHead>
                    <TableHead className="text-xs font-semibold">Account</TableHead>
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
                      <TableCell className="uppercase font-semibold">{w.paymentMethod}</TableCell>
                      <TableCell className="font-mono text-slate-700">{w.maskedDetails.maskedAccount}</TableCell>
                      <TableCell>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            w.status === "paid"
                              ? "bg-teal-50 text-teal-700"
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
                        {w.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(w.id)}
                            className="h-6 text-[10px] px-2 text-rose-600 border-rose-200"
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

      {/* TAB 2: LEDGER */}
      {activeTab === "ledger" && (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900">
              Agency Wallet Journal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {ledger.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">No ledger entries generated yet.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Ledger Code</TableHead>
                    <TableHead className="text-xs font-semibold">Transaction Type</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Balance After</TableHead>
                    <TableHead className="text-xs font-semibold">Reference</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((l) => (
                    <TableRow key={l.id} className="text-xs hover:bg-slate-50/60">
                      <TableCell className="font-mono font-bold">{l.ledgerCode}</TableCell>
                      <TableCell className="capitalize">{l.transactionType.replace("_", " ")}</TableCell>
                      <TableCell className={`text-right font-bold ${l.direction === "credit" ? "text-emerald-700" : "text-rose-700"}`}>
                        {l.direction === "credit" ? "+" : "-"}
                        {formatCurrency(l.amount)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">{formatCurrency(l.balanceAfter)}</TableCell>
                      <TableCell className="font-mono text-slate-500 text-[11px]">{l.referenceId}</TableCell>
                      <TableCell className="text-slate-500 text-[11px]">{formatDate(l.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Request Agency Payout
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Available: {formatCurrency(wallet.availableBalance)} (Min: {formatCurrency(minThreshold)})
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleWithdraw}>
              <CardContent className="p-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Payout Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    step="1"
                    min={minThreshold}
                    max={wallet.availableBalance}
                    required
                    value={amountInput}
                    onChange={(e) => setAmountInput(parseFloat(e.target.value) || 0)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Corporate Account Holder Name *
                  </label>
                  <Input
                    required
                    placeholder="Business entity or director name"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Bank Account Number *
                  </label>
                  <Input
                    required
                    placeholder="Account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      IFSC Code *
                    </label>
                    <Input
                      required
                      placeholder="e.g. HDFC0001234"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      className="text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Bank Name
                    </label>
                    <Input
                      placeholder="e.g. HDFC Bank"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="confirmTermsVendor"
                    required
                    checked={confirmTerms}
                    onChange={(e) => setConfirmTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600"
                  />
                  <label htmlFor="confirmTermsVendor" className="text-[11px] text-slate-600">
                    I confirm that these banking credentials are valid for corporate disbursement.
                  </label>
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !confirmTerms || amountInput > wallet.availableBalance}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isPending ? "Submitting..." : `Withdraw ${formatCurrency(amountInput)}`}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

