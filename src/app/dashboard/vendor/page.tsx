import React from "react";
import Link from "next/link";
import { Store, Megaphone, Plus, ArrowRight, ShieldCheck, DollarSign } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VendorOverviewPage() {
  const user = await requireRole(["vendor", "super_admin"]);
  const supabase = await createClient();

  // Query actual campaigns created by this vendor
  const { data: campaignsData } = await supabase
    .from("campaigns")
    .select("*")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false });

  const vendorCampaigns = ((campaignsData as any[]) || []).map((c: any) => c);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vendor Brand Dashboard"
        description="Manage your brand campaigns, configure partner commission incentives, and monitor acquisition funnels."
        badge="Brand Vendor"
      >
        <Link href="/dashboard/vendor/campaigns">
          <Button size="sm" className="gap-2 font-semibold">
            <Plus className="h-4 w-4" />
            <span>Launch New Campaign</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Brand Identity Card */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">
                {user.profile.company_name || user.profile.full_name || "Enterprise Brand"}
              </h3>
              <Badge variant="success" className="text-[10px]">
                Verified Merchant
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              Account ID: <code className="font-mono text-slate-700">{user.id}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/vendor/profile">
              <Button variant="outline" size="sm" className="text-xs">
                Brand Profile
              </Button>
            </Link>
            <Link href="/dashboard/vendor/campaigns">
              <Button size="sm" className="text-xs">
                View Campaigns ({vendorCampaigns.length})
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Real Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                My Active Campaigns
              </span>
              <Megaphone className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {vendorCampaigns.filter((c) => c.status === "active").length}
            </div>
            <p className="text-[11px] text-slate-400">Published to partner directory</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Escrow Budget Committed
              </span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(
                vendorCampaigns.reduce((acc, c) => acc + (Number(c.budget) || 0), 0)
              )}
            </div>
            <p className="text-[11px] text-slate-400">PostgreSQL ledger reserves</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Account Status
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-sm font-bold text-emerald-600 capitalize pt-1">
              {user.profile.status}
            </div>
            <p className="text-[11px] text-slate-400">Row Level Security verified</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Campaigns Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">My Brand Campaigns</h3>
          <Link href="/dashboard/vendor/campaigns" className="text-xs text-blue-600 hover:underline font-semibold">
            Manage All
          </Link>
        </div>

        {vendorCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendorCampaigns.map((camp) => (
              <Card key={camp.id} className="border-slate-200">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {camp.category}
                    </Badge>
                    <Badge variant={camp.status === "active" ? "success" : "warning"} className="text-[10px]">
                      {camp.status}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{camp.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{camp.description}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Commission:{" "}
                      <strong className="text-blue-600">
                        {camp.commission_type === "percentage"
                          ? `${camp.commission_rate}%`
                          : formatCurrency(camp.commission_rate)}
                      </strong>
                    </span>
                    <span className="text-slate-400">
                      Budget: <strong>{formatCurrency(camp.budget)}</strong>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Megaphone className="h-8 w-8 text-slate-400" />}
            title="You have not launched any campaigns yet"
            description="Create your first campaign to recruit partners and start acquiring verified customer leads."
            actionLabel="Create First Campaign"
            actionHref="/dashboard/vendor/campaigns"
          />
        )}
      </div>
    </div>
  );
}

