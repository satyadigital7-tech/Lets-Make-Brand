"use client";

import React, { useState, useTransition } from "react";
import {
  Bell,
  CheckCircle2,
  Mail,
  Send,
  Filter,
  Check,
  Clock,
  User,
  ShieldAlert,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
  broadcastSystemNotificationAction,
} from "./actions";

export interface NotificationItem {
  id: string;
  userId: string;
  userEmail: string | null;
  userFullName: string | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsAdminViewProps {
  initialNotifications: NotificationItem[];
}

export function NotificationsAdminView({ initialNotifications }: NotificationsAdminViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filterType, setFilterType] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Broadcast modal state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("all");

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === "all") return true;
    if (filterType === "unread") return !n.isRead;
    return n.type === filterType;
  });

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      try {
        await markNotificationReadAction(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update notification";
        setFeedback({ type: "error", message: msg });
      }
    });
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      try {
        await markAllNotificationsReadAction();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setFeedback({ type: "success", message: "All notifications marked as read." });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to mark all as read";
        setFeedback({ type: "error", message: msg });
      }
    });
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    startTransition(async () => {
      try {
        const res = await broadcastSystemNotificationAction({
          title: broadcastTitle,
          message: broadcastMessage,
          type: "system_broadcast",
          targetRole: broadcastTarget,
        });
        setFeedback({
          type: "success",
          message: `Broadcast delivered successfully to ${res.count} account(s).`,
        });
        setShowBroadcastModal(false);
        setBroadcastTitle("");
        setBroadcastMessage("");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Broadcast failed";
        setFeedback({ type: "error", message: msg });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Notifications ({notifications.length})</option>
              <option value="unread">Unread Only ({unreadCount})</option>
              <option value="system_broadcast">System Broadcasts</option>
              <option value="vendor_registration">Vendor Registrations</option>
              <option value="partner_registration">Partner Registrations</option>
              <option value="lead_submission">Lead Submissions</option>
              <option value="withdrawal_request">Withdrawal Requests</option>
              <option value="kyc_submission">KYC Submissions</option>
            </select>

            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={handleMarkAllRead}
                className="text-xs gap-1.5 border-slate-200 text-slate-700"
              >
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Mark All Read</span>
              </Button>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => setShowBroadcastModal(true)}
            className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Broadcast Platform Alert</span>
          </Button>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <span>Platform Notification Dispatcher</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time events dispatched to vendors, partners, and administrative staff
            </CardDescription>
          </div>
          <Badge variant={unreadCount > 0 ? "default" : "secondary"} className="text-xs font-mono">
            {unreadCount} Unread
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {filteredNotifications.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Title & Message</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((notif) => (
                    <TableRow
                      key={notif.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !notif.isRead ? "bg-blue-50/20 font-medium" : ""
                      }`}
                    >
                      <TableCell>
                        {!notif.isRead ? (
                          <span className="flex h-2 w-2 rounded-full bg-blue-600" />
                        ) : (
                          <span className="flex h-2 w-2 rounded-full bg-slate-300" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono uppercase">
                          {notif.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">
                        {notif.userEmail || notif.userFullName || notif.userId.slice(0, 8)}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="text-xs font-bold text-slate-900">{notif.title}</div>
                        <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(notif.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {!notif.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="h-7 text-xs text-blue-600 hover:text-blue-700"
                          >
                            Mark Read
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <Bell className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium">No notifications matching criteria.</p>
              <p className="text-xs text-slate-400">
                System events and partner actions will appear here in real time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Broadcast Platform Notification
                </h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Target Audience</label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="all">All Platform Accounts (Vendors & Partners)</option>
                  <option value="vendor">Brand Vendors Only</option>
                  <option value="independent_partner">Independent Partners Only</option>
                  <option value="team_leader">Team Leaders Only</option>
                  <option value="team_member">Team Members Only</option>
                  <option value="admin">Administrative Staff Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Alert Title</label>
                <Input
                  placeholder="e.g. System Maintenance Notice / New Commission Rules"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Message Body</label>
                <textarea
                  placeholder="Enter detailed notification contents here..."
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-normal"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBroadcastModal(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Deliver Broadcast</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
