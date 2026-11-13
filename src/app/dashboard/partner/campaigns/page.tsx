import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { PartnerCampaignList, PartnerCampaignItem } from "./partner-campaign-list";

export default async function PartnerCampaignsPage() {
  const user = await requireRole([
    "independent_partner",
    "team_leader",
    "team_member",
    "super_admin",
  ]);
  const adminClient = createAdminClient();

  // 1. Fetch user's team memberships and associated vendor
  const { data: teamMemberships } = await adminClient
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  const userTeamIds = ((teamMemberships as any[]) || []).map((tm) => tm.team_id);

  const { data: userProfile } = await adminClient
    .from("profiles")
    .select("associated_vendor_id, status")
    .eq("id", user.id)
    .single();

  const userVendorId = userProfile?.associated_vendor_id;

  // 2. Fetch all active campaigns
  const { data: allActiveCampaigns } = await adminClient
    .from("campaigns")
    .select(`
      *,
      campaign_assignments (
        id,
        assigned_type,
        partner_id,
        vendor_id,
        team_id,
        team_member_id
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const rawList = (allActiveCampaigns as any[]) || [];

  // 3. Filter campaigns by authorization (Module 2 & 3)
  const isSuperAdmin = user.roles.includes("super_admin");

  const authorizedCampaigns = rawList.filter((camp) => {
    if (isSuperAdmin) return true;

    const assignments = (camp.campaign_assignments as any[]) || [];

    // If campaign has no assignments, it's open to all active partners
    if (assignments.length === 0) return true;

    // Check if any assignment grants access to this partner
    return assignments.some((a) => {
      if (a.assigned_type === "all_partners") return true;
      if (a.assigned_type === "partner" && a.partner_id === user.id) return true;
      if (a.assigned_type === "team_member" && a.team_member_id === user.id) return true;
      if (a.assigned_type === "team" && a.team_id && userTeamIds.includes(a.team_id)) return true;
      if (a.assigned_type === "vendor" && a.vendor_id && a.vendor_id === userVendorId) return true;
      return false;
    });
  });

  const formattedCampaigns: PartnerCampaignItem[] = authorizedCampaigns.map((c) => ({
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
    commissionAmount: Number(c.commission_amount || c.commission_rate || 0),
    startDate: c.start_date,
    endDate: c.end_date,
    status: c.status,
    requiredDocuments: (c.required_documents as string[]) || [],
    dynamicFields: (c.dynamic_fields as any[]) || [],
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://letsmakebrand.com";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Promotional Campaigns"
        description="Select verified brand offers, generate unique referral links, and submit qualified customer leads for verification."
        badge={`${formattedCampaigns.length} Authorized Campaigns`}
      />

      <PartnerCampaignList
        campaigns={formattedCampaigns}
        userId={user.id}
        siteUrl={siteUrl}
      />
    </div>
  );
}
