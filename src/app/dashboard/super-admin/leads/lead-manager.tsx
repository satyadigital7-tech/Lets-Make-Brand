"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  X,
  Loader2,
  Calendar,
  Building,
  Users,
  FileText,
  Download,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { reviewLeadAction } from "./actions";

export interface LeadDocumentItem {
  id: string;
  documentName: string;
  documentType: string | null;
  fileUrl: string;
}

export interface LeadHistoryItem {
  id: string;
  actorName: string;
  action: string;
  previousStatus: string | null;
  newStatus: string;
  comments: string | null;
  createdAt: string;
}

export interface LeadItem {
  id: string;
  leadCode: string;
  campaignId: string;
  campaignTitle: string;
  campaignBrand: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  customerLocation: string | null;
  address: string | null;
  additionalFields: Record<string, any>;
  status: "pending" | "under_verification" | "approved" | "rejected" | "correction_requested" | "duplicate";
  rejectionReason: string | null;
  correctionNotes: string | null;
  commissionAmount: number;
  isDuplicate: boolean;
  duplicateOfLeadCode: string | null;
  submittedByName: string;
  submittedByEmail: string;
  vendorName: string | null;
  teamName: string | null;
  createdAt: string;
  documents: LeadDocumentItem[];
  history: LeadHistoryItem[];
}

export interface FilterOption {
  id: string;
  name: string;
}

interface LeadManagerProps {
  initialLeads: LeadItem[];
  campaignOptions: FilterOption[];
  vendorOptions: FilterOption[];
  teamOptions: FilterOption[];
}

export function LeadManager({
  initialLeads,
  campaignOptions,
  vendorOptions,
  teamOptions,
}: LeadManagerProps) {
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Review Action Modal
  const [actionModal, setActionModal] = useState<{
    lead: LeadItem;
    action: "approve" | "reject" | "request_correction" | "mark_under_verification";
  } | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  // Filtering
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesStatus =
        statusFilter === "all" ? true : l.status === statusFilter;
      const matchesCampaign =
        campaignFilter === "all" ? true : l.campaignId === campaignFilter;
      const matchesVendor =
        vendorFilter === "all"
          ? true
          : l.vendorName?.toLowerCase().includes(vendorFilter.toLowerCase());

      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        l.customerName.toLowerCase().includes(term) ||
        l.customerMobile.includes(term) ||
        l.customerEmail.toLowerCase().includes(term) ||
        l.leadCode.toLowerCase().includes(term) ||
        l.campaignTitle.toLowerCase().includes(term) ||
        l.submittedByName.toLowerCase().includes(term);

      return matchesStatus && matchesCampaign && matchesVendor && matchesSearch;
    });
  }, [leads, searchTerm, statusFilter, campaignFilter, vendorFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  const handleReviewConfirm = () => {
    if (!actionModal) return;
    setFeedback(null);

    const { lead, action } = actionModal;

    startTransition(async () => {
      try {
        const res = await reviewLeadAction({
          leadId: lead.id,
          action,
          reason: reasonInput.trim() || undefined,
        });

        const newHistoryItem: LeadHistoryItem = {
          id: `hist_${Date.now()}`,
          actorName: "You (Admin)",
          action: action.toUpperCase(),
          previousStatus: lead.status,
          newStatus: res.newStatus,
          comments: reasonInput.trim() || null,
          createdAt: new Date().toISOString(),
        };

        const updatedLead: LeadItem = {
          ...lead,
          status: res.newStatus,
          rejectionReason: action === "reject" ? reasonInput.trim() : lead.rejectionReason,
          correctionNotes: action === "request_correction" ? reasonInput.trim() : lead.correctionNotes,
          history: [newHistoryItem, ...lead.history],
        };

        setLeads((prev) => prev.map((l) => (l.id === lead.id ? updatedLead : l)));
        if (selectedLead?.id === lead.id) {
          setSelectedLead(updatedLead);
        }

        setActionModal(null);
        setReasonInput("");
        setFeedback({
          type: "success",
          text: `Lead ${lead.leadCode} marked as ${res.newStatus}. Notifications dispatched.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Review action failed",
        });
      }
    });
  };

  const getStatusBadge = (status: LeadItem["status"], isDup: boolean) => {
    if (isDup || status === "duplicate") {
      return (
        <Badge variant="destructive" className="text-[10px] gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Duplicate</span>
        </Badge>
      );
    }
    switch (status) {
      case "approved":
        return <Badge variant="success" className="text-[10px]">Approved</Badge>;
      case "pending":
        return <Badge variant="warning" className="text-[10px]">Pending</Badge>;
      case "under_verification":
        return <Badge variant="brand" className="text-[10px]">Under Review</Badge>;
      case "correction_requested":
        return <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">Correction Req</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
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
                placeholder="Search leads by customer, mobile, email, code or campaign..."
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
                  <option value="all">All Statuses ({leads.length})</option>
                  <option value="pending">Pending</option>
                  <option value="under_verification">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="correction_requested">Correction Requested</option>
                  <option value="rejected">Rejected</option>
                  <option value="duplicate">Duplicate</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Campaign:</span>
                <select
                  value={campaignFilter}
                  onChange={(e) => {
                    setCampaignFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[160px]"
                >
                  <option value="all">All Campaigns</option>
                  {campaignOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Promotional Inbound Leads ({filteredLeads.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Review customer applications, verify supporting documents, and authorize commission qualification
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead ID</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Promoter / Partner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                        {lead.leadCode}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-xs text-slate-900 block">
                          {lead.customerName}
                        </span>
                        {lead.customerLocation && (
                          <span className="text-[11px] text-slate-400 block">
                            {lead.customerLocation}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-xs text-slate-800 block truncate max-w-[180px]">
                          {lead.campaignTitle}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Brand: {lead.campaignBrand}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-600 font-mono">{lead.customerMobile}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">
                          {lead.customerEmail}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-slate-800 block">
                          {lead.submittedByName}
                        </span>
                        {lead.teamName && (
                          <span className="text-[10px] text-blue-700 block font-mono">
                            Squad: {lead.teamName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status, lead.isDuplicate)}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedLead(lead)}
                            className="h-7 text-xs px-2 gap-1 text-slate-700"
                            title="Inspect Details & History"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </Button>

                          {lead.status === "pending" || lead.status === "under_verification" ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  setActionModal({ lead, action: "approve" })
                                }
                                disabled={isPending || lead.isDuplicate}
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
                                  setActionModal({ lead, action: "reject" });
                                }}
                                disabled={isPending}
                                className="h-7 text-xs px-2 gap-1"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              No leads found matching current filters.
            </div>
          )}

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

      {/* DETAIL MODAL WITH AUDIT HISTORY (Module 5 & 10) */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Lead Verification File</span>
                  <Badge variant="outline" className="font-mono text-xs text-blue-700">
                    {selectedLead.leadCode}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedLead.campaignTitle} ({selectedLead.campaignBrand})
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-6 text-xs">
              {/* Duplicate Notice */}
              {selectedLead.isDuplicate && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Duplicate Record Flagged (Module 7)
                  </span>
                  <p className="text-[11px] text-red-700">
                    This submission matched an existing customer entry for this campaign. Commission payout is disabled (₹0).
                  </p>
                </div>
              )}

              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    Current Status
                  </span>
                  <div className="pt-0.5">{getStatusBadge(selectedLead.status, selectedLead.isDuplicate)}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">
                    Potential Commission
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    {formatCurrency(selectedLead.commissionAmount)}
                  </span>
                </div>
              </div>

              {/* Customer Contact Details */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
                  Customer & Submitter Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-medium">Customer Legal Name</span>
                    <strong className="text-slate-800">{selectedLead.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Mobile Number</span>
                    <strong className="font-mono text-slate-800">{selectedLead.customerMobile}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Email Address</span>
                    <span className="font-mono text-slate-800">{selectedLead.customerEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Location</span>
                    <span className="text-slate-800">
                      {selectedLead.customerLocation || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Promoter / Partner</span>
                    <span className="font-semibold text-slate-800">{selectedLead.submittedByName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Owning Vendor / Squad</span>
                    <span className="text-slate-800">
                      {selectedLead.vendorName || "Independent"} {selectedLead.teamName ? `(${selectedLead.teamName})` : ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Dynamic Fields Answers */}
              {Object.keys(selectedLead.additionalFields).length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
                    Custom Campaign Questions & Answers
                  </h4>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border">
                    {Object.entries(selectedLead.additionalFields).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-slate-400 block capitalize text-[10px]">
                          {k.replace(/_/g, " ")}
                        </span>
                        <strong className="text-slate-800">{String(v)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supporting Documents (Module 5) */}
              <div className="space-y-2 pt-1">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
                  Supporting Documents ({selectedLead.documents.length})
                </h4>
                {selectedLead.documents.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedLead.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="font-bold text-slate-800">{doc.documentName}</span>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>View File</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No supporting documents uploaded.</p>
                )}
              </div>

              {/* Immutable Audit Status History (Module 10) */}
              <div className="space-y-2 pt-1">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 border-b pb-1 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-blue-600" />
                  <span>Immutable Status History Ledger (Module 10)</span>
                </h4>
                {selectedLead.history.length > 0 ? (
                  <div className="space-y-2">
                    {selectedLead.history.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 uppercase">
                            {h.action}
                          </span>
                          <span className="font-mono text-slate-400">
                            {formatDate(h.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <span>Actor: <strong>{h.actorName}</strong></span>
                          {h.previousStatus && (
                            <span>Transition: {h.previousStatus} → <strong>{h.newStatus}</strong></span>
                          )}
                        </div>
                        {h.comments && (
                          <p className="text-slate-700 italic border-l-2 border-slate-300 pl-2 mt-1">
                            &quot;{h.comments}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No historical transitions recorded yet.</p>
                )}
              </div>

              {/* Review Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                {selectedLead.status !== "approved" && !selectedLead.isDuplicate && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setReasonInput("");
                      setActionModal({ lead: selectedLead, action: "approve" });
                    }}
                    disabled={isPending}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Approve Lead</span>
                  </Button>
                )}

                {selectedLead.status !== "correction_requested" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReasonInput("");
                      setActionModal({ lead: selectedLead, action: "request_correction" });
                    }}
                    disabled={isPending}
                    className="h-8 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    Request Correction
                  </Button>
                )}

                {selectedLead.status !== "under_verification" && selectedLead.status !== "approved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReasonInput("");
                      setActionModal({ lead: selectedLead, action: "mark_under_verification" });
                    }}
                    disabled={isPending}
                    className="h-8 text-xs text-blue-700 border-blue-300 hover:bg-blue-50"
                  >
                    Mark Under Review
                  </Button>
                )}

                {selectedLead.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setReasonInput("");
                      setActionModal({ lead: selectedLead, action: "reject" });
                    }}
                    disabled={isPending}
                    className="h-8 text-xs"
                  >
                    Reject Lead
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedLead(null)}
                  className="h-8 text-xs"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ACTION CONFIRMATION MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                {actionModal.action === "approve" && "Confirm Lead Approval"}
                {actionModal.action === "reject" && "Reject Lead Submission"}
                {actionModal.action === "request_correction" && "Request Submitter Correction"}
                {actionModal.action === "mark_under_verification" && "Place Under Verification"}
              </CardTitle>
              <CardDescription className="text-xs">
                Target: {actionModal.lead.leadCode} ({actionModal.lead.customerName})
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {actionModal.action === "approve" && (
                <div className="space-y-2 text-xs text-slate-600">
                  <p>
                    Approving this lead validates the customer qualification and authorizes commission payout of{" "}
                    <strong className="text-emerald-700 font-bold">
                      {formatCurrency(actionModal.lead.commissionAmount)}
                    </strong>{" "}
                    to the submitting partner.
                  </p>
                </div>
              )}

              {(actionModal.action === "reject" || actionModal.action === "request_correction") && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-800 block">
                    {actionModal.action === "reject" ? "Reason for Rejection *" : "Correction Instructions *"}
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={
                      actionModal.action === "reject"
                        ? "Specify reason (e.g. Ineligible customer income, unverified contact)..."
                        : "Explain what the partner needs to fix or upload..."
                    }
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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

                <Button
                  onClick={handleReviewConfirm}
                  disabled={
                    isPending ||
                    ((actionModal.action === "reject" || actionModal.action === "request_correction") &&
                      !reasonInput.trim())
                  }
                  className={`h-8 text-xs font-semibold gap-1.5 text-white ${
                    actionModal.action === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : actionModal.action === "reject"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Action</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

