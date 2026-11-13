import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { LeadManager, LeadItem, FilterOption } from "./lead-manager";

export default async function SuperAdminLeadsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // 1. Fetch all leads with relational entities
  const { data: leadsData } = await adminClient
    .from("leads")
    .select(`
      *,
      campaign:campaign_id (
        id,
        title,
        brand_name
      ),
      submitter:submitted_by (
        id,
        full_name,
        email
      ),
      vendor:vendor_id (
        id,
        business_name,
        company_name,
        full_name
      ),
      team:team_id (
        id,
        name,
        team_code
      ),
      lead_documents (
        id,
        document_name,
        document_type,
        file_url
      ),
      lead_status_history (
        id,
        action,
        previous_status,
        new_status,
        comments,
        created_at,
        actor:actor_id (
          full_name,
          email
        )
      )
    `)
    .order("created_at", { ascending: false });

  // 2. Fetch filter options: campaigns, vendors, teams
  const { data: campaignsList } = await adminClient
    .from("campaigns")
    .select("id, title")
    .order("title");

  const { data: teamsList } = await adminClient
    .from("teams")
    .select("id, name")
    .order("name");

  const campaignOptions: FilterOption[] = ((campaignsList as any[]) || []).map((c) => ({
    id: c.id,
    name: c.title,
  }));

  const teamOptions: FilterOption[] = ((teamsList as any[]) || []).map((t) => ({
    id: t.id,
    name: t.name,
  }));

  const vendorOptions: FilterOption[] = [];

  const rawLeads = (leadsData as any[]) || [];

  const formattedLeads: LeadItem[] = rawLeads.map((l) => {
    const campObj = Array.isArray(l.campaign) ? l.campaign[0] : l.campaign;
    const subObj = Array.isArray(l.submitter) ? l.submitter[0] : l.submitter;
    const venObj = Array.isArray(l.vendor) ? l.vendor[0] : l.vendor;
    const teamObj = Array.isArray(l.team) ? l.team[0] : l.team;

    const docs = ((l.lead_documents as any[]) || []).map((d) => ({
      id: d.id,
      documentName: d.document_name,
      documentType: d.document_type,
      fileUrl: d.file_url,
    }));

    const historyItems = ((l.lead_status_history as any[]) || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((h) => {
        const actorObj = Array.isArray(h.actor) ? h.actor[0] : h.actor;
        return {
          id: h.id,
          actorName: actorObj?.full_name || actorObj?.email || "System Admin",
          action: h.action,
          previousStatus: h.previous_status,
          newStatus: h.new_status,
          comments: h.comments,
          createdAt: h.created_at,
        };
      });

    return {
      id: l.id,
      leadCode: l.lead_code || "LMB-LED-000000",
      campaignId: l.campaign_id,
      campaignTitle: campObj?.title || "Campaign",
      campaignBrand: campObj?.brand_name || "LMB Client",
      customerName: l.customer_name,
      customerMobile: l.customer_mobile,
      customerEmail: l.customer_email,
      customerLocation: l.customer_location,
      address: l.address,
      additionalFields: (l.additional_fields as Record<string, any>) || {},
      status: l.status,
      rejectionReason: l.rejection_reason,
      correctionNotes: l.correction_notes,
      commissionAmount: Number(l.commission_amount || 0),
      isDuplicate: Boolean(l.is_duplicate),
      duplicateOfLeadCode: l.duplicate_of_lead_id || null,
      submittedByName: subObj?.full_name || subObj?.email || "Promoter",
      submittedByEmail: subObj?.email || "",
      vendorName: venObj?.business_name || venObj?.company_name || venObj?.full_name || null,
      teamName: teamObj?.name || null,
      createdAt: l.created_at,
      documents: docs,
      history: historyItems,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbound Lead Management & Verification Engine"
        description="Review customer submissions, verify supporting documentation, execute compliance decisions, and govern commission attribution."
        badge={`${formattedLeads.length} Total Leads`}
      />

      <LeadManager
        initialLeads={formattedLeads}
        campaignOptions={campaignOptions}
        vendorOptions={vendorOptions}
        teamOptions={teamOptions}
      />
    </div>
  );
}
