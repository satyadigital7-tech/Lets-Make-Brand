import React from "react";
import Link from "next/link";
import {
  Shield,
  Store,
  Users,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { canManageVendorTransfers } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const user = await requireRole(["admin", "super_admin"]);
  const supabase = await createClient();

  const [
    { count: vendorsCount },
    { count: partnersCount },
    { count: campaignsCount },
  ] = await Promise.all([
    supabase
      .from("user_roles")
      .select("*, roles!inner(*)", { count: "exact", head: true })
      .eq("roles.code", "vendor"),
    supabase
      .from("user_roles")
      .select("*, roles!inner(*)", { count: "exact", head: true })
      .in("roles.code", ["independent_partner", "team_leader", "team_member"]),
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
  ]);

  const hasVendorTransferPerm = canManageVendorTransfers(user);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Operations Console"
        description="Operational oversight of verified brand campaigns, merchant accounts, and partner network performance."
        badge="Admin Role"
      />

      {/* Security Status Box */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Assigned Security Permissions
            </h3>
          </div>
          <Badge variant="brand" className="text-[10px]">
            {user.roles.includes("super_admin") ? "Unrestricted (*)" : `${user.permissions.length} Explicit Grants`}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Operational Campaign & Lead Moderation</span>
          </div>

          <div className="flex items-center gap-2">
            {hasVendorTransferPerm ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                Vendor Transfers: Explicitly Granted
              </span>
            ) : (
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Vendor Transfers: Denied by Default</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Vendors
              </span>
              <Store className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {vendorsCount ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Brand merchants in PostgreSQL</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Partner Network
              </span>
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {partnersCount ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Independent & agency partners</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Live Campaigns
              </span>
              <Megaphone className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {campaignsCount ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Actual PostgreSQL records</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/admin/campaigns" className="block">
          <Card className="border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Manage Campaigns</h4>
                <p className="text-xs text-slate-500">Inspect real campaign listings and review terms</p>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-600" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/admin/vendors" className="block">
          <Card className="border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Vendors Directory</h4>
                <p className="text-xs text-slate-500">Review merchant onboarding and account details</p>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-600" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

