"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Settings, Shield, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { AuthContextUser } from "@/lib/types/auth.types";
import { ROLE_CONFIGS } from "@/lib/auth/rbac";

interface UserNavProps {
  user: AuthContextUser;
}

export function UserNav({ user }: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      // Fallback form post
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/api/auth/logout";
      document.body.appendChild(form);
      form.submit();
    }
  };

  const roleName = ROLE_CONFIGS[user.primaryRole]?.name || user.primaryRole;
  const initials = (user.profile.full_name || user.email || "U")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs shadow-sm">
          {initials}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-800 leading-tight">
            {user.profile.full_name || "Enterprise User"}
          </span>
          <span className="text-[10px] text-slate-500 font-medium leading-tight">
            {roleName}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 space-y-1">
          {/* User Profile Header */}
          <div className="p-2.5 border-b border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">
                {user.profile.full_name || "LMB Member"}
              </span>
              <Badge variant="brand" className="text-[10px] py-0 px-1.5">
                {roleName}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-emerald-600 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Status: {user.profile.status}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="py-1 text-xs">
            <Link
              href={ROLE_CONFIGS[user.primaryRole]?.defaultPath || "/dashboard"}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Shield className="h-4 w-4 text-slate-400" />
              <span>Role Dashboard</span>
            </Link>
          </div>

          {/* Logout Action */}
          <div className="pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

