import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { PartnerLeadsList, PartnerLeadItem } from "./partner-leads-list";

export default async function PartnerLeadsPage() {
  const user = await requireRole([
    "independent_partner",
    "team_leader",
    "team_member",
    "super_admin",
  ]);
  const adminClient = createAdminClient();

  // Fetch leads submitted strictly by this partner (Privacy & Data Isolation)
  const { data: leadsData } = await adminClient
    .from("leads")
    .select(`
      id,
      lead_code,
      customer_name,
      customer_mobile,
      customer_email,
      customer_location,
      status,
      rejection_reason,
      correction_notes,
      commission_amount,
      is_duplicate,
      created_at,
      campaign:campaign_id (
        title,
        brand_name
      ),
      lead_documents (
        id,
        document_name,
        file_url
      )
    `)
    .eq("submitted_by", user.id)
    .order("created_at", { ascending: false });

  const rawLeads = (leadsData as any[]) || [];

  const formattedLeads: PartnerLeadItem[] = rawLeads.map((l) => {
    const campObj = Array.isArray(l.campaign) ? l.campaign[0] : l.campaign;
    const docs = ((l.lead_documents as any[]) || []).map((d) => ({
      id: d.id,
      name: d.document_name,
      url: d.file_url,
    }));

    return {
      id: l.id,
      leadCode: l.lead_code || "LMB-LED-000000",
      campaignTitle: campObj?.title || "Campaign",
      campaignBrand: campObj?.brand_name || "LMB Client",
      customerName: l.customer_name,
      customerMobile: l.customer_mobile,
      customerEmail: l.customer_email,
      customerLocation: l.customer_location,
      status: l.status,
      rejectionReason: l.rejection_reason,
      correctionNotes: l.correction_notes,
      commissionAmount: Number(l.commission_amount || 0),
      isDuplicate: Boolean(l.is_duplicate),
      createdAt: l.created_at,
      documents: docs,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Submitted Promotional Leads"
        description="Track customer conversion verification, review admin feedback, resolve requested corrections, and monitor payout qualification."
        badge={`${formattedLeads.length} Total Submissions`}
      />

      <PartnerLeadsList initialLeads={formattedLeads} />
    </div>
  );
}
