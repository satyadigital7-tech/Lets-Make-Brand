import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { CampaignManager, CampaignItem } from "@/app/dashboard/super-admin/campaigns/campaign-manager";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  await requireRole(["admin", "super_admin"]);
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  const campaigns: CampaignItem[] = ((data as any[]) || []).map((c: any) => ({
    id: c.id,
    campaignCode: c.campaign_code || "LMB-CMP-000001",
    title: c.title,
    brandName: c.brand_name || "Enterprise Brand",
    slug: c.slug,
    category: c.category,
    description: c.description,
    instructions: c.instructions || null,
    eligibility: c.eligibility || null,
    bannerImageUrl: c.banner_image_url || null,
    commissionRate: Number(c.commission_rate || 0),
    commissionAmount: Number(c.commission_amount || c.commission_rate || 0),
    maxPayout: c.max_payout ? Number(c.max_payout) : null,
    budget: Number(c.budget),
    status: c.status,
    startDate: c.start_date || null,
    endDate: c.end_date || null,
    requiredDocuments: Array.isArray(c.required_documents) ? c.required_documents : [],
    dynamicFields: Array.isArray(c.dynamic_fields) ? c.dynamic_fields : [],
    createdAt: c.created_at,
    assignments: [],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Campaign Operations"
        description="Verify brand campaign guidelines, inspect budget thresholds, and manage listing statuses."
        badge="PostgreSQL Records"
      />

      <CampaignManager initialCampaigns={campaigns} />
    </div>
  );
}

