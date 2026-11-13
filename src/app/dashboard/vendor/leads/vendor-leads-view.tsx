"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  X,
  Building,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";

export interface VendorLeadItem {
  id: string;
  leadCode: string;
  campaignId: string;
  campaignTitle: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  customerLocation: string | null;
  status: "pending" | "under_verification" | "approved" | "rejected" | "correction_requested" | "duplicate";
  commissionAmount: number;
  isDuplicate: boolean;
  teamId: string | null;
  teamName: string | null;
  submitterId: string;
  submitterName: string;
  createdAt: string;
}

interface VendorLeadsViewProps {
  initialLeads: VendorLeadItem[];
  campaignOptions: { id: string; name: string }[];
  teamOptions: { id: string; name: string }[];
  memberOptions: { id: string; name: string }[];
}

export function VendorLeadsView({
  initialLeads,
  campaignOptions,
  teamOptions,
  memberOptions,
}: VendorLeadsViewProps) {
  const [leads] = useState<VendorLeadItem[]>(initialLeads);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<VendorLeadItem | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Real Database Calculated Statistics (Module 9)
  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let duplicate = 0;

    for (const l of leads) {
      if (l.isDuplicate || l.status === "duplicate") duplicate++;
      else if (l.status === "pending" || l.status === "under_verification") pending++;
      else if (l.status === "approved") approved++;
      else if (l.status === "rejected") rejected++;
    }

    return {
      totalLeads: leads.length,
      pending,
      approved,
      rejected,
      duplicate,
    };
  }, [leads]);

  // Filtering
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesStatus = statusFilter === "all" ? true : l.status === statusFilter;
      const matchesCampaign = campaignFilter === "all" ? true : l.campaignId === campaignFilter;
      const matchesTeam = teamFilter === "all" ? true : l.teamId === teamFilter;
      const matchesMember = memberFilter === "all" ? true : l.submitterId === memberFilter;

      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        l.customerName.toLowerCase().includes(term) ||
        l.customerMobile.includes(term) ||
        l.leadCode.toLowerCase().includes(term) ||
        l.campaignTitle.toLowerCase().includes(term) ||
        l.submitterName.toLowerCase().includes(term);

      return matchesStatus && matchesCampaign && matchesTeam && matchesMember && matchesSearch;
    });
  }, [leads, searchTerm, statusFilter, campaignFilter, teamFilter, memberFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  const getStatusBadge = (status: VendorLeadItem["status"], isDup: boolean) => {
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
        return <Badge variant="outline" className="text-[10px] text-amber-700">Correction Req</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-[10px]">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Real Statistics Metric Cards (Module 9) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Leads</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{stats.totalLeads}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-amber-600 block">Pending</span>
            <span className="text-xl font-bold text-amber-700 mt-0.5 block">{stats.pending}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Approved</span>
            <span className="text-xl font-bold text-emerald-700 mt-0.5 block">{stats.approved}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-600 block">Rejected</span>
            <span className="text-xl font-bold text-rose-700 mt-0.5 block">{stats.rejected}</span>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-3 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Duplicates</span>
            <span className="text-xl font-bold text-slate-700 mt-0.5 block">{stats.duplicate}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search organization leads..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_verification">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="duplicate">Duplicate</option>
              </select>

              <select
                value={campaignFilter}
                onChange={(e) => {
                  setCampaignFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium max-w-[150px]"
              >
                <option value="all">All Campaigns</option>
                {campaignOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={teamFilter}
                onChange={(e) => {
                  setTeamFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium max-w-[140px]"
              >
                <option value="all">All Squads</option>
                {teamOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Brand Squad Inbound Leads ({filteredLeads.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Leads delivered by your appointed squads and promotional partners
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead Code</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Squad / Team</TableHead>
                    <TableHead>Promoter</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
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
                        <span className="font-mono text-[11px] text-slate-400">
                          {lead.customerMobile}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-800 font-medium truncate max-w-[180px]">
                        {lead.campaignTitle}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-blue-800">
                        {lead.teamName || <span className="text-slate-400 italic font-normal">Direct</span>}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {lead.submitterName}
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status, lead.isDuplicate)}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedLead(lead)}
                          className="h-7 text-xs px-2 gap-1 text-slate-700"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              No leads found for your organization matching current filters.
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

      {/* DETAIL MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Lead Details: {selectedLead.leadCode}
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
            <CardContent className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border">
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer Name</span>
                  <strong className="text-slate-800">{selectedLead.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer Mobile</span>
                  <strong className="font-mono text-slate-800">{selectedLead.customerMobile}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Assigned Squad</span>
                  <span className="font-semibold text-slate-800">{selectedLead.teamName || "Direct"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Promoter</span>
                  <span className="text-slate-800">{selectedLead.submitterName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status</span>
                  <div className="pt-0.5">{getStatusBadge(selectedLead.status, selectedLead.isDuplicate)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Submission Date</span>
                  <span className="font-mono text-slate-700">{formatDate(selectedLead.createdAt)}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t">
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
    </div>
  );
}

