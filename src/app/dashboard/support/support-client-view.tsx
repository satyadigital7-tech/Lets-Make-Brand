"use client";

import React, { useState, useTransition } from "react";
import {
  LifeBuoy,
  Plus,
  Send,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  User,
  ShieldAlert,
  ChevronLeft,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createTicketAction, postTicketMessageAction } from "./actions";

export interface SupportTicketItem {
  id: string;
  ticketCode: string;
  subject: string;
  category: string;
  description: string;
  priority: string;
  status: "open" | "in_progress" | "waiting_user" | "resolved" | "closed";
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    senderId: string;
    senderRole: string;
    message: string;
    isStaffReply: boolean;
    createdAt: string;
  }[];
  attachments: {
    id: string;
    fileName: string;
    filePath: string;
  }[];
}

interface SupportClientViewProps {
  initialTickets: SupportTicketItem[];
  currentUserId: string;
}

export function SupportClientView({ initialTickets, currentUserId }: SupportClientViewProps) {
  const [tickets, setTickets] = useState<SupportTicketItem[]>(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    initialTickets[0]?.id || null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [replyText, setReplyText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Ticket Form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<any>("wallet");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<any>("medium");
  const [attachmentName, setAttachmentName] = useState("");

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const result = await createTicketAction({
          subject,
          category,
          description,
          priority,
          attachments: attachmentName.trim()
            ? [
                {
                  fileName: attachmentName.trim(),
                  filePath: `support/${Date.now()}_${attachmentName.trim()}`,
                  mimeType: "application/octet-stream",
                },
              ]
            : [],
        });

        if (result.success) {
          const newTicketItem: SupportTicketItem = {
            id: result.ticketId,
            ticketCode: result.ticketCode,
            subject,
            category,
            description,
            priority,
            status: "open",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [
              {
                id: `msg-${Date.now()}`,
                senderId: currentUserId,
                senderRole: "user",
                message: description,
                isStaffReply: false,
                createdAt: new Date().toISOString(),
              },
            ],
            attachments: attachmentName.trim()
              ? [{ id: `att-${Date.now()}`, fileName: attachmentName.trim(), filePath: "" }]
              : [],
          };

          setTickets([newTicketItem, ...tickets]);
          setSelectedTicketId(result.ticketId);
          setShowCreateModal(false);
          setSubject("");
          setDescription("");
          setAttachmentName("");
          setSuccessMsg(`Support ticket ${result.ticketCode} created successfully!`);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to create support ticket.");
      }
    });
  };

  const handlePostReply = (e: React.FormEvent) => {
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
                    status: "in_progress",
                    messages: [
                      ...t.messages,
                      {
                        id: result.messageId,
                        senderId: currentUserId,
                        senderRole: "user",
                        message: replyText.trim(),
                        isStaffReply: false,
                        createdAt: new Date().toISOString(),
                      },
                    ],
                  }
                : t
            )
          );
          setReplyText("");
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to post message.");
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
        return <Badge variant="secondary" className="text-[10px] font-bold">Waiting on You</Badge>;
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

      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Support Desk</h2>
          <p className="text-xs text-slate-500">
            Submit questions regarding lead reviews, commission calculations, or technical assistance.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 gap-1.5 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Create New Ticket
        </Button>
      </div>

      {/* Two Column Layout: Ticket List & Conversation Thread */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Ticket List */}
        <Card className={`border-slate-200 bg-white shadow-xs overflow-hidden md:col-span-1 ${activeTicket ? "hidden md:block" : "block"}`}>
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              My Support Inquiries ({tickets.length})
            </CardTitle>
          </CardHeader>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 p-4">
                No support tickets yet. Click &quot;Create New Ticket&quot; to open an inquiry.
              </div>
            ) : (
              tickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTicketId(t.id)}
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
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
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

        {/* Right: Selected Ticket Discussion Thread */}
        <Card className={`border-slate-200 bg-white shadow-xs md:col-span-2 flex flex-col justify-between min-h-[500px] ${!activeTicket ? "hidden md:flex" : "flex"}`}>
          {activeTicket ? (
            <>
              {/* Ticket Topbar */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <button
                    type="button"
                    onClick={() => setSelectedTicketId(null)}
                    className="md:hidden inline-flex items-center gap-1 text-xs font-semibold text-blue-600 mb-2 hover:underline"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Inquiries</span>
                  </button>
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
                </div>

                <div className="text-[11px] text-slate-400">
                  Opened:{" "}
                  {new Date(activeTicket.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* Messages Thread */}
              <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[420px]">
                {activeTicket.messages.map((m) => {
                  const isStaff = m.isStaffReply;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isStaff ? "items-start" : "items-end"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-700">
                          {isStaff ? "LMB Support Team" : "You"}
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
                            ? "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60"
                            : "bg-blue-600 text-white rounded-tr-none shadow-xs"
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form (Module 5) */}
              <form onSubmit={handlePostReply} className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Input
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response to the support team..."
                    className="text-xs bg-white"
                  />
                  <Button
                    type="submit"
                    disabled={isPending || !replyText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 gap-1 shrink-0"
                  >
                    <Send className="h-3 w-3" />
                    Reply
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-12 text-slate-400 text-center space-y-2">
              <LifeBuoy className="h-10 w-10 text-slate-300" />
              <p className="text-xs">Select a ticket from the left column to view the conversation thread.</p>
            </div>
          )}
        </Card>
      </div>

      {/* CREATE TICKET MODAL (Module 5) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg bg-white shadow-xl">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-blue-600" />
                <span>Open New Support Ticket</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Our support team typically responds within business hours.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleCreateTicket}>
              <CardContent className="p-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Inquiry Subject *
                  </label>
                  <Input
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your question or issue"
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full text-xs h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="wallet">Wallet & Financials</option>
                      <option value="withdrawal">Withdrawal Request</option>
                      <option value="commission">Commission Accrual</option>
                      <option value="lead_submission">Lead Submission</option>
                      <option value="campaign">Campaign Eligibility</option>
                      <option value="kyc">KYC & Identity</option>
                      <option value="account_issues">Account Issues</option>
                      <option value="technical_support">Technical Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Priority Level *
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full text-xs h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Detailed Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide all relevant details, lead IDs, or screenshot descriptions..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Attachment File Name (Optional)
                  </label>
                  <Input
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="e.g. error_screenshot.png"
                    className="text-xs"
                  />
                </div>
              </CardContent>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !subject.trim() || !description.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isPending ? "Creating..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
