import React from "react";
import { Megaphone, Link2 } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeamMemberCampaignsPage() {
  const user = await requireRole(["team_member", "team_leader", "super_admin"]);
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
        title="Assigned Brand Campaigns"
        description="Campaigns available for you to promote with your personalized agent referral code."
        badge="PostgreSQL Records"
      />

      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {campaigns.map((camp) => {
            const trackingLink = `${siteUrl}/c/${camp.slug}?agent=${user.id}`;

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
                        Base Commission
                      </span>
                      <span className="text-xl font-extrabold text-blue-600">
                        {camp.commission_type === "percentage"
                          ? `${camp.commission_rate}%`
                          : formatCurrency(camp.commission_rate)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Link2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="text-slate-400 font-semibold shrink-0">Your Agent Link:</span>
                      <code className="font-mono text-slate-800 truncate select-all">
                        {trackingLink}
                      </code>
                    </div>

                    <Badge variant="brand" className="text-[10px] font-mono">
                      Agent ID: {user.id.slice(0, 8)}...
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
          title="No campaigns assigned"
          description="Your team leader has not allocated any brand campaigns to this squad yet."
        />
      )}
    </div>
  );
}

