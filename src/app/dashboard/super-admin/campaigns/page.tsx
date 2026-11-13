import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { CampaignManager, CampaignItem, TargetOption } from "./campaign-manager";

export default async function SuperAdminCampaignsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // 1. Fetch campaigns with assignments
  const { data: campaignsData } = await adminClient
    .from("campaigns")
    .select(`
      *,
      campaign_assignments (
        id,
        assigned_type,
        partner_id,
        vendor_id,
        team_id,
        team_member_id,
        partner:partner_id (full_name, email),
        vendor:vendor_id (business_name, full_name),
        team:team_id (name, team_code),
        team_member:team_member_id (full_name, email)
      )
    `)
    .order("created_at", { ascending: false });

  // 2. Fetch available targets for assignment
  const { data: partnersData } = await adminClient
    .from("profiles")
    .select("id, full_name, email, registration_type")
    .eq("status", "active");

  const { data: teamsData } = await adminClient
    .from("teams")
    .select("id, name, team_code")
    .eq("status", "active");

  const availableTargets: TargetOption[] = [];

  for (const p of (partnersData as any[]) || []) {
    if (p.registration_type === "independent") {
      availableTargets.push({
        id: p.id,
        name: `${p.full_name || p.email} (Partner)`,
        type: "partner",
      });
    } else {
      availableTargets.push({
        id: p.id,
        name: `${p.full_name || p.email} (Team Member)`,
        type: "team_member",
      });
    }
  }

  for (const t of (teamsData as any[]) || []) {
    availableTargets.push({
      id: t.id,
      name: `${t.name} (${t.team_code})`,
      type: "team",
    });
  }

  // Also vendors
  const { data: vendorsData } = await adminClient
    .from("user_roles")
    .select(`
      user_id,
      profiles:user_id (id, full_name, business_name, email),
      roles!inner (code)
    `)
    .eq("roles.code", "vendor");

  for (const v of (vendorsData as any[]) || []) {
    const prof = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
    if (prof) {
      availableTargets.push({
        id: prof.id,
        name: `${prof.business_name || prof.full_name || prof.email} (Vendor)`,
        type: "vendor",
      });
    }
  }

  const campaigns: CampaignItem[] = ((campaignsData as any[]) || []).map((c: any) => {
    const assignmentsList = ((c.campaign_assignments as any[]) || []).map((a: any) => {
      let targetName = "All Approved Partners";
      if (a.assigned_type === "partner") {
        const p = Array.isArray(a.partner) ? a.partner[0] : a.partner;
        targetName = p?.full_name || p?.email || "Partner";
      } else if (a.assigned_type === "vendor") {
        const v = Array.isArray(a.vendor) ? a.vendor[0] : a.vendor;
        targetName = v?.business_name || v?.full_name || "Vendor";
      } else if (a.assigned_type === "team") {
        const t = Array.isArray(a.team) ? a.team[0] : a.team;
        targetName = t?.name || "Squad";
      } else if (a.assigned_type === "team_member") {
        const m = Array.isArray(a.team_member) ? a.team_member[0] : a.team_member;
        targetName = m?.full_name || m?.email || "Team Member";
      }

      return {
        id: a.id,
        assignedType: a.assigned_type,
        targetName,
      };
    });

    return {
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
      commissionRate: Number(c.commission_rate),
      commissionAmount: Number(c.commission_amount || c.commission_rate || 0),
      maxPayout: c.max_payout ? Number(c.max_payout) : null,
      budget: Number(c.budget),
      status: c.status,
      startDate: c.start_date,
      endDate: c.end_date,
      requiredDocuments: (c.required_documents as string[]) || [],
      dynamicFields: (c.dynamic_fields as any[]) || [],
      createdAt: c.created_at,
      assignments: assignmentsList,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns & Lead Funnel Management"
        description="Provision brand campaigns, configure dynamic lead capture forms, assign target partner squads, and monitor promotional status."
        badge={`${campaigns.length} Campaigns`}
      />

      <CampaignManager
        initialCampaigns={campaigns}
        availableTargets={availableTargets}
      />
    </div>
  );
}
