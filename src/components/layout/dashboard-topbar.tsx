"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Breadcrumb Trail */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
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
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              {isLast ? (
                <span className="font-semibold text-slate-900">{formatted}</span>
              ) : (
                <Link href={href} className="hover:text-slate-900 transition-colors">
                  {formatted}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Topbar Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>RLS Active</span>
        </div>

        <NotificationsPopover />

        <div className="h-6 w-px bg-slate-200" />

        <UserNav user={user} />
      </div>
    </header>
  );
}

