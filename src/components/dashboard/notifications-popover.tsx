"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  ShieldCheck,
  Info,
  DollarSign,
  Megaphone,
  LifeBuoy,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markAsReadAction, markAllAsReadAction } from "@/app/dashboard/notifications/actions";

export interface PopoverNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  category: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsPopover({
  initialNotifications = [],
  initialUnreadCount = 0,
}: {
  initialNotifications?: PopoverNotification[];
  initialUnreadCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<PopoverNotification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      try {
        await markAsReadAction(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
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
        setUnreadCount(0);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const getEventIcon = (category: string, type: string) => {
    if (category === "financial" || type.includes("commission") || type.includes("withdrawal")) {
      return <DollarSign className="h-3.5 w-3.5 text-emerald-600" />;
    }
    if (category === "campaign") {
      return <Megaphone className="h-3.5 w-3.5 text-blue-600" />;
    }
    if (category === "support") {
      return <LifeBuoy className="h-3.5 w-3.5 text-amber-600" />;
    }
    return <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
              {unreadCount > 0 ? (
                <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                  {unreadCount} unread
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                  All Caught Up
                </Badge>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto space-y-1">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No new notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`pt-2.5 pb-2.5 first:pt-1 space-y-1 rounded-lg px-2 transition-colors ${
                    !n.isRead ? "bg-blue-50/50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      {getEventIcon(n.category, n.type)}
                      {n.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed pl-5">
                    {n.message}
                  </p>
                  <div className="pl-5 pt-1 flex items-center justify-between text-[10px]">
                    {n.actionUrl ? (
                      <Link
                        href={n.actionUrl}
                        onClick={() => setIsOpen(false)}
                        className="text-blue-600 font-semibold hover:underline flex items-center gap-0.5"
                      >
                        View details <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    ) : (
                      <span />
                    )}
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n.id)}
                        className="text-slate-400 hover:text-slate-700 font-medium"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-blue-600 hover:underline w-full text-center"
            >
              View All Notifications & Preferences &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
