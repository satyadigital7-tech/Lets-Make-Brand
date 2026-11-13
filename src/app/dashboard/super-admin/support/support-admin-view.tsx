"use client";

import React, { useState, useTransition } from "react";
import {
  LifeBuoy,
  Search,
  Send,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  FileText,
  User,
  ChevronLeft,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { postTicketMessageAction, updateTicketStatusAction } from "@/app/dashboard/support/actions";

export interface AdminSupportTicket {
  id: string;
  ticketCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  subject: string;
  category: string;
  description: string;
  priority: string;
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  assignedTo: string | null;
  assignedAdminName: string | null;
  createdAt: string;
  messages: {
    id: string;
    senderId: string;
    senderRole: string;
    message: string;
    isStaffReply: boolean;
    createdAt: string;
  }[];
}

interface SupportAdminViewProps {
  initialTickets: AdminSupportTicket[];
  staffUsers: { id: string; name: string }[];
  currentUserId: string;
}

export function SupportAdminView({
  initialTickets,
  staffUsers,
  currentUserId,
}: SupportAdminViewProps) {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>(initialTickets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets[0]?.id || null
  );
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [replyText, setReplyText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesCat = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  const handlePostStaffReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyText.trim()) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const result = await postTicketMessageAction({
          ticketId: selectedTicketId,
          message: replyText.trim(),
        });

        if (result.success) {
          setTickets((prev) =>
            prev.map((t) =>
              t.id === selectedTicketId
                ? {
                    ...t,
                    status: "waiting_user",
                    messages: [
                      ...t.messages,
                      {
                        id: result.messageId,
                        senderId: currentUserId,
                        senderRole: "super_admin",
                        message: replyText.trim(),
                        isStaffReply: true,
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  }
                : t
            )
          );
          setReplyText("");
          setSuccessMsg("Staff response dispatched and ticket updated to 'Waiting on User'.");
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to post staff response.");
      }
    });
  };

  const handleUpdateStatus = (newStatus: any) => {
    if (!selectedTicketId) return;
    startTransition(async () => {
      try {
        await updateTicketStatusAction({
          ticketId: selectedTicketId,
          status: newStatus,
        });

        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicketId ? { ...t, status: newStatus } : t))
        );
        setSuccessMsg(`Ticket status updated to ${newStatus}.`);
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to update ticket.");
      }
    });
  };

  const handleAssignAdmin = (adminId: string) => {
    if (!selectedTicketId) return;
    startTransition(async () => {
      try {
        await updateTicketStatusAction({
          ticketId: selectedTicketId,
          assignedTo: adminId,
        });

        const assignedStaff = staffUsers.find((s) => s.id === adminId);
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicketId
              ? { ...t, assignedTo: adminId, assignedAdminName: assignedStaff?.name || "Admin" }
              : t
          )
        );
        setSuccessMsg("Ticket assigned successfully.");
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to assign ticket.");
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="brand" className="text-[10px] font-bold">Open</Badge>;
      case "in_progress":
        return <Badge variant="warning" className="text-[10px] font-bold">In Progress</Badge>;
      case "waiting_user":
        return <Badge variant="secondary" className="text-[10px] font-bold">Waiting User</Badge>;
      case "resolved":
      case "closed":
        return <Badge variant="success" className="text-[10px] font-bold">Resolved</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-bold">{status}</Badge>;
    }
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

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search code, subject, user, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs h-8 bg-slate-50 w-full"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium flex-1 sm:flex-initial"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_user">Waiting User</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium flex-1 sm:flex-initial"
          >
            <option value="all">All Categories</option>
            <option value="wallet">Wallet & Financials</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="commission">Commission</option>
            <option value="lead_submission">Leads</option>
            <option value="campaign">Campaigns</option>
            <option value="kyc">KYC</option>
            <option value="technical_support">Technical</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Main Two Column Desk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Ticket Queue */}
        <Card className={`border-slate-200 bg-white shadow-xs overflow-hidden md:col-span-1 ${showMobileDetail ? "hidden md:block" : "block"}`}>
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Support Queue ({filteredTickets.length})
            </CardTitle>
          </CardHeader>

          <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 p-4">
                No tickets matching current filters.
              </div>
            ) : (
              filteredTickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setSelectedTicketId(t.id);
                    setShowMobileDetail(true);
                  }}
                  className={`w-full text-left p-3.5 transition-colors block ${
                    t.id === selectedTicketId
                      ? "bg-blue-50/70 border-l-4 border-blue-600"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {t.ticketCode}
                    </span>
                    {getStatusBadge(t.status)}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{t.subject}</h4>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {t.userName} &bull; <span className="capitalize">{t.userRole.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 pt-1 border-t border-slate-100">
                    <span className="capitalize">{t.category.replace("_", " ")}</span>
                    <span>
                      {new Date(t.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right: Staff Discussion & Action Panel */}
        <Card className={`border-slate-200 bg-white shadow-xs md:col-span-2 flex flex-col justify-between min-h-[550px] ${!showMobileDetail ? "hidden md:flex" : "flex"}`}>
          {activeTicket ? (
            <>
              {/* Ticket Administrative Topbar */}
              <div className="p-4 border-b border-slate-100 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowMobileDetail(false)}
                  className="md:hidden flex items-center gap-1.5 text-xs text-blue-600 font-semibold mb-2 hover:underline"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to Support Queue</span>
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600">
                        {activeTicket.ticketCode}
                      </span>
                      {getStatusBadge(activeTicket.status)}
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {activeTicket.priority} Priority
                      </Badge>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{activeTicket.subject}</h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Submitted by: <span className="font-bold text-slate-800">{activeTicket.userName}</span> ({activeTicket.userEmail}) &bull; Role: {activeTicket.userRole}
                    </div>
                  </div>

                  {/* Administrative Actions dropdown / button */}
                  <div className="flex items-center gap-2">
                    <select
                      value={activeTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      disabled={isPending}
                      className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-bold"
                    >
                      <option value="open">Mark Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_user">Waiting on User</option>
                      <option value="resolved">Mark Resolved</option>
                      <option value="closed">Close Ticket</option>
                    </select>

                    <select
                      value={activeTicket.assignedTo || ""}
                      onChange={(e) => handleAssignAdmin(e.target.value)}
                      disabled={isPending}
                      className="text-xs h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                    >
                      <option value="">Unassigned</option>
                      {staffUsers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Thread Messages */}
              <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[420px]">
                {activeTicket.messages.map((m) => {
                  const isStaff = m.isStaffReply;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-700">
                          {isStaff ? "Staff Response (You)" : activeTicket.userName}
                        </span>
                        <span>&bull;</span>
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed ${
                          isStaff
                            ? "bg-slate-900 text-white rounded-tr-none shadow-xs"
                            : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60"
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Staff Reply Form */}
              <form onSubmit={handlePostStaffReply} className="p-4 border-t border-slate-100 bg-slate-50/60">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Input
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Provide official administrative support response..."
                    className="text-xs bg-white font-medium"
                  />
                  <Button
                    type="submit"
                    disabled={isPending || !replyText.trim()}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-4 gap-1 shrink-0 justify-center"
                  >
                    <Send className="h-3 w-3" />
                    <span>Send Staff Reply</span>
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400 text-center space-y-2">
              <LifeBuoy className="h-10 w-10 text-slate-300" />
              <p className="text-xs">Select a support ticket from the queue to view messages and respond.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
