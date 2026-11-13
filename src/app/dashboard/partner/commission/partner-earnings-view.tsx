"use client";

import React, { useState } from "react";
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";

export interface PartnerCommissionTransactionItem {
  id: string;
  transactionCode: string;
  leadCode: string;
  campaignTitle: string;
  campaignBrand: string;
  amount: number;
  transactionType: "credit" | "debit" | "reversal" | "adjustment";
  status: "pending" | "approved" | "paid" | "reversed";
  referenceCode: string;
  description: string | null;
  createdAt: string;
}

interface PartnerEarningsViewProps {
  transactions: PartnerCommissionTransactionItem[];
  summary: {
    totalEarnings: number;
    pendingEarnings: number;
    approvedEarnings: number;
    availableEarnings: number;
    totalWithdrawn: number;
  };
}

export function PartnerEarningsView({ transactions, summary }: PartnerEarningsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.transactionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.leadCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.campaignTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* KPI Overview Cards (Module 6) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Earnings
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(summary.totalEarnings)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Lifetime credited</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
              Pending Earnings
            </span>
            <div className="text-xl font-bold text-amber-700 mt-1">
              {formatCurrency(summary.pendingEarnings)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Under review</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
              Approved Earnings
            </span>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              {formatCurrency(summary.approvedEarnings)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Verified payouts</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
              Available Balance
            </span>
            <div className="text-xl font-bold text-blue-700 mt-1">
              {formatCurrency(summary.availableEarnings)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Ready for payout</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-3.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Withdrawn
            </span>
            <div className="text-xl font-bold text-slate-700 mt-1">
              {formatCurrency(summary.totalWithdrawn)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Settled to bank</span>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Personal Commission History
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Complete itemized ledger of commissions credited for your verified lead submissions.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search txn, lead code..."
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
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No commission transactions recorded yet. When your submitted leads are verified and approved,
              commissions will credit here automatically.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Transaction ID</TableHead>
                  <TableHead className="text-xs font-semibold">Lead ID</TableHead>
                  <TableHead className="text-xs font-semibold">Campaign</TableHead>
                  <TableHead className="text-xs font-semibold">Brand</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Commission Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id} className="text-xs hover:bg-slate-50/60">
                    <TableCell className="font-mono font-bold text-slate-900">{tx.transactionCode}</TableCell>
                    <TableCell className="font-mono font-semibold text-blue-600">{tx.leadCode}</TableCell>
                    <TableCell className="font-medium text-slate-800">{tx.campaignTitle}</TableCell>
                    <TableCell className="text-slate-600">{tx.campaignBrand}</TableCell>
                    <TableCell className="text-right font-extrabold text-emerald-700">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          tx.transactionType === "credit"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {tx.transactionType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          tx.status === "approved"
                            ? "bg-teal-50 text-teal-700"
                            : tx.status === "reversed"
                            ? "bg-rose-50 text-rose-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
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
    </div>
  );
}

