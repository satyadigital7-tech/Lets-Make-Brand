"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Building,
  Users,
  Search,
  Eye,
  X,
  FileCheck,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Edit3,
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
  requestVendorCorrectionAction,
} from "../vendors/actions";
import {
  approvePartnerAction,
  rejectPartnerAction,
  requestPartnerCorrectionAction,
} from "../partners/actions";

export interface PendingItem {
  id: string;
  type: "vendor" | "partner";
  displayName: string;
  secondaryName: string; // Business name for vendor, role for partner
  email: string;
  phone: string;
  address?: string | null;
  city: string | null;
  state: string | null;
  pincode?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

interface ApprovalQueueProps {
  initialItems: PendingItem[];
}

export function ApprovalQueue({ initialItems }: ApprovalQueueProps) {
  const [items, setItems] = useState<PendingItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<"all" | "vendor" | "partner">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [viewItem, setViewItem] = useState<PendingItem | null>(null);
  const [rejectItem, setRejectItem] = useState<PendingItem | null>(null);
  const [correctionItem, setCorrectionItem] = useState<PendingItem | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab !== "all" && item.type !== activeTab) return false;
      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase().trim();
      return (
        item.displayName.toLowerCase().includes(term) ||
        item.secondaryName.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.phone.includes(term) ||
        (item.city && item.city.toLowerCase().includes(term)) ||
        (item.state && item.state.toLowerCase().includes(term))
      );
    });
  }, [items, activeTab, searchTerm]);

  const handleApprove = (item: PendingItem) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        if (item.type === "vendor") {
          const res = await approveVendorAction(item.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          setFeedback({
            type: "success",
            text: `Vendor approved successfully! Assigned ID: ${res.vendorIdCode}. Onboarding workflow initiated.`,
          });
        } else {
          const res = await approvePartnerAction(item.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          setFeedback({
            type: "success",
            text: `Partner approved successfully! Assigned ID: ${res.partnerIdCode}. Partner dashboard activated.`,
          });
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Approval failed",
        });
      }
    });
  };

  const handleRejectConfirm = () => {
    if (!rejectItem || !reasonInput.trim()) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        if (rejectItem.type === "vendor") {
          await rejectVendorAction(rejectItem.id, reasonInput.trim());
        } else {
          await rejectPartnerAction(rejectItem.id, reasonInput.trim());
        }
        setItems((prev) => prev.filter((i) => i.id !== rejectItem.id));
        setRejectItem(null);
        setReasonInput("");
        setFeedback({
          type: "success",
          text: `Application rejected and security audit recorded.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Rejection failed",
        });
      }
    });
  };

  const handleCorrectionConfirm = () => {
    if (!correctionItem || !reasonInput.trim()) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        if (correctionItem.type === "vendor") {
          await requestVendorCorrectionAction(correctionItem.id, reasonInput.trim());
        } else {
          await requestPartnerCorrectionAction(correctionItem.id, reasonInput.trim());
        }
        setCorrectionItem(null);
        setReasonInput("");
        setFeedback({
          type: "success",
          text: `Correction request dispatched to applicant.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Correction request failed",
        });
      }
    });
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

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Applications ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("vendor")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "vendor"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Vendors ({items.filter((i) => i.type === "vendor").length})
          </button>
          <button
            onClick={() => setActiveTab("partner")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "partner"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Partners ({items.filter((i) => i.type === "partner").length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Pending Applications Queue
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Review submitted merchant brands and promotional partners awaiting verification
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Applicant Name</TableHead>
                    <TableHead>Entity / Role</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/80">
                      <TableCell>
                        {item.type === "vendor" ? (
                          <Badge variant="brand" className="text-[10px] gap-1 font-semibold">
                            <Building className="h-3 w-3" />
                            <span>Vendor</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] gap-1 font-semibold">
                            <Users className="h-3 w-3" />
                            <span>Partner</span>
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-xs text-slate-900">
                        {item.displayName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {item.secondaryName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 font-mono">
                        {item.email}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {item.city ? `${item.city}, ${item.state || ""}` : "N/A"}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewItem(item)}
                            className="h-7 text-xs px-2 gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(item)}
                            disabled={isPending}
                            className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCorrectionItem(item);
                              setReasonInput("");
                            }}
                            disabled={isPending}
                            className="h-7 text-xs px-2 gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Correct</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRejectItem(item);
                              setReasonInput("");
                            }}
                            disabled={isPending}
                            className="h-7 text-xs px-2 gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <FileCheck className="h-8 w-8 text-emerald-500 mx-auto mb-1 opacity-70" />
              <p className="font-bold text-slate-700">No applications match your filter</p>
              <p className="text-slate-400">All submissions have been reviewed or none match the active search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIEW DETAILS MODAL */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-md w-full bg-white shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
              <div>
                <CardTitle className="text-base font-bold">
                  {viewItem.type === "vendor" ? "Vendor Application" : "Partner Application"}
                </CardTitle>
                <CardDescription className="text-xs">
                  Applicant ID: <span className="font-mono">{viewItem.id}</span>
                </CardDescription>
              </div>
              <button onClick={() => setViewItem(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Applicant Name</span>
                  <span className="font-bold text-slate-900">{viewItem.displayName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Entity / Track</span>
                  <span className="font-semibold text-slate-800">{viewItem.secondaryName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Email</span>
                  <span className="text-slate-700 font-mono">{viewItem.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Phone</span>
                  <span className="text-slate-700">{viewItem.phone}</span>
                </div>
              </div>

              <div className="p-3 border rounded-lg space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase">Address</span>
                <p className="text-slate-700">
                  {viewItem.address || "No address provided"}
                  {viewItem.city ? `, ${viewItem.city}` : ""}
                  {viewItem.state ? `, ${viewItem.state}` : ""}
                  {viewItem.pincode ? ` - ${viewItem.pincode}` : ""}
                </p>
              </div>

              <div className="flex items-center justify-between text-slate-500 pt-1">
                <span>Applied: {formatDate(viewItem.createdAt)}</span>
                <Badge variant="warning" className="text-[10px]">
                  Pending Decision
                </Badge>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button size="sm" variant="outline" onClick={() => setViewItem(null)}>
                  Close
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={() => {
                    const itm = viewItem;
                    setViewItem(null);
                    handleApprove(itm);
                  }}
                >
                  Approve Application
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-md w-full bg-white shadow-xl">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>Reject Application</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Provide a reason for rejecting {rejectItem.displayName}&apos;s application.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <textarea
                rows={3}
                placeholder="Reason for rejection (e.g., Incomplete documentation, Unverifiable business address)..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => setRejectItem(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={!reasonInput.trim() || isPending}
                  onClick={handleRejectConfirm}
                >
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* REQUEST CORRECTION MODAL */}
      {correctionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-w-md w-full bg-white shadow-xl">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-bold text-amber-700 flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                <span>Request Correction</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Specify what corrections or additional information {correctionItem.displayName} needs to provide.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <textarea
                rows={3}
                placeholder="Describe required changes (e.g., Please upload a clearer tax certificate or verify phone number)..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => setCorrectionItem(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                  disabled={!reasonInput.trim() || isPending}
                  onClick={handleCorrectionConfirm}
                >
                  Submit Correction Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
