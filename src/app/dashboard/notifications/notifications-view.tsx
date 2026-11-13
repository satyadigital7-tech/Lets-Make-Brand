"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  DollarSign,
  Megaphone,
  LifeBuoy,
  ShieldCheck,
  ExternalLink,
  Settings,
  Filter,
  Sliders,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markAsReadAction, markAllAsReadAction, saveNotificationPreferencesAction } from "./actions";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferencesData {
  emailAccountUpdates: boolean;
  emailCampaignUpdates: boolean;
  emailLeadUpdates: boolean;
  emailFinancialUpdates: boolean;
  emailSupportUpdates: boolean;
  inappAll: boolean;
}

interface NotificationsViewProps {
  initialNotifications: NotificationItem[];
  initialPreferences: NotificationPreferencesData;
}

export function NotificationsView({
  initialNotifications,
  initialPreferences,
}: NotificationsViewProps) {
  const [activeTab, setActiveTab] = useState<"list" | "preferences">("list");
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filterType, setFilterType] = useState<"all" | "unread" | "financial" | "campaign" | "support">("all");
  const [preferences, setPreferences] = useState<NotificationPreferencesData>(initialPreferences);
  const [isPending, startTransition] = useTransition();
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === "unread") return !n.isRead;
    if (filterType === "financial") return n.category === "financial" || n.type.includes("commission") || n.type.includes("withdrawal");
    if (filterType === "campaign") return n.category === "campaign";
    if (filterType === "support") return n.category === "support";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      try {
        await markAsReadAction(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      try {
        await markAllAsReadAction();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setFeedbackMsg("All notifications marked as read.");
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);
    startTransition(async () => {
      try {
        await saveNotificationPreferencesAction(preferences);
        setFeedbackMsg("Notification preferences updated successfully.");
      } catch (err) {
        console.error(err);
      }
    });
  };

  const getEventIcon = (category: string, type: string) => {
    if (category === "financial" || type.includes("commission") || type.includes("withdrawal")) {
      return <DollarSign className="h-4 w-4 text-emerald-600" />;
    }
    if (category === "campaign") {
      return <Megaphone className="h-4 w-4 text-blue-600" />;
    }
    if (category === "support") {
      return <LifeBuoy className="h-4 w-4 text-amber-600" />;
    }
    return <ShieldCheck className="h-4 w-4 text-indigo-600" />;
  };

  return (
    <div className="space-y-6">
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "list"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Notification Inbox ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preferences")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === "preferences"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Preferences & Email Dispatch</span>
          </button>
        </div>

        {activeTab === "list" && unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="text-xs h-8 gap-1.5 font-bold"
          >
            <CheckCheck className="h-3.5 w-3.5 text-blue-600" />
            Mark all ({unreadCount}) read
          </Button>
        )}
      </div>

      {activeTab === "list" ? (
        <div className="space-y-4">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Alerts" },
              { id: "unread", label: `Unread (${unreadCount})` },
              { id: "financial", label: "Commissions & Payouts" },
              { id: "campaign", label: "Campaigns & Leads" },
              { id: "support", label: "Support Responses" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id as any)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  filterType === f.id
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* List Card */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardContent className="p-0 divide-y divide-slate-100">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No notifications found matching the selected filter.
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                      !n.isRead ? "bg-blue-50/40" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 mt-0.5">
                        {getEventIcon(n.category, n.type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{n.title}</span>
                          {!n.isRead && (
                            <Badge variant="brand" className="text-[9px] py-0 px-1 font-bold">
                              New
                            </Badge>
                          )}
                          <span className="text-[10px] text-slate-400 capitalize">
                            &bull; {n.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-[11px]">
                          <span className="text-slate-400">
                            {new Date(n.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {n.actionUrl && (
                            <Link
                              href={n.actionUrl}
                              className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              Go to resource <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {!n.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-xs text-slate-400 hover:text-slate-700 h-8 font-semibold shrink-0"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Mark Read
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Notification Preferences Form */
        <form onSubmit={handleSavePreferences} className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-5 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-600" />
                <span>Transactional Email & In-App Alert Channels</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Choose which milestone updates trigger real-time email dispatch to your registered inbox.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {[
                {
                  key: "emailAccountUpdates" as const,
                  label: "Account & Compliance Approvals",
                  desc: "Receive email when your account approval, rejection, or KYC status changes.",
                },
                {
                  key: "emailCampaignUpdates" as const,
                  label: "Campaign Publications & Assignments",
                  desc: "Receive email whenever high-value brand campaigns are assigned to you.",
                },
                {
                  key: "emailLeadUpdates" as const,
                  label: "Lead Verification Milestones",
                  desc: "Receive email on lead approval, rejection, or duplicate inquiry flagging.",
                },
                {
                  key: "emailFinancialUpdates" as const,
                  label: "Wallet Commissions & Payout Remittances",
                  desc: "Receive instant email notification when commissions credit or bank payouts are dispatched.",
                },
                {
                  key: "emailSupportUpdates" as const,
                  label: "Support Ticket Staff Responses",
                  desc: "Receive email notification when an LMB administrator replies to your inquiry.",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">{item.label}</span>
                    <span className="text-[11px] text-slate-500 block">{item.desc}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[item.key]}
                    onChange={(e) =>
                      setPreferences({ ...preferences, [item.key]: e.target.checked })
                    }
                    className="h-4 w-4 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-6 gap-1.5 shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              {isPending ? "Saving..." : "Save Notification Preferences"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
