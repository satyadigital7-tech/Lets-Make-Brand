import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import {
  PartnerEarningsView,
  PartnerCommissionTransactionItem,
} from "./partner-earnings-view";

export const dynamic = "force-dynamic";

export default async function PartnerCommissionPage() {
  const user = await requireRole(["independent_partner", "team_member", "super_admin", "team_leader"]);
  const supabase = await createClient();

  // 1. Fetch authenticated partner's own transactions strictly (Module 6)
  const { data: txnsData } = await supabase
    .from("commission_transactions")
    .select(`
      id,
      transaction_code,
      lead_id,
      campaign_id,
      commission_amount,
      transaction_type,
      commission_status,
      reference_code,
      description,
      created_at,
      lead:lead_id (lead_code),
      campaign:campaign_id (title, brand_name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // 2. Fetch pending leads to calculate pending potential earnings
  const { data: pendingLeads } = await supabase
    .from("leads")
    .select("commission_amount")
    .eq("submitted_by", user.id)
    .in("status", ["pending", "under_verification", "correction_requested"]);

  let pendingEarnings = 0;
  for (const l of (pendingLeads as any[]) || []) {
    pendingEarnings += Number(l.commission_amount || 0);
  }

  let totalEarnings = 0;
  let approvedEarnings = 0;

  const transactions: PartnerCommissionTransactionItem[] = ((txnsData as any[]) || []).map((t: any) => {
    const leadObj = Array.isArray(t.lead) ? t.lead[0] : t.lead;
    const campObj = Array.isArray(t.campaign) ? t.campaign[0] : t.campaign;
    const amt = Number(t.commission_amount || 0);

    if (t.transaction_type === "credit") {
      totalEarnings += amt;
      if (t.commission_status === "approved") {
        approvedEarnings += amt;
      }
    } else if (t.transaction_type === "reversal") {
      totalEarnings -= amt;
      approvedEarnings -= amt;
    }

    return {
      id: t.id,
      transactionCode: t.transaction_code,
      leadCode: leadObj?.lead_code || "LMB-LED-000000",
      campaignTitle: campObj?.title || "Campaign",
      campaignBrand: campObj?.brand_name || "Enterprise Brand",
      amount: amt,
      transactionType: t.transaction_type,
      status: t.commission_status,
      referenceCode: t.reference_code,
      description: t.description,
      createdAt: t.created_at,
    };
  });

  const availableEarnings = Math.max(0, approvedEarnings);
  const totalWithdrawn = 0; // Payout settlements are handled in Phase 5

  const summary = {
    totalEarnings,
    pendingEarnings,
    approvedEarnings,
    availableEarnings,
    totalWithdrawn,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Earnings & Commission Accruals"
        description="Inspect itemized earnings statements, track commission credits, and review payouts for verified lead promotions."
        badge="Partner Workspace"
      />

      <PartnerEarningsView transactions={transactions} summary={summary} />
    </div>
  );
}
