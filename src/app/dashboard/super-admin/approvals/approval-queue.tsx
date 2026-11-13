"use client";

import React, { useState, useTransition } from "react";
import {
  CheckCircle2,
  XCircle,
  Building,
  Users,
  Clock,
  Loader2,
  X,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { approveVendorAction, rejectVendorAction } from "../vendors/actions";
import { approvePartnerAction, rejectPartnerAction } from "../partners/actions";

export interface PendingItem {
  id: string;
  type: "vendor" | "partner";
  displayName: string;
  secondaryName: string; // Business name for vendor, role for partner
  email: string;
  phone: string;
  city: string | null;
  state: string | null;
  createdAt: string;
}

interface ApprovalQueueProps {
  initialItems: PendingItem[];
}

export function ApprovalQueue({ initialItems }: ApprovalQueueProps) {
  const [items, setItems] = useState<PendingItem[]>(initialItems);
  const [activeTab, setActiveTab] = useState<"all" | "vendor" | "partner">("all");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Reject modal
  const [rejectItem, setRejectItem] = useState<PendingItem | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    return item.type === activeTab;
  });

  const handleApprove = (item: PendingItem) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        if (item.type === "vendor") {
          const res = await approveVendorAction(item.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          setFeedback({
            type: "success",
            text: `Vendor approved! Assigned ID: ${res.vendorIdCode}. Onboarding workflow initiated.`,
          });
        } else {
          const res = await approvePartnerAction(item.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          setFeedback({
            type: "success",
            text: `Partner approved! Assigned ID: ${res.partnerIdCode}. Partner dashboard activated.`,
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
          text: `Application rejected and notified.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Rejection failed",
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Applications ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("vendor")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "vendor"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Pending Vendors ({items.filter((i) => i.type === "vendor").length})
        </button>
        <button
          onClick={() => setActiveTab("partner")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "partner"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Pending Partners ({items.filter((i) => i.type === "partner").length})
        </button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Pending Applications Queue
          </CardTitle>
          <CardDescription className="text-xs">
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
                    <TableHead className="text-right">Decision</TableHead>
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
                            onClick={() => handleApprove(item)}
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
              <p className="font-bold text-slate-700">All caught up!</p>
              <p className="text-slate-400">There are no pending applications awaiting Super Admin decision.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      {rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Reject Application
              </CardTitle>
              <CardDescription className="text-xs">
                {rejectItem.displayName} ({rejectItem.email})
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-800 block">
                  Mandatory Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State clear reasons why this application was not approved..."
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectItem(null)}
                  disabled={isPending}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectConfirm}
                  disabled={isPending || !reasonInput.trim()}
                  className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Confirm Rejection</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
