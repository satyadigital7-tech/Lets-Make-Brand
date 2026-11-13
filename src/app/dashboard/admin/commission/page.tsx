import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import {
  CommissionAdminView,
  CommissionTransactionItem,
  CampaignRuleItem,
} from "@/app/dashboard/super-admin/commission/commission-admin-view";

export const dynamic = "force-dynamic";

export default async function AdminCommissionPage() {
  await requireRole(["admin", "super_admin"]);
  const adminClient = createAdminClient();

  // 1. Fetch Commission Transactions with relations
  const { data: txnsData } = await adminClient
    .from("commission_transactions")
    .select(`
      id,
      transaction_code,
      lead_id,
      campaign_id,
      vendor_id,
      partner_id,
      team_id,
      user_id,
      beneficiary_role,
      commission_amount,
      transaction_type,
      commission_status,
      reference_code,
      description,
      created_at,
      lead:lead_id (lead_code),
      campaign:campaign_id (title),
      vendor:vendor_id (full_name, business_name),
      partner:partner_id (full_name, email),
      team:team_id (name),
      beneficiary:user_id (full_name, business_name, email)
    `)
    .order("created_at", { ascending: false });

  // 2. Fetch Commission Rules with campaigns
  const { data: rulesData } = await adminClient
    .from("commission_rules")
    .select(`
      id,
      campaign_id,
      max_commission_amount,
      partner_default_commission,
      vendor_max_commission,
      independent_partner_commission,
      is_active,
      version,
      updated_at,
      campaign:campaign_id (title, campaign_code, brand_name)
    `)
    .order("created_at", { ascending: false });

  // 3. Fetch Campaigns list for selector/reports
  const { data: campaignsData } = await adminClient
    .from("campaigns")
    .select("id, title, campaign_code")
    .order("title", { ascending: true });

  const transactions: CommissionTransactionItem[] = ((txnsData as any[]) || []).map((t: any) => {
    const leadObj = Array.isArray(t.lead) ? t.lead[0] : t.lead;
    const campObj = Array.isArray(t.campaign) ? t.campaign[0] : t.campaign;
    const vendorObj = Array.isArray(t.vendor) ? t.vendor[0] : t.vendor;
    const partnerObj = Array.isArray(t.partner) ? t.partner[0] : t.partner;
    const teamObj = Array.isArray(t.team) ? t.team[0] : t.team;
    const benObj = Array.isArray(t.beneficiary) ? t.beneficiary[0] : t.beneficiary;

    return {
      id: t.id,
      transactionCode: t.transaction_code,
      leadId: t.lead_id,
      leadCode: leadObj?.lead_code || "LMB-LED-000000",
      campaignId: t.campaign_id,
      campaignTitle: campObj?.title || "Campaign",
      vendorId: t.vendor_id,
      vendorName: vendorObj?.business_name || vendorObj?.full_name || null,
      partnerId: t.partner_id,
      partnerName: partnerObj?.full_name || partnerObj?.email || "Partner",
      teamId: t.team_id,
      teamName: teamObj?.name || null,
      userId: t.user_id,
      beneficiaryName: benObj?.business_name || benObj?.full_name || benObj?.email || "User",
      beneficiaryRole: t.beneficiary_role,
      commissionAmount: Number(t.commission_amount || 0),
      transactionType: t.transaction_type,
      commissionStatus: t.commission_status,
      referenceCode: t.reference_code,
      description: t.description,
      createdAt: t.created_at,
    };
  });

  const rules: CampaignRuleItem[] = ((rulesData as any[]) || []).map((r: any) => {
    const camp = Array.isArray(r.campaign) ? r.campaign[0] : r.campaign;
    return {
      campaignId: r.campaign_id,
      campaignTitle: camp?.title || "Campaign",
      campaignCode: camp?.campaign_code || "LMB-CMP-000000",
      brandName: camp?.brand_name || "Brand",
      maxCommissionAmount: Number(r.max_commission_amount),
      partnerDefaultCommission: Number(r.partner_default_commission),
      vendorMaxCommission: Number(r.vendor_max_commission || 0),
      independentPartnerCommission: Number(r.independent_partner_commission),
      isActive: r.is_active,
      version: r.version,
      updatedAt: r.updated_at,
    };
  });

  let totalCommission = 0;
  let vendorCommission = 0;
  let partnerCommission = 0;
  let approvedCommission = 0;
  let pendingCommission = 0;
  let reversedCommission = 0;

  for (const t of transactions) {
    const amt = t.commissionAmount;
    if (t.transactionType === "reversal") {
      reversedCommission += amt;
    } else {
      totalCommission += amt;
      if (t.beneficiaryRole === "vendor") vendorCommission += amt;
      if (t.beneficiaryRole === "partner") partnerCommission += amt;
      if (t.commissionStatus === "approved") approvedCommission += amt;
      if (t.commissionStatus === "pending") pendingCommission += amt;
    }
  }

  const summary = {
    totalCommission,
    vendorCommission,
    partnerCommission,
    approvedCommission,
    pendingCommission,
    reversedCommission,
    totalTransactions: transactions.length,
  };

  const campaignsList = ((campaignsData as any[]) || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    code: c.campaign_code || "LMB-CMP-000000",
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Commission Operations"
        description="Monitor commission transactions, inspect rule caps, and review financial distributions."
        badge="Platform Operations"
      />

      <CommissionAdminView
        transactions={transactions}
        rules={rules}
        campaignsList={campaignsList}
        summary={summary}
      />
    </div>
  );
}
