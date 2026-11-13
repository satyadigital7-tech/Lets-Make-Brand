"use client";

import React, { useState, useTransition } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Eye,
  Filter,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { reviewKycAction } from "./actions";

export interface AdminKycItem {
  id: string;
  kycCode: string;
  userId: string;
  userRole: string;
  fullName: string;
  email: string;
  profileCode: string;
  dateOfBirth: string;
  address: string;
  panMasked: string;
  bankAccountHolder: string;
  bankAccountMasked: string;
  ifscCode: string;
  bankName: string | null;
  upiId: string | null;
  status: string;
  rejectionReason: string | null;
  adminRemarks: string | null;
  submittedAt: string;
  documents: {
    id: string;
    documentType: string;
    documentName: string;
    filePath: string;
    isVerified: boolean;
  }[];
}

interface KycAdminViewProps {
  initialItems: AdminKycItem[];
}

export function KycAdminView({ initialItems }: KycAdminViewProps) {
  const [items, setItems] = useState<AdminKycItem[]>(initialItems);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [reviewingItem, setReviewingItem] = useState<AdminKycItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "request_correction">("approve");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewRemarks, setReviewRemarks] = useState("");

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kycCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.panMasked.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesRole = roleFilter === "all" || item.userRole === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleExecuteReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const result = await reviewKycAction({
          kycId: reviewingItem.id,
          action: reviewAction,
          reason: reviewReason.trim() || undefined,
          adminRemarks: reviewRemarks.trim() || undefined,
        });

        if (result.success) {
          setItems((prev) =>
            prev.map((i) =>
              i.id === reviewingItem.id
                ? {
                    ...i,
                    status: result.status,
                    rejectionReason: reviewReason || null,
                    adminRemarks: reviewRemarks || null,
                  }
                : i
            )
          );
          setSuccessMsg(`KYC application ${reviewingItem.kycCode} marked as ${result.status}.`);
          setReviewingItem(null);
          setReviewReason("");
          setReviewRemarks("");
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to process KYC review.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Table Card (Module 1) */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Identity Verification (KYC) Queue
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Audit PAN details, banking credentials, and verify identity proofs.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-56">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search user, KYC code, PAN..."
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="resubmission_required">Resubmission</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="independent_partner">Independent Partner</option>
              <option value="team_member">Team Member</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Applicant / Entity</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">PAN (Masked)</th>
                <th className="py-3 px-4">Bank Account</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No KYC applications found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.kycCode} &bull; {item.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize font-medium text-slate-700">
                        {item.userRole.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.panMasked}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-900">{item.bankAccountMasked}</div>
                      <div className="text-[10px] text-slate-400">{item.ifscCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(item.submittedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          item.status === "approved"
                            ? "success"
                            : item.status === "rejected"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[10px] font-bold capitalize"
                      >
                        {item.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReviewingItem(item);
                          setReviewAction(item.status === "approved" ? "approve" : "approve");
                        }}
                        className="text-xs h-7 gap-1 font-semibold"
                      >
                        <Eye className="h-3 w-3" />
                        Audit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Audit & Action Modal */}
      {reviewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>KYC Application: {reviewingItem.kycCode}</span>
                <Badge variant="outline" className="text-xs capitalize font-bold">
                  {reviewingItem.status.replace("_", " ")}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Applicant: <span className="font-bold text-slate-900">{reviewingItem.fullName}</span> &bull; Role: {reviewingItem.userRole}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleExecuteReview}>
              <CardContent className="p-4 space-y-3.5">
                {/* Details Breakdown */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Address</span>
                    <span className="text-slate-800">{reviewingItem.address}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">PAN (Masked)</span>
                      <span className="font-mono font-bold text-slate-900">{reviewingItem.panMasked}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Birth</span>
                      <span className="text-slate-800">{reviewingItem.dateOfBirth}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank A/C</span>
                      <span className="font-mono font-bold text-slate-900">{reviewingItem.bankAccountMasked}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">IFSC / UPI</span>
                      <span className="font-mono text-slate-800">{reviewingItem.ifscCode}</span>
                    </div>
                  </div>
                </div>

                {/* Attached Documents */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-1">
                    Uploaded Verification Proofs:
                  </span>
                  <div className="space-y-1">
                    {reviewingItem.documents && reviewingItem.documents.length > 0 ? (
                      reviewingItem.documents.map((d) => (
                        <div key={d.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                          <span className="font-medium text-slate-800 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                            {d.documentName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 capitalize">{d.documentType.replace("_", " ")}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No document proofs attached</span>
                    )}
                  </div>
                </div>

                {/* Decision Selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Audit Decision *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewAction("approve")}
                      className={`p-2 rounded-lg text-xs font-bold border transition-colors ${
                        reviewAction === "approve"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction("request_correction")}
                      className={`p-2 rounded-lg text-xs font-bold border transition-colors ${
                        reviewAction === "request_correction"
                          ? "bg-amber-50 border-amber-500 text-amber-800"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      Resubmission
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction("reject")}
                      className={`p-2 rounded-lg text-xs font-bold border transition-colors ${
                        reviewAction === "reject"
                          ? "bg-rose-50 border-rose-500 text-rose-800"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {(reviewAction === "reject" || reviewAction === "request_correction") && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {reviewAction === "reject" ? "Rejection Reason *" : "Correction Instructions *"}
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      placeholder="e.g. Unclear PAN card image, bank account name mismatch..."
                      className="w-full text-xs p-2 rounded-lg border border-slate-200"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Internal Admin Remarks (Optional)
                  </label>
                  <Input
                    value={reviewRemarks}
                    onChange={(e) => setReviewRemarks(e.target.value)}
                    placeholder="Optional compliance audit notes..."
                    className="text-xs"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setReviewingItem(null)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className={
                    reviewAction === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      : reviewAction === "reject"
                      ? "bg-rose-600 hover:bg-rose-700 text-white font-bold"
                      : "bg-amber-600 hover:bg-amber-700 text-white font-bold"
                  }
                >
                  {isPending ? "Processing..." : `Confirm ${reviewAction.replace("_", " ").toUpperCase()}`}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
