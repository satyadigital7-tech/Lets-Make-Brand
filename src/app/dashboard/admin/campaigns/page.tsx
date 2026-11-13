import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { CampaignManager } from "@/app/dashboard/super-admin/campaigns/campaign-manager";

export const dynamic = "force-dynamic";

export default async function AdminCampaignsPage() {
  await requireRole(["admin", "super_admin"]);
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from("campaigns")
    .select("*")
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
        title="Admin Campaign Operations"
        description="Verify brand campaign guidelines, inspect budget thresholds, and manage listing statuses."
        badge="PostgreSQL Records"
      />

      <CampaignManager initialCampaigns={campaigns} />
    </div>
  );
}

