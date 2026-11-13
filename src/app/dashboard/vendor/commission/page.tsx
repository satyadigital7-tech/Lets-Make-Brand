import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import {
  VendorCommissionView,
  VendorSplitItem,
  VendorTransactionItem,
  MemberEarningsItem,
  CampaignEarningsItem,
} from "./vendor-commission-view";

export const dynamic = "force-dynamic";

export default async function VendorCommissionPage() {
  const user = await requireRole(["vendor", "super_admin"]);
  const adminClient = createAdminClient();

  // 1. Fetch campaigns and Super Admin rules
  const { data: campaignsData } = await adminClient
    .from("campaigns")
    .select(`
      id,
      title,
      campaign_code,
      brand_name,
      commission_amount,
      commission_rate,
      commission_rules (
        id,
        max_commission_amount,
        partner_default_commission,
        vendor_max_commission
      )
    `)
    .eq("status", "active")
    .order("title", { ascending: true });

  // 2. Fetch existing active vendor splits
  const { data: splitsData } = await adminClient
    .from("vendor_commission_splits")
    .select("*")
    .eq("vendor_id", user.id)
    .eq("is_active", true);

  const splitsMap = new Map<string, any>();
  for (const s of (splitsData as any[]) || []) {
    splitsMap.set(s.campaign_id, s);
  }

  const splits: VendorSplitItem[] = ((campaignsData as any[]) || []).map((c: any) => {
    const ruleObj = Array.isArray(c.commission_rules) ? c.commission_rules[0] : c.commission_rules;
    const maxCap = Number(ruleObj?.max_commission_amount ?? (c.commission_amount || c.commission_rate || 500));
    const activeSplit = splitsMap.get(c.id);

    return {
      id: activeSplit?.id || `new-${c.id}`,
      campaignId: c.id,
      campaignTitle: c.title,
      campaignCode: c.campaign_code || "LMB-CMP-000000",
      brandName: c.brand_name || "Enterprise Brand",
      maxCap,
      vendorShare: activeSplit ? Number(activeSplit.vendor_share) : Number(ruleObj?.vendor_max_commission ?? maxCap * 0.2),
      partnerShare: activeSplit ? Number(activeSplit.partner_share) : Number(ruleObj?.partner_default_commission ?? maxCap * 0.8),
      version: activeSplit ? activeSplit.version : 1,
      isActive: true,
    };
  });

  // 3. Fetch transactions related to this vendor (Module 7 & 8)
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
      created_at,
      lead:lead_id (lead_code),
      campaign:campaign_id (title),
      partner:partner_id (full_name, email),
      team:team_id (name)
    `)
    .or(`vendor_id.eq.${user.id},user_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  let totalVendorEarnings = 0;
  let approvedCommission = 0;
  let pendingCommission = 0;
  let teamCommissionDistributed = 0;

  const memberMap = new Map<string, MemberEarningsItem>();
  const campaignMap = new Map<string, CampaignEarningsItem>();

  const transactions: VendorTransactionItem[] = ((txnsData as any[]) || []).map((t: any) => {
    const leadObj = Array.isArray(t.lead) ? t.lead[0] : t.lead;
    const campObj = Array.isArray(t.campaign) ? t.campaign[0] : t.campaign;
    const partnerObj = Array.isArray(t.partner) ? t.partner[0] : t.partner;
    const teamObj = Array.isArray(t.team) ? t.team[0] : t.team;
    const amt = Number(t.commission_amount || 0);

    // If beneficiary is Vendor
    if (t.beneficiary_role === "vendor" && t.user_id === user.id) {
      if (t.transaction_type === "credit") {
        totalVendorEarnings += amt;
        if (t.commission_status === "approved") approvedCommission += amt;
        if (t.commission_status === "pending") pendingCommission += amt;
      } else if (t.transaction_type === "reversal") {
        totalVendorEarnings -= amt;
        approvedCommission -= amt;
      }
    }

    // If partner under this vendor
    if (t.beneficiary_role === "partner") {
      teamCommissionDistributed += amt;

      const pId = t.partner_id;
      if (!memberMap.has(pId)) {
        memberMap.set(pId, {
          memberId: pId,
          name: partnerObj?.full_name || "Team Member",
          email: partnerObj?.email || "",
          leadsCount: 0,
          approvedCount: 0,
          earnings: 0,
        });
      }
      const m = memberMap.get(pId)!;
      m.leadsCount += 1;
      if (t.commission_status === "approved") m.approvedCount += 1;
      m.earnings += amt;
    }

    // Campaign aggregation
    const cId = t.campaign_id;
    if (!campaignMap.has(cId)) {
      campaignMap.set(cId, {
        campaignId: cId,
        title: campObj?.title || "Campaign",
        leadsCount: 0,
        vendorEarnings: 0,
        partnerEarnings: 0,
      });
    }
    const cStat = campaignMap.get(cId)!;
    cStat.leadsCount += 1;
    if (t.beneficiary_role === "vendor") cStat.vendorEarnings += amt;
    if (t.beneficiary_role === "partner") cStat.partnerEarnings += amt;

    return {
      id: t.id,
      transactionCode: t.transaction_code,
      leadCode: leadObj?.lead_code || "LMB-LED-000000",
      campaignTitle: campObj?.title || "Campaign",
      partnerName: partnerObj?.full_name || partnerObj?.email || "Partner",
      teamName: teamObj?.name || null,
      beneficiaryRole: t.beneficiary_role,
      amount: amt,
      transactionType: t.transaction_type,
      status: t.commission_status,
      createdAt: t.created_at,
    };
  });

  const memberEarnings = Array.from(memberMap.values()).sort((a, b) => b.earnings - a.earnings);
  const campaignEarnings = Array.from(campaignMap.values()).sort((a, b) => b.vendorEarnings - a.vendorEarnings);

  const summary = {
    totalVendorEarnings,
    pendingCommission,
    approvedCommission,
    teamCommissionDistributed,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Commission & Split Distribution"
        description="Configure profit sharing ratios for promotional squads and monitor agency override accruals."
        badge="Vendor Workspace"
      />

      <VendorCommissionView
        splits={splits}
        transactions={transactions}
        memberEarnings={memberEarnings}
        campaignEarnings={campaignEarnings}
        summary={summary}
      />
    </div>
  );
}

