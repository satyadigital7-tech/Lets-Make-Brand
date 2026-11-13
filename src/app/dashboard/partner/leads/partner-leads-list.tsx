"use client";

import React, { useState, useTransition } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  X,
  Loader2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import { resubmitLeadAction } from "@/app/dashboard/super-admin/leads/actions";

export interface PartnerLeadItem {
  id: string;
  leadCode: string;
  campaignTitle: string;
  campaignBrand: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  customerLocation: string | null;
  status: "pending" | "under_verification" | "approved" | "rejected" | "correction_requested" | "duplicate";
  rejectionReason: string | null;
  correctionNotes: string | null;
  commissionAmount: number;
  isDuplicate: boolean;
  createdAt: string;
  documents: { id: string; name: string; url: string }[];
}

interface PartnerLeadsListProps {
  initialLeads: PartnerLeadItem[];
}

export function PartnerLeadsList({ initialLeads }: PartnerLeadsListProps) {
  const [leads, setLeads] = useState<PartnerLeadItem[]>(initialLeads);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<PartnerLeadItem | null>(null);

  // Correction Resubmission State
  const [resubmittingLead, setResubmittingLead] = useState<PartnerLeadItem | null>(null);
  const [correctionInput, setCorrectionInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredLeads = leads.filter((l) => {
    const matchesStatus = statusFilter === "all" ? true : l.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      l.customerName.toLowerCase().includes(term) ||
      l.customerMobile.includes(term) ||
      l.leadCode.toLowerCase().includes(term) ||
      l.campaignTitle.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  const handleResubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmittingLead) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        await resubmitLeadAction(resubmittingLead.id, correctionInput.trim());
        setLeads((prev) =>
          prev.map((l) =>
            l.id === resubmittingLead.id
              ? { ...l, status: "pending", correctionNotes: null }
              : l
          )
        );
        setResubmittingLead(null);
        setCorrectionInput("");
        setFeedback({
          type: "success",
          text: `Lead ${resubmittingLead.leadCode} resubmitted successfully for admin verification!`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to resubmit lead",
        });
      }
    });
  };

  const getStatusBadge = (status: PartnerLeadItem["status"], isDup: boolean) => {
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
        return <Badge variant="warning" className="text-[10px]">Pending Verification</Badge>;
      case "under_verification":
        return <Badge variant="brand" className="text-[10px]">Under Review</Badge>;
      case "correction_requested":
        return <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-300">Action Required</Badge>;
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
                placeholder="Search your submitted leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Submissions ({leads.length})</option>
                <option value="pending">Pending</option>
                <option value="under_verification">Under Review</option>
                <option value="approved">Approved</option>
                <option value="correction_requested">Correction Requested</option>
                <option value="rejected">Rejected</option>
                <option value="duplicate">Duplicate</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Your Submitted Leads ({filteredLeads.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Review customer referral qualification progression and accrued commission eligibility
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking Code</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Promotional Campaign</TableHead>
                    <TableHead>Contact Phone</TableHead>
                    <TableHead>Accrued Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
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
                          {lead.campaignBrand}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {lead.customerMobile}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-emerald-700">
                        {formatCurrency(lead.commissionAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status, lead.isDuplicate)}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedLead(lead)}
                            className="h-7 text-xs px-2 gap-1 text-slate-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </Button>

                          {lead.status === "correction_requested" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setCorrectionInput("");
                                setResubmittingLead(lead);
                              }}
                              className="h-7 text-xs px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              <span>Fix & Resubmit</span>
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
            <div className="p-12 text-center text-xs text-slate-500">
              No submitted leads found. Submit customer leads from the Active Campaigns catalog.
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETAIL DRAWER / MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 max-h-[85vh] overflow-y-auto">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Lead Tracking Details</span>
                  <Badge variant="outline" className="font-mono text-xs text-blue-700">
                    {selectedLead.leadCode}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedLead.campaignTitle}
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
              {selectedLead.status === "correction_requested" && selectedLead.correctionNotes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-xs text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Admin Requested Correction:
                  </span>
                  <p className="text-[11px] text-amber-800">{selectedLead.correctionNotes}</p>
                </div>
              )}

              {selectedLead.status === "rejected" && selectedLead.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 space-y-1">
                  <span className="font-bold block text-xs text-red-800">
                    Rejection Justification:
                  </span>
                  <p className="text-[11px] text-red-800">{selectedLead.rejectionReason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer Name</span>
                  <strong className="text-slate-800">{selectedLead.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Mobile</span>
                  <strong className="font-mono text-slate-800">{selectedLead.customerMobile}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Email</span>
                  <span className="font-mono text-slate-800">{selectedLead.customerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status</span>
                  <div className="pt-0.5">{getStatusBadge(selectedLead.status, selectedLead.isDuplicate)}</div>
                </div>
              </div>

              {selectedLead.documents.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="font-bold text-slate-700 block">Uploaded Documents</span>
                  {selectedLead.documents.map((d) => (
                    <div
                      key={d.id}
                      className="p-2 rounded border bg-white flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-800">{d.name}</span>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>View</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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

      {/* RESUBMIT MODAL */}
      {resubmittingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Resubmit Corrected Lead
              </CardTitle>
              <CardDescription className="text-xs">
                {resubmittingLead.leadCode}: {resubmittingLead.customerName}
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleResubmit}>
              <CardContent className="p-5 space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <span className="font-bold block">Correction Notice:</span>
                  <p className="mt-0.5">{resubmittingLead.correctionNotes}</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="resubmit-notes" className="text-xs font-semibold">
                    Explanation of Corrections / Updated Data *
                  </Label>
                  <textarea
                    id="resubmit-notes"
                    rows={3}
                    required
                    placeholder="Describe how the requested corrections were resolved..."
                    value={correctionInput}
                    onChange={(e) => setCorrectionInput(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setResubmittingLead(null)}
                    disabled={isPending}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || !correctionInput.trim()}
                    className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Resubmit Lead</span>
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

