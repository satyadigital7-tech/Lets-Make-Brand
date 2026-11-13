import React from "react";
import { Megaphone, Link2, Copy, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PartnerCampaignsPage() {
  const user = await requireRole([
    "independent_partner",
    "team_leader",
    "team_member",
    "super_admin",
  ]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const campaigns = ((data as any[]) || []).map((c: any) => c);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://letsmakebrand.com";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Campaign Catalog"
        description="Select verified brand campaigns, generate trackable referral links, and earn lucrative performance commissions."
        badge="PostgreSQL Records"
      />

      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {campaigns.map((camp) => {
            const trackingLink = `${siteUrl}/c/${camp.slug}?ref=${user.id}`;

            return (
              <Card key={camp.id} className="border-slate-200">
                <CardContent className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {camp.category}
                        </Badge>
                        <h3 className="font-bold text-base text-slate-900">
                          {camp.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 max-w-2xl">{camp.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Commission Payout
                      </span>
                      <span className="text-xl font-extrabold text-blue-600">
                        {camp.commission_type === "percentage"
                          ? `${camp.commission_rate}%`
                          : formatCurrency(camp.commission_rate)}
                      </span>
                    </div>
                  </div>

                  {camp.target_audience && (
                    <div className="text-xs text-slate-600">
                      <strong>Target Criteria:</strong> {camp.target_audience}
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Link2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="text-slate-400 font-semibold shrink-0">Your Link:</span>
                      <code className="font-mono text-slate-800 truncate select-all">
                        {trackingLink}
                      </code>
                    </div>

                    <Badge variant="brand" className="text-[10px] self-start sm:self-auto font-mono">
                      Attribution: ref={user.id.slice(0, 8)}...
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Megaphone className="h-8 w-8 text-slate-400" />}
          title="No campaigns available"
          description="There are currently no active campaigns in the PostgreSQL database."
        />
      )}
    </div>
  );
}

