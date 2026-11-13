import React from "react";
import Link from "next/link";
import { Megaphone, Users, Wallet, ArrowRight, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeamMemberOverviewPage() {
  const user = await requireRole(["team_member", "team_leader", "super_admin"]);
  const supabase = await createClient();

  const { data: campaignsData } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .limit(3);

  const campaigns = ((campaignsData as any[]) || []).map((c: any) => c);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team Member Agent Portal"
        description="Access agency-assigned brand campaigns, generate trackable referral links, and view your verified earnings."
        badge="Squad Member"
      >
        <Link href="/dashboard/team-member/campaigns">
          <Button size="sm" className="gap-2 font-semibold">
            <Megaphone className="h-4 w-4" />
            <span>Assigned Campaigns</span>
          </Button>
        </Link>
      </PageHeader>

      <Card className="border-slate-200 bg-white">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">
                Agent: {user.profile.full_name || "Squad Member"}
              </span>
              <Badge variant="brand" className="text-[10px]">
                Active Agent
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Agent ID: <code className="font-mono text-slate-700">{user.id}</code>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Row Level Security Active</span>
          </div>
        </CardContent>
      </Card>

      {/* Available Campaigns */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Assigned Brand Campaigns
            </h3>
            <p className="text-xs text-slate-500">
              Queried from live PostgreSQL campaigns table
            </p>
          </div>
          <Link
            href="/dashboard/team-member/campaigns"
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            View All ({campaigns.length})
          </Link>
        </div>

        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => (
              <Card key={camp.id} className="border-slate-200">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {camp.category}
                    </Badge>
                    <span className="font-bold text-xs text-blue-600">
                      Payout:{" "}
                      {camp.commission_type === "percentage"
                        ? `${camp.commission_rate}%`
                        : formatCurrency(camp.commission_rate)}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{camp.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{camp.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 bg-white">
            <Megaphone className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No campaigns assigned yet.</p>
          </div>
        )}
      </div>

      {/* Module Navigation Placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/team-member/leads" className="block">
          <Card className="border-slate-200 hover:border-blue-300 transition-all">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">My Leads</span>
                <Badge variant="outline" className="text-[9px]">Phase 2</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Track referrals attributed to your agent ID</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/team-member/commission" className="block">
          <Card className="border-slate-200 hover:border-blue-300 transition-all">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">My Commission</span>
                <Badge variant="outline" className="text-[9px]">Phase 3</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Review verified conversion earnings after squad splits</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/team-member/wallet" className="block">
          <Card className="border-slate-200 hover:border-blue-300 transition-all">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Earnings Wallet</span>
                <Badge variant="outline" className="text-[9px]">Phase 4</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Review your individual payout withdrawal balance</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

