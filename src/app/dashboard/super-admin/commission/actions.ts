"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";
import {
  commissionRuleSchema,
  CommissionRuleFormData,
  commissionReversalSchema,
  CommissionReversalFormData,
} from "@/lib/security/validation";
import {
  processLeadCommission,
  reverseCommissionTransaction,
} from "@/lib/services/commission";

/**
 * Super Admin saves or updates campaign commission rule (Module 1)
 */
export async function saveCommissionRuleAction(data: CommissionRuleFormData) {
  const user = await requireRole(["super_admin"]);
  const validated = commissionRuleSchema.parse(data);
  const adminClient = createAdminClient();

  // Fetch campaign to ensure existence
  const { data: campaign, error: campErr } = await adminClient
    .from("campaigns")
    .select("id, title")
    .eq("id", validated.campaignId)
    .single();

  if (campErr || !campaign) {
    throw new Error("Target campaign does not exist.");
  }

  // Check if existing rule exists
  const { data: existing } = await adminClient
    .from("commission_rules")
    .select("id, version")
    .eq("campaign_id", validated.campaignId)
    .maybeSingle();

  let ruleId: string;
  const newVersion = existing ? existing.version + 1 : 1;

  if (existing) {
    const { data: updated, error: updErr } = await adminClient
      .from("commission_rules")
      .update({
        max_commission_amount: validated.maxCommissionAmount,
        partner_default_commission: validated.partnerDefaultCommission,
        vendor_max_commission: validated.vendorMaxCommission,
        independent_partner_commission: validated.independentPartnerCommission,
        version: newVersion,
        notes: validated.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (updErr || !updated) {
      throw new Error(`Failed to update commission rule: ${updErr?.message}`);
    }
    ruleId = updated.id;
  } else {
    const { data: inserted, error: insErr } = await adminClient
      .from("commission_rules")
      .insert({
        campaign_id: validated.campaignId,
        max_commission_amount: validated.maxCommissionAmount,
        partner_default_commission: validated.partnerDefaultCommission,
        vendor_max_commission: validated.vendorMaxCommission,
        independent_partner_commission: validated.independentPartnerCommission,
        version: 1,
        notes: validated.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (insErr || !inserted) {
      throw new Error(`Failed to create commission rule: ${insErr?.message}`);
    }
    ruleId = inserted.id;
  }

  // Also update campaign commission_amount to match max cap for catalog consistency
  await adminClient
    .from("campaigns")
    .update({
      commission_amount: validated.maxCommissionAmount,
      commission_rate: validated.maxCommissionAmount,
      max_payout: validated.maxCommissionAmount,
    })
    .eq("id", validated.campaignId);

  await logAuditEvent({
    userId: user.id,
    action: "SAVE_COMMISSION_RULE",
    entityType: "commission_rules",
    entityId: ruleId,
    details: {
      campaignId: validated.campaignId,
      campaignTitle: campaign.title,
      maxCommissionAmount: validated.maxCommissionAmount,
      partnerDefaultCommission: validated.partnerDefaultCommission,
      vendorMaxCommission: validated.vendorMaxCommission,
      independentPartnerCommission: validated.independentPartnerCommission,
      version: newVersion,
    },
  });

  revalidatePath("/dashboard/super-admin/commission");
  revalidatePath("/dashboard/super-admin/campaigns");
  revalidatePath("/dashboard/vendor/commission");
  revalidatePath("/dashboard/partner/campaigns");

  return { success: true, ruleId };
}

/**
 * Super Admin reverses an existing commission transaction (Module 8 & 10)
 */
export async function reverseCommissionAction(data: CommissionReversalFormData) {
  const user = await requireRole(["super_admin"]);
  const validated = commissionReversalSchema.parse(data);
  const adminClient = createAdminClient();

  const result = await reverseCommissionTransaction(
    validated.transactionId,
    validated.reason,
    user.id,
    adminClient
  );

  await logAuditEvent({
    userId: user.id,
    action: "REVERSE_COMMISSION",
    entityType: "commission_transactions",
    entityId: validated.transactionId,
    details: {
      transactionId: validated.transactionId,
      reason: validated.reason,
      reversalCode: (result as any).reversalCode,
    },
  });

  revalidatePath("/dashboard/super-admin/commission");
  revalidatePath("/dashboard/vendor/commission");
  revalidatePath("/dashboard/partner/commission");

  return { success: true };
}

/**
 * Re-trigger commission processing for an approved lead
 */
export async function reprocessLeadCommissionAction(leadId: string) {
  const user = await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const result = await processLeadCommission(leadId, user.id, adminClient);

  if (!result.success) {
    throw new Error(result.error || "Failed to process commission");
  }

  revalidatePath("/dashboard/super-admin/commission");
  revalidatePath("/dashboard/super-admin/leads");
  revalidatePath("/dashboard/vendor/commission");
  revalidatePath("/dashboard/partner/commission");

  return result;
}

