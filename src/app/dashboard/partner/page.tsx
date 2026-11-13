import React from "react";
import Link from "next/link";
import { Megaphone, Link2, Wallet, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PartnerOverviewPage() {
  const user = await requireRole([
    "independent_partner",
    "team_leader",
    "team_member",
    "super_admin",
  ]);
  const supabase = await createClient();

  // Query actual live campaigns available to promote
  const { data: campaignsData } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);

  const availableCampaigns = ((campaignsData as any[]) || []).map((c: any) => c);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Partner Earnings Portal"
        description="Discover verified brand campaigns, generate promotional tracking links, and review commission accruals."
        badge="Independent Partner"
      >
        <Link href="/dashboard/partner/campaigns">
          <Button size="sm" className="gap-2 font-semibold">
            <Megaphone className="h-4 w-4" />
            <span>Browse Brand Campaigns</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Identity Banner */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">
                Welcome back, {user.profile.full_name || "Partner"}
              </span>
              <Badge variant="success" className="text-[10px]">
                Active Partner
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Partner ID: <code className="font-mono text-slate-700">{user.id}</code>
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>PostgreSQL RLS Protected Ledger</span>
          </div>
        </CardContent>
      </Card>

      {/* Verified Live Campaigns Available */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Verified Brand Promotions Ready to Promote
            </h3>
            <p className="text-xs text-slate-500">
              Active campaigns queried from PostgreSQL database
            </p>
          </div>
          <Link
            href="/dashboard/partner/campaigns"
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            View Full Catalog
          </Link>
        </div>

        {availableCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCampaigns.map((camp) => (
              <Card
                key={camp.id}
                className="border-slate-200 hover:border-blue-300 transition-all shadow-sm flex flex-col justify-between"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {camp.category}
                    </Badge>
                    <Badge variant="brand" className="text-[10px]">
                      Commission:{" "}
                      {camp.commission_type === "percentage"
                        ? `${camp.commission_rate}%`
                        : formatCurrency(camp.commission_rate)}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{camp.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {camp.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-mono text-[11px]">
                      Slug: {camp.slug}
                    </span>
                    <Link href={`/dashboard/partner/campaigns`}>
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2">
                        <span>Get Link</span>
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 bg-white">
            <Megaphone className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              No active campaigns available in database. Check back soon or execute database seed data.
            </p>
          </div>
        )}
      </div>

      {/* Module Navigation Placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/partner/links" className="block">
          <Card className="border-slate-200 hover:border-blue-300 transition-all">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Promotional Links</span>
                <Badge variant="outline" className="text-[9px]">Phase 2</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Generate trackable partner links with custom sub-IDs</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/partner/leads" className="block">
          <Card className="border-slate-200 hover:border-blue-300 transition-all">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Submitted Leads</span>
                <Badge variant="outline" className="text-[9px]">Phase 2</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Track conversion status and attribution timestamps</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/partner/commission" className="block">
          <Card className="border-slate-200 hover:border-blue-300 transition-all">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Commission Wallet</span>
                <Badge variant="outline" className="text-[9px]">Phase 3</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Inspect accruals and request disbursements</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

