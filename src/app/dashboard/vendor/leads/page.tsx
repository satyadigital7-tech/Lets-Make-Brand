import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { VendorLeadsView, VendorLeadItem } from "./vendor-leads-view";

export default async function VendorLeadsPage() {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  // 1. Fetch leads strictly belonging to this vendor organization (Cross-Vendor Data Isolation)
  const { data: leadsData } = await adminClient
    .from("leads")
    .select(`
      id,
      lead_code,
      campaign_id,
      customer_name,
      customer_mobile,
      customer_email,
      customer_location,
      status,
      commission_amount,
      is_duplicate,
      team_id,
      submitted_by,
      created_at,
      campaign:campaign_id (title),
      team:team_id (name),
      submitter:submitted_by (full_name, email)
    `)
    .eq("vendor_id", currentVendor.id)
    .order("created_at", { ascending: false });

  // 2. Fetch vendor's teams for filter options
  const { data: teamsData } = await adminClient
    .from("teams")
    .select("id, name")
    .eq("vendor_id", currentVendor.id);

  // 3. Fetch unique campaigns from leads
  const rawLeads = (leadsData as any[]) || [];

  const campaignMap = new Map<string, string>();
  const memberMap = new Map<string, string>();

  const formattedLeads: VendorLeadItem[] = rawLeads.map((l) => {
    const campObj = Array.isArray(l.campaign) ? l.campaign[0] : l.campaign;
    const teamObj = Array.isArray(l.team) ? l.team[0] : l.team;
    const subObj = Array.isArray(l.submitter) ? l.submitter[0] : l.submitter;

    const campTitle = campObj?.title || "Campaign";
    const subName = subObj?.full_name || subObj?.email || "Promoter";

    if (l.campaign_id) campaignMap.set(l.campaign_id, campTitle);
    if (l.submitted_by) memberMap.set(l.submitted_by, subName);

    return {
      id: l.id,
      leadCode: l.lead_code || "LMB-LED-000000",
      campaignId: l.campaign_id,
      campaignTitle: campTitle,
      customerName: l.customer_name,
      customerMobile: l.customer_mobile,
      customerEmail: l.customer_email,
      customerLocation: l.customer_location,
      status: l.status,
      commissionAmount: Number(l.commission_amount || 0),
      isDuplicate: Boolean(l.is_duplicate),
      teamId: l.team_id,
      teamName: teamObj?.name || null,
      submitterId: l.submitted_by,
      submitterName: subName,
      createdAt: l.created_at,
    };
  });

  const campaignOptions = Array.from(campaignMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));

  const teamOptions = ((teamsData as any[]) || []).map((t: any) => ({
    id: t.id,
    name: t.name,
  }));

  const memberOptions = Array.from(memberMap.entries()).map(([id, name]) => ({
    id,
    name,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad Inbound Leads & Conversions"
        description="Monitor promotional customer referrals delivered across your appointed sales squads and brand partners."
        badge={`${formattedLeads.length} Total Leads`}
      />

      <VendorLeadsView
        initialLeads={formattedLeads}
        campaignOptions={campaignOptions}
        teamOptions={teamOptions}
        memberOptions={memberOptions}
      />
    </div>
  );
}
