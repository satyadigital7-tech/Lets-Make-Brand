"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Download,
  Filter,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";

export interface PaymentRecordItem {
  id: string;
  paymentCode: string;
  withdrawalId: string;
  withdrawalCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
  paymentReference: string;
  paymentDate: string;
  status: string;
  proofUrl: string | null;
  adminRemarks: string | null;
  processedByName: string;
  createdAt: string;
}

interface PaymentManagerViewProps {
  payments: PaymentRecordItem[];
  totalDisbursed: number;
}

export function PaymentManagerView({ payments, totalDisbursed }: PaymentManagerViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  const filtered = payments.filter((p) => {
    const matchesSearch =
      p.paymentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.withdrawalCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod = methodFilter === "all" || p.paymentMethod.toLowerCase() === methodFilter.toLowerCase();
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Disbursed Volume
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalDisbursed)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Settled bank & UPI transfers</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider block">
              Completed Disbursements
            </span>
            <div className="text-2xl font-bold text-teal-700 mt-1">{payments.length}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">With unique UTR references</span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
              Average Payout Ticket
            </span>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {payments.length > 0 ? formatCurrency(totalDisbursed / payments.length) : "₹0.00"}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Across all partners & vendors</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Payments Table (Module 9) */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Manual Payment & UTR Remittance Ledger
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Official records of bank transfers, IMPS/NEFT remittances, and UPI settlements.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search UTR, name, code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-xs h-8 bg-slate-50"
              />
            </div>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700"
            >
              <option value="all">All Methods</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="neft">NEFT</option>
              <option value="imps">IMPS</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No manual payment records found matching the current search.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="text-xs font-semibold">Payment ID</TableHead>
                  <TableHead className="text-xs font-semibold">Withdrawal ID</TableHead>
                  <TableHead className="text-xs font-semibold">Beneficiary</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Method</TableHead>
                  <TableHead className="text-xs font-semibold">Reference / UTR Number</TableHead>
                  <TableHead className="text-xs font-semibold">Payment Date</TableHead>
                  <TableHead className="text-xs font-semibold">Processed By</TableHead>
                  <TableHead className="text-xs font-semibold">Proof</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="text-xs hover:bg-slate-50/60">
                    <TableCell className="font-mono font-bold text-slate-900">{p.paymentCode}</TableCell>
                    <TableCell className="font-mono font-medium text-blue-600">{p.withdrawalCode}</TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900">{p.userName}</div>
                      <div className="text-[10px] text-slate-400">{p.userEmail}</div>
                    </TableCell>
                    <TableCell className="text-right font-extrabold text-emerald-700">
                      {formatCurrency(p.amount)}
                    </TableCell>
                    <TableCell className="uppercase font-semibold text-slate-700">{p.paymentMethod}</TableCell>
                    <TableCell>
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                        {p.paymentReference}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">{p.paymentDate}</TableCell>
                    <TableCell className="text-slate-500 text-[11px]">{p.processedByName}</TableCell>
                    <TableCell>
                      {p.proofUrl ? (
                        <a
                          href={p.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>Receipt</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">-</span>
                      )}
                    </TableCell>
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

