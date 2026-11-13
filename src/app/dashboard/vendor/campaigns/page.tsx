import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { CampaignManager } from "@/app/dashboard/super-admin/campaigns/campaign-manager";

export const dynamic = "force-dynamic";

export default async function VendorCampaignsPage() {
  const user = await requireRole(["vendor", "super_admin"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("campaigns")
    .select("*")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: false });

  const campaigns = ((data as any[]) || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    category: c.category,
    description: c.description,
    commission_rate: Number(c.commission_rate),
    commission_type: c.commission_type as "percentage" | "fixed",
    budget: Number(c.budget),
    status: c.status as "draft" | "pending_approval" | "active" | "paused" | "completed",
    created_at: c.created_at,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Brand Campaigns"
        description="Launch, monitor, and adjust promotional campaigns for your products and services."
        badge="Vendor Workspace"
      />

      <CampaignManager initialCampaigns={campaigns} />
    </div>
  );
}

