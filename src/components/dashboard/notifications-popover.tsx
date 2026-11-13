"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, ShieldCheck, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    {
      id: "1",
      title: "Security Baseline Verified",
      time: "Just now",
      description: "PostgreSQL Row Level Security active across all tables.",
      type: "security",
    },
    {
      id: "2",
      title: "System Initialized",
      time: "Phase 1",
      description: "RBAC roles and granular permissions synchronized.",
      type: "info",
    },
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-4 shadow-xl z-50 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
              <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                {notifications.length}
              </Badge>
            </div>
            <span className="text-[11px] text-slate-400">Phase 1 Event Stream</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto space-y-1">
            {notifications.map((n) => (
              <div key={n.id} className="pt-2 pb-2 first:pt-0 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    {n.type === "security" ? (
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Info className="h-3.5 w-3.5 text-blue-600" />
                    )}
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400">{n.time}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed pl-5">
                  {n.description}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400">
              Live audit logging active in PostgreSQL
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

