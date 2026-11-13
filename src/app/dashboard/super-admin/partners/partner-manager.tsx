"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  Eye,
  X,
  Building,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import {
  approvePartnerAction,
  rejectPartnerAction,
  suspendPartnerAction,
  deactivatePartnerAction,
} from "./actions";

export interface PartnerItem {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  roleCode: string;
  roleName: string;
  status: "pending_approval" | "active" | "suspended" | "rejected" | "inactive";
  partnerIdCode: string | null;
  registrationType: "independent" | "team_member";
  associatedVendorName: string | null;
  referralCode: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  rejectionReason: string | null;
  suspensionReason: string | null;
  createdAt: string;
}

interface PartnerManagerProps {
  initialPartners: PartnerItem[];
}

export function PartnerManager({ initialPartners }: PartnerManagerProps) {
  const [partners, setPartners] = useState<PartnerItem[]>(initialPartners);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regTypeFilter, setRegTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedPartner, setSelectedPartner] = useState<PartnerItem | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: "approve" | "reject" | "suspend" | "deactivate";
    partner: PartnerItem;
  } | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter & Search Logic
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesStatus =
        statusFilter === "all" ? true : p.status === statusFilter;
      const matchesRegType =
        regTypeFilter === "all" ? true : p.registrationType === regTypeFilter;

      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        p.fullName.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (p.partnerIdCode && p.partnerIdCode.toLowerCase().includes(term)) ||
        (p.associatedVendorName && p.associatedVendorName.toLowerCase().includes(term)) ||
        (p.city && p.city.toLowerCase().includes(term)) ||
        p.phone.includes(term);

      return matchesStatus && matchesRegType && matchesSearch;
    });
  }, [partners, searchTerm, statusFilter, regTypeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPartners.length / pageSize));
  const paginatedPartners = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPartners.slice(start, start + pageSize);
  }, [filteredPartners, currentPage, pageSize]);

  // Handle Approve
  const handleApprove = (partner: PartnerItem) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await approvePartnerAction(partner.id);
        setPartners((prev) =>
          prev.map((p) =>
            p.id === partner.id
              ? {
                  ...p,
                  status: "active",
                  partnerIdCode: res.partnerIdCode,
                  rejectionReason: null,
                  suspensionReason: null,
                }
              : p
          )
        );
        if (selectedPartner?.id === partner.id) {
          setSelectedPartner((prev) =>
            prev
              ? {
                  ...prev,
                  status: "active",
                  partnerIdCode: res.partnerIdCode,
                  rejectionReason: null,
                  suspensionReason: null,
                }
              : null
          );
        }
        setActionModal(null);
        setFeedback({
          type: "success",
          text: `Partner approved successfully! Assigned ID: ${res.partnerIdCode}. Promotional and referral capabilities enabled.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Approval failed",
        });
      }
    });
  };

  // Handle Reject
  const handleReject = (partner: PartnerItem) => {
    if (!reasonInput.trim()) {
      setFeedback({ type: "error", text: "Rejection reason is required." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      try {
        await rejectPartnerAction(partner.id, reasonInput.trim());
        setPartners((prev) =>
          prev.map((p) =>
            p.id === partner.id
              ? { ...p, status: "rejected", rejectionReason: reasonInput.trim() }
              : p
          )
        );
        if (selectedPartner?.id === partner.id) {
          setSelectedPartner((prev) =>
            prev
              ? { ...prev, status: "rejected", rejectionReason: reasonInput.trim() }
              : null
          );
        }
        setActionModal(null);
        setReasonInput("");
        setFeedback({
          type: "success",
          text: `Partner application rejected.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Rejection failed",
        });
      }
    });
  };

  // Handle Suspend
  const handleSuspend = (partner: PartnerItem) => {
    if (!reasonInput.trim()) {
      setFeedback({ type: "error", text: "Suspension reason is required." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      try {
        await suspendPartnerAction(partner.id, reasonInput.trim());
        setPartners((prev) =>
          prev.map((p) =>
            p.id === partner.id
              ? { ...p, status: "suspended", suspensionReason: reasonInput.trim() }
              : p
          )
        );
        if (selectedPartner?.id === partner.id) {
          setSelectedPartner((prev) =>
            prev
              ? { ...prev, status: "suspended", suspensionReason: reasonInput.trim() }
              : null
          );
        }
        setActionModal(null);
        setReasonInput("");
        setFeedback({
          type: "success",
          text: `Partner suspended. Access to earning dashboard paused.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Suspension failed",
        });
      }
    });
  };

  // Handle Deactivate
  const handleDeactivate = (partner: PartnerItem) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await deactivatePartnerAction(partner.id);
        setPartners((prev) =>
          prev.map((p) => (p.id === partner.id ? { ...p, status: "inactive" } : p))
        );
        if (selectedPartner?.id === partner.id) {
          setSelectedPartner((prev) => (prev ? { ...prev, status: "inactive" } : null));
        }
        setActionModal(null);
        setFeedback({
          type: "success",
          text: `Partner deactivated.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Deactivation failed",
        });
      }
    });
  };

  const getStatusBadge = (status: PartnerItem["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="success" className="text-[10px]">Active</Badge>;
      case "pending_approval":
        return <Badge variant="warning" className="text-[10px]">Pending Approval</Badge>;
      case "suspended":
        return <Badge variant="destructive" className="text-[10px]">Suspended</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
      case "inactive":
        return <Badge variant="secondary" className="text-[10px]">Inactive</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search partner by name, email, Partner ID, city, or vendor..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses ({partners.length})</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Type:</span>
                <select
                  value={regTypeFilter}
                  onChange={(e) => {
                    setRegTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Registrations</option>
                  <option value="independent">Independent</option>
                  <option value="team_member">Vendor Invited</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Brand Promotion Partners & Affiliates
              </CardTitle>
              <CardDescription className="text-xs">
                Showing {filteredPartners.length} partners matching your criteria
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedPartners.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner ID</TableHead>
                    <TableHead>Partner Name</TableHead>
                    <TableHead>Role & Type</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Vendor Association</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPartners.map((partner) => (
                    <TableRow key={partner.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                        {partner.partnerIdCode || (
                          <span className="text-slate-400 font-normal italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-xs text-slate-900 block">
                          {partner.fullName}
                        </span>
                        {partner.city && (
                          <span className="text-[11px] text-slate-400 block">
                            {partner.city}, {partner.state}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-700">
                            {partner.roleName}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {partner.registrationType === "independent"
                              ? "Independent"
                              : "Vendor Invited"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-600 font-mono">{partner.email}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{partner.phone}</div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {partner.associatedVendorName ? (
                          <div className="flex items-center gap-1.5 text-blue-800 font-medium">
                            <Building className="h-3 w-3 text-blue-500" />
                            <span>{partner.associatedVendorName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None (Independent)</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(partner.status)}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(partner.createdAt)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPartner(partner)}
                            className="h-7 text-xs px-2 gap-1 text-slate-700"
                            title="View Full Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </Button>

                          {partner.status === "pending_approval" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  setActionModal({ type: "approve", partner })
                                }
                                disabled={isPending}
                                className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setReasonInput("");
                                  setActionModal({ type: "reject", partner });
                                }}
                                disabled={isPending}
                                className="h-7 text-xs px-2 gap-1"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </Button>
                            </>
                          )}

                          {partner.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReasonInput("");
                                setActionModal({ type: "suspend", partner });
                              }}
                              disabled={isPending}
                              className="h-7 text-xs px-2 text-amber-700 border-amber-300 hover:bg-amber-50 gap-1"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Suspend</span>
                            </Button>
                          )}

                          {partner.status === "suspended" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                setActionModal({ type: "approve", partner })
                              }
                              disabled={isPending}
                              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Reactivate</span>
                            </Button>
                          )}

                          {partner.status !== "inactive" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setActionModal({ type: "deactivate", partner })
                              }
                              disabled={isPending}
                              className="h-7 text-xs px-1.5 text-slate-400 hover:text-red-600"
                              title="Deactivate Partner"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No partners found matching current filters.
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 text-xs px-2"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 text-xs px-2"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETAIL MODAL / DRAWER */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>{selectedPartner.fullName}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedPartner.partnerIdCode ? (
                    <span className="font-mono font-bold text-blue-700">
                      Partner ID: {selectedPartner.partnerIdCode}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold">
                      Pending ID Allocation
                    </span>
                  )}
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedPartner(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Status Alert if Suspended or Rejected */}
              {selectedPartner.status === "rejected" && selectedPartner.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  <span className="font-bold block">Rejection Justification:</span>
                  <p className="mt-0.5">{selectedPartner.rejectionReason}</p>
                </div>
              )}
              {selectedPartner.status === "suspended" && selectedPartner.suspensionReason && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <span className="font-bold block">Suspension Justification:</span>
                  <p className="mt-0.5">{selectedPartner.suspensionReason}</p>
                </div>
              )}

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Full Name</span>
                  <span className="font-bold text-slate-800">{selectedPartner.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Account Status</span>
                  <div className="pt-0.5">{getStatusBadge(selectedPartner.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Role Classification</span>
                  <span className="font-bold text-slate-800">{selectedPartner.roleName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Registration Type</span>
                  <span className="capitalize font-semibold text-slate-800">
                    {selectedPartner.registrationType.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email Address</span>
                  <span className="font-mono text-slate-700">{selectedPartner.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Phone Number</span>
                  <span className="font-mono text-slate-700">{selectedPartner.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Date of Birth</span>
                  <span className="text-slate-700">{selectedPartner.dob || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Gender</span>
                  <span className="capitalize text-slate-700">{selectedPartner.gender || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Referral Code</span>
                  <span className="font-mono text-slate-700">
                    {selectedPartner.referralCode || "None"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Associated Vendor</span>
                  <span className="text-slate-700 font-semibold">
                    {selectedPartner.associatedVendorName || "None (Independent)"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block font-medium">Address</span>
                  <span className="text-slate-700">
                    {selectedPartner.address || "N/A"}, {selectedPartner.city || ""},{" "}
                    {selectedPartner.state || ""} {selectedPartner.pincode ? `- ${selectedPartner.pincode}` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Registration Date</span>
                  <span className="font-mono text-slate-700">
                    {formatDate(selectedPartner.createdAt)}
                  </span>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                {selectedPartner.status === "pending_approval" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleApprove(selectedPartner);
                      }}
                      disabled={isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5"
                    >
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Approve Partner</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setReasonInput("");
                        setActionModal({ type: "reject", partner: selectedPartner });
                      }}
                      disabled={isPending}
                      className="text-xs h-8"
                    >
                      Reject Application
                    </Button>
                  </>
                )}
                {selectedPartner.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReasonInput("");
                      setActionModal({ type: "suspend", partner: selectedPartner });
                    }}
                    disabled={isPending}
                    className="text-xs h-8 text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    Suspend Partner
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedPartner(null)}
                  className="text-xs h-8"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CONFIRMATION / ACTION MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                {actionModal.type === "approve" && "Confirm Partner Approval"}
                {actionModal.type === "reject" && "Reject Partner Application"}
                {actionModal.type === "suspend" && "Suspend Partner Account"}
                {actionModal.type === "deactivate" && "Deactivate Partner Account"}
              </CardTitle>
              <CardDescription className="text-xs">
                Target: {actionModal.partner.fullName} ({actionModal.partner.email})
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {actionModal.type === "approve" && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                    <span className="font-bold block">Approval Operations:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                      <li>Generates transactional unique Partner ID (e.g. LMB-PAR-000001)</li>
                      <li>Activates Partner dashboard & referral privileges</li>
                      <li>Triggers partner agreement & onboarding workflow</li>
                    </ul>
                  </div>
                  <p className="text-xs text-slate-600">
                    Are you sure you want to approve this partner application?
                  </p>
                </div>
              )}

              {actionModal.type === "reject" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-800 block">
                    Reason for Rejection *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide specific justification..."
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {actionModal.type === "suspend" && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-800 block">
                    Suspension Justification *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Specify cause for suspension..."
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}

              {actionModal.type === "deactivate" && (
                <p className="text-xs text-slate-600">
                  Are you sure you want to permanently deactivate this partner account? Login access will be disabled immediately.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActionModal(null)}
                  disabled={isPending}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>

                {actionModal.type === "approve" && (
                  <Button
                    onClick={() => handleApprove(actionModal.partner)}
                    disabled={isPending}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Confirm Approval</span>
                  </Button>
                )}

                {actionModal.type === "reject" && (
                  <Button
                    onClick={() => handleReject(actionModal.partner)}
                    disabled={isPending || !reasonInput.trim()}
                    className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Reject Application</span>
                  </Button>
                )}

                {actionModal.type === "suspend" && (
                  <Button
                    onClick={() => handleSuspend(actionModal.partner)}
                    disabled={isPending || !reasonInput.trim()}
                    className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Suspend Partner</span>
                  </Button>
                )}

                {actionModal.type === "deactivate" && (
                  <Button
                    onClick={() => handleDeactivate(actionModal.partner)}
                    disabled={isPending}
                    className="h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white font-semibold gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Deactivate</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
