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

export default async function TeamLeaderCampaignsPage() {
  await requireRole(["team_leader", "super_admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const campaigns = ((data as any[]) || []).map((c: any) => c);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad Campaign Allocations"
        description="Select verified brand deals from PostgreSQL to allocate across your agency squad."
        badge="PostgreSQL Records"
      />

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
                    {camp.commission_type === "percentage"
                      ? `${camp.commission_rate}%`
                      : formatCurrency(camp.commission_rate)}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{camp.title}</h4>
                <p className="text-xs text-slate-500 line-clamp-2">{camp.description}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Target: {camp.target_audience || "General"}</span>
                  <Badge variant="outline" className="text-[10px]">Active</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Megaphone className="h-8 w-8 text-slate-400" />}
          title="No campaigns available in database"
          description="Live verified brand campaigns will populate here once vendors publish them."
        />
      )}
    </div>
  );
}

