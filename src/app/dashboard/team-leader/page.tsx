import React from "react";
import Link from "next/link";
import { Users2, Megaphone, Percent, Wallet, ArrowRight, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TeamLeaderOverviewPage() {
  const user = await requireRole(["team_leader", "super_admin"]);
  const supabase = await createClient();

  // Query actual live campaigns in database
  const { data: campaignsData } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .limit(3);

  const activeCampaigns = ((campaignsData as any[]) || []).map((c: any) => c);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team Leader Command Portal"
        description="Direct your agency squad, allocate campaign assignments to members, and monitor group commission overrides."
        badge="Team Leader"
      >
        <Link href="/dashboard/team-leader/team">
          <Button size="sm" className="gap-2 font-semibold">
            <Users2 className="h-4 w-4" />
            <span>Manage Squad Members</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Identity Card */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">
                Squad Leader: {user.profile.full_name || "Agency Director"}
              </span>
              <Badge variant="brand" className="text-[10px]">
                Leader Account
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Leader ID: <code className="font-mono text-slate-700">{user.id}</code>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Multi-Tier RBAC Protected</span>
          </div>
        </CardContent>
      </Card>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link href="/dashboard/team-leader/team" className="block">
          <Card className="border-slate-200 hover:border-blue-300 transition-all h-full">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Squad Members
                </span>
                <Users2 className="h-4 w-4 text-blue-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Agency Roster</h4>
              <p className="text-xs text-slate-500">Inspect squad agents, invitation status, and activity</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/team-leader/campaigns" className="block">
          <Card className="border-slate-200 hover:border-blue-300 transition-all h-full">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Brand Deals
                </span>
                <Megaphone className="h-4 w-4 text-emerald-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">{activeCampaigns.length} Campaigns Available</h4>
              <p className="text-xs text-slate-500">Select verified brand promotions for squad distribution</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/team-leader/commission" className="block">
          <Card className="border-slate-200 hover:border-blue-300 transition-all h-full">
            <CardContent className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Squad Overrides
                </span>
                <Percent className="h-4 w-4 text-purple-600" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Tier Splits (Phase 3)</h4>
              <p className="text-xs text-slate-500">Configure member commission shares and management overrides</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

