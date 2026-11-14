"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  Store,
  Users,
  Users2,
  Megaphone,
  Filter,
  Percent,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  Building2,
  Inbox,
  LineChart,
  CheckCircle2,
  Link2,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Bell,
  FileText,
  ShieldCheck,
  LifeBuoy,
  Activity,
  LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AuthContextUser } from "@/lib/types/auth.types";
import { ROLE_CONFIGS } from "@/lib/auth/rbac";
import { hasPermission } from "@/lib/auth/permissions";

interface DashboardSidebarProps {
  user: AuthContextUser;
}

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  ShieldAlert,
  Store,
  Users,
  Users2,
  Megaphone,
  Filter,
  Percent,
  Wallet,
  CreditCard,
  BarChart3,
  Settings,
  Building2,
  Inbox,
  LineChart,
  CheckCircle2,
  Link2,
  Bell,
  FileText,
  ShieldCheck,
  LifeBuoy,
  Activity,
};

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setMobileOpen(true);
    window.addEventListener("open-dashboard-sidebar", handleOpen);
    return () => window.removeEventListener("open-dashboard-sidebar", handleOpen);
  }, []);

  const roleConfig = ROLE_CONFIGS[user.primaryRole] || ROLE_CONFIGS.independent_partner;

  // Filter navigation items based on user permissions
  const authorizedNavItems = roleConfig.navigation.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(user, item.requiredPermission);
  });

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-200">
      <div className="space-y-6 p-4">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pt-2 pb-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-base shadow">
              LMB
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-sm tracking-tight leading-tight">
                Lets Make Brand
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-blue-400">
                {roleConfig.name}
              </span>
            </div>
          </Link>
          <div className="lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Role Badge & Identity Box */}
        <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white truncate max-w-[130px]">
              {user.profile.full_name || "Enterprise User"}
            </span>
            <Badge variant="brand" className="text-[9px] py-0 px-1.5 uppercase font-bold">
              {user.primaryRole.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 text-xs">
          <span className="px-2 text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
            Modules
          </span>

          {authorizedNavItems.map((item) => {
            const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.title}</span>
                </div>
                {item.badge ? (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono font-semibold">
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight className="h-3.5 w-3.5 text-white/70" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="text-[10px] text-slate-400 flex items-center justify-between">
          <span>RLS Enforced</span>
          <span className="font-mono text-emerald-400">SECURE</span>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Button Trigger */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-72 flex-1 flex-col shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Static Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 shadow-md">
        {sidebarContent}
      </aside>
    </>
  );
}

