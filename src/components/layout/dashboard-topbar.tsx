"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationsPopover } from "@/components/dashboard/notifications-popover";
import { UserNav } from "@/components/dashboard/user-nav";
import { AuthContextUser } from "@/lib/types/auth.types";

interface DashboardTopbarProps {
  user: AuthContextUser;
}

export function DashboardTopbar({ user }: DashboardTopbarProps) {
  const pathname = usePathname();

  // Create breadcrumb segments
  const segments = pathname.split("/").filter(Boolean);

  const handleOpenSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-dashboard-sidebar"));
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Mobile Hamburger + Breadcrumb Trail */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          onClick={handleOpenSidebar}
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium overflow-x-auto whitespace-nowrap scrollbar-none py-1 max-w-[170px] sm:max-w-md lg:max-w-xl">
          <Link href="/dashboard" className="hover:text-slate-900 transition-colors shrink-0">
            Dashboard
          </Link>
          {segments.slice(1).map((seg, idx) => {
            const href = "/" + segments.slice(0, idx + 2).join("/");
            const isLast = idx === segments.length - 2;
            const formatted = seg
              .replace("-", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());

            return (
              <React.Fragment key={href}>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {isLast ? (
                  <span className="font-semibold text-slate-900 shrink-0">{formatted}</span>
                ) : (
                  <Link href={href} className="hover:text-slate-900 transition-colors shrink-0">
                    {formatted}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Topbar Actions */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>RLS Active</span>
        </div>

        <NotificationsPopover />

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        <UserNav user={user} />
      </div>
    </header>
  );
}


