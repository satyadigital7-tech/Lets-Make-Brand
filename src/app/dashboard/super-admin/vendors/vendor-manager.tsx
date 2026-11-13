"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Building,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  Eye,
  X,
  Users,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import {
  approveVendorAction,
  rejectVendorAction,
  suspendVendorAction,
  deactivateVendorAction,
} from "./actions";

export interface VendorTeamInfo {
  id: string;
  teamCode: string;
  name: string;
  leaderName?: string | null;
  memberCount: number;
}

export interface VendorItem {
  id: string;
  email: string;
  fullName: string;
  businessName: string;
  phone: string;
  status: "pending_approval" | "active" | "suspended" | "rejected" | "inactive";
  vendorIdCode: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  rejectionReason: string | null;
  suspensionReason: string | null;
  createdAt: string;
  teams: VendorTeamInfo[];
}

interface VendorManagerProps {
  initialVendors: VendorItem[];
}

export function VendorManager({ initialVendors }: VendorManagerProps) {
  const [vendors, setVendors] = useState<VendorItem[]>(initialVendors);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: "approve" | "reject" | "suspend" | "deactivate";
    vendor: VendorItem;
  } | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter & Search Logic
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesStatus =
        statusFilter === "all" ? true : v.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        v.fullName.toLowerCase().includes(term) ||
        v.businessName.toLowerCase().includes(term) ||
        v.email.toLowerCase().includes(term) ||
        (v.vendorIdCode && v.vendorIdCode.toLowerCase().includes(term)) ||
        (v.city && v.city.toLowerCase().includes(term)) ||
        v.phone.includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [vendors, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / pageSize));
  const paginatedVendors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVendors.slice(start, start + pageSize);
  }, [filteredVendors, currentPage, pageSize]);

  // Handle Approve
  const handleApprove = (vendor: VendorItem) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await approveVendorAction(vendor.id);
        setVendors((prev) =>
          prev.map((v) =>
            v.id === vendor.id
              ? {
                  ...v,
                  status: "active",
                  vendorIdCode: res.vendorIdCode,
                  rejectionReason: null,
                  suspensionReason: null,
                }
              : v
          )
        );
        if (selectedVendor?.id === vendor.id) {
          setSelectedVendor((prev) =>
            prev
              ? {
                  ...prev,
                  status: "active",
                  vendorIdCode: res.vendorIdCode,
                  rejectionReason: null,
                  suspensionReason: null,
                }
              : null
          );
        }
        setActionModal(null);
        setFeedback({
          type: "success",
          text: `Vendor approved successfully! Assigned ID: ${res.vendorIdCode}. Onboarding documentation workflow initiated.`,
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
  const handleReject = (vendor: VendorItem) => {
    if (!reasonInput.trim()) {
      setFeedback({ type: "error", text: "Rejection reason is required." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      try {
        await rejectVendorAction(vendor.id, reasonInput.trim());
        setVendors((prev) =>
          prev.map((v) =>
            v.id === vendor.id
              ? { ...v, status: "rejected", rejectionReason: reasonInput.trim() }
              : v
          )
        );
        if (selectedVendor?.id === vendor.id) {
          setSelectedVendor((prev) =>
            prev
              ? { ...prev, status: "rejected", rejectionReason: reasonInput.trim() }
              : null
          );
        }
        setActionModal(null);
        setReasonInput("");
        setFeedback({
          type: "success",
          text: `Vendor application rejected. Status updated to rejected.`,
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
  const handleSuspend = (vendor: VendorItem) => {
    if (!reasonInput.trim()) {
      setFeedback({ type: "error", text: "Suspension reason is required." });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      try {
        await suspendVendorAction(vendor.id, reasonInput.trim());
        setVendors((prev) =>
          prev.map((v) =>
            v.id === vendor.id
              ? { ...v, status: "suspended", suspensionReason: reasonInput.trim() }
              : v
          )
        );
        if (selectedVendor?.id === vendor.id) {
          setSelectedVendor((prev) =>
            prev
              ? { ...prev, status: "suspended", suspensionReason: reasonInput.trim() }
              : null
          );
        }
        setActionModal(null);
        setReasonInput("");
        setFeedback({
          type: "success",
          text: `Vendor suspended per Module 9 lifecycle policy (Associated team members preserved).`,
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
  const handleDeactivate = (vendor: VendorItem) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await deactivateVendorAction(vendor.id);
        setVendors((prev) =>
          prev.map((v) => (v.id === vendor.id ? { ...v, status: "inactive" } : v))
        );
        if (selectedVendor?.id === vendor.id) {
          setSelectedVendor((prev) => (prev ? { ...prev, status: "inactive" } : null));
        }
        setActionModal(null);
        setFeedback({
          type: "success",
          text: `Vendor deactivated. Access revoked.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Deactivation failed",
        });
      }
    });
  };

  const getStatusBadge = (status: VendorItem["status"]) => {
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
                placeholder="Search vendor by name, business, email, ID or city..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
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
                <option value="all">All Vendors ({vendors.length})</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Registered Merchant Brands & Vendors
              </CardTitle>
              <CardDescription className="text-xs">
                Showing {filteredVendors.length} vendors matching your criteria
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedVendors.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor ID</TableHead>
                    <TableHead>Business / Brand</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedVendors.map((vendor) => (
                    <TableRow key={vendor.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                        {vendor.vendorIdCode || (
                          <span className="text-slate-400 font-normal italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="font-bold text-xs text-slate-900">
                            {vendor.businessName}
                          </span>
                        </div>
                        {vendor.city && (
                          <span className="text-[11px] text-slate-400 block pl-5.5">
                            {vendor.city}, {vendor.state}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {vendor.fullName}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-600 font-mono">{vendor.email}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{vendor.phone}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                      <TableCell className="text-xs text-slate-600">
                        <span className="font-bold text-slate-800">{vendor.teams.length}</span>{" "}
                        {vendor.teams.length === 1 ? "team" : "teams"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(vendor.createdAt)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedVendor(vendor)}
                            className="h-7 text-xs px-2 gap-1 text-slate-700"
                            title="View Full Profile & Teams"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </Button>

                          {vendor.status === "pending_approval" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  setActionModal({ type: "approve", vendor })
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
                                  setActionModal({ type: "reject", vendor });
                                }}
                                disabled={isPending}
                                className="h-7 text-xs px-2 gap-1"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </Button>
                            </>
                          )}

                          {vendor.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReasonInput("");
                                setActionModal({ type: "suspend", vendor });
                              }}
                              disabled={isPending}
                              className="h-7 text-xs px-2 text-amber-700 border-amber-300 hover:bg-amber-50 gap-1"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>Suspend</span>
                            </Button>
                          )}

                          {vendor.status === "suspended" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                setActionModal({ type: "approve", vendor })
                              }
                              disabled={isPending}
                              className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Reactivate</span>
                            </Button>
                          )}

                          {vendor.status !== "inactive" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setActionModal({ type: "deactivate", vendor })
                              }
                              disabled={isPending}
                              className="h-7 text-xs px-1.5 text-slate-400 hover:text-red-600"
                              title="Deactivate Vendor"
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
              No vendors found matching current filters.
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
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  <span>{selectedVendor.businessName}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedVendor.vendorIdCode ? (
                    <span className="font-mono font-bold text-blue-700">
                      ID: {selectedVendor.vendorIdCode}
                    </span>
                  ) : (
                    <span className="text-amber-600 font-semibold">
                      Pending ID Allocation
                    </span>
                  )}
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Status Alert if Suspended or Rejected */}
              {selectedVendor.status === "rejected" && selectedVendor.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                  <span className="font-bold block">Rejection Justification:</span>
                  <p className="mt-0.5">{selectedVendor.rejectionReason}</p>
                </div>
              )}
              {selectedVendor.status === "suspended" && selectedVendor.suspensionReason && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <span className="font-bold block">Suspension Justification:</span>
                  <p className="mt-0.5">{selectedVendor.suspensionReason}</p>
                </div>
              )}

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Contact Person</span>
                  <span className="font-bold text-slate-800">{selectedVendor.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Account Status</span>
                  <div className="pt-0.5">{getStatusBadge(selectedVendor.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Email Address</span>
                  <span className="font-mono text-slate-700">{selectedVendor.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Phone Number</span>
                  <span className="font-mono text-slate-700">{selectedVendor.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Address</span>
                  <span className="text-slate-700">{selectedVendor.address || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Location</span>
                  <span className="text-slate-700">
                    {selectedVendor.city || "N/A"}, {selectedVendor.state || "N/A"} -{" "}
                    {selectedVendor.pincode || ""}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Registration Date</span>
                  <span className="font-mono text-slate-700">
                    {formatDate(selectedVendor.createdAt)}
                  </span>
                </div>
              </div>

              {/* Associated Teams Section */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Associated Teams ({selectedVendor.teams.length})</span>
                  </h4>
                </div>

                {selectedVendor.teams.length > 0 ? (
                  <div className="space-y-2">
                    {selectedVendor.teams.map((team) => (
                      <div
                        key={team.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{team.name}</span>
                            <Badge variant="outline" className="font-mono text-[10px]">
                              {team.teamCode}
                            </Badge>
                          </div>
                          <span className="text-slate-500 text-[11px] block mt-0.5">
                            Leader: {team.leaderName || "Unassigned"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-blue-600">{team.memberCount}</span>
                          <span className="text-slate-400 block text-[10px]">Members</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No teams established yet.</p>
                )}
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                {selectedVendor.status === "pending_approval" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleApprove(selectedVendor);
                      }}
                      disabled={isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5"
                    >
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Approve Application</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setReasonInput("");
                        setActionModal({ type: "reject", vendor: selectedVendor });
                      }}
                      disabled={isPending}
                      className="text-xs h-8"
                    >
                      Reject Application
                    </Button>
                  </>
                )}
                {selectedVendor.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReasonInput("");
                      setActionModal({ type: "suspend", vendor: selectedVendor });
                    }}
                    disabled={isPending}
                    className="text-xs h-8 text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    Suspend Vendor
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedVendor(null)}
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
                {actionModal.type === "approve" && "Confirm Vendor Approval"}
                {actionModal.type === "reject" && "Reject Vendor Application"}
                {actionModal.type === "suspend" && "Suspend Vendor Account"}
                {actionModal.type === "deactivate" && "Deactivate Vendor Account"}
              </CardTitle>
              <CardDescription className="text-xs">
                Target: {actionModal.vendor.businessName} ({actionModal.vendor.email})
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {actionModal.type === "approve" && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                    <span className="font-bold block">Approval Operations:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                      <li>Generates transactional unique ID (e.g. LMB-VEN-000001)</li>
                      <li>Activates vendor dashboard login permissions</li>
                      <li>Initiates legal onboarding document generation workflow</li>
                    </ul>
                  </div>
                  <p className="text-xs text-slate-600">
                    Are you sure you want to approve this vendor application?
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
                    placeholder="Provide specific justification (e.g. Incomplete business address or unverified credentials)..."
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {actionModal.type === "suspend" && (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Module 9 Lifecycle Policy:
                    </span>
                    <p className="text-amber-800/90 text-[11px]">
                      Suspending this vendor revokes vendor dashboard access but preserves associated Team Leaders, Team Members, and Partner commissions.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-800 block">
                      Suspension Justification *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Specify cause for suspension (e.g. Policy violation or compliance inquiry)..."
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {actionModal.type === "deactivate" && (
                <p className="text-xs text-slate-600">
                  Are you sure you want to permanently deactivate this vendor account? Login access will be disabled immediately.
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
                    onClick={() => handleApprove(actionModal.vendor)}
                    disabled={isPending}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Confirm Approval</span>
                  </Button>
                )}

                {actionModal.type === "reject" && (
                  <Button
                    onClick={() => handleReject(actionModal.vendor)}
                    disabled={isPending || !reasonInput.trim()}
                    className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Reject Application</span>
                  </Button>
                )}

                {actionModal.type === "suspend" && (
                  <Button
                    onClick={() => handleSuspend(actionModal.vendor)}
                    disabled={isPending || !reasonInput.trim()}
                    className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Suspend Vendor</span>
                  </Button>
                )}

                {actionModal.type === "deactivate" && (
                  <Button
                    onClick={() => handleDeactivate(actionModal.vendor)}
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

