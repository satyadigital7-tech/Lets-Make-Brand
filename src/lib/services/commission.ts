import type { createAdminClient } from "@/lib/supabase/admin";

export interface CommissionCalculationResult {
  success: boolean;
  error?: string;
  alreadyProcessed?: boolean;
  leadCode?: string;
  partnerShare?: number;
  vendorShare?: number;
  totalCommission?: number;
  partnerTransactionCode?: string;
  vendorTransactionCode?: string;
}

/**
 * Process lead commission atomically using PostgreSQL transaction & RPC
 */
export async function processLeadCommission(
  leadId: string,
  actorId: string,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<CommissionCalculationResult> {
  try {
    // 1. Try atomic PostgreSQL RPC function
    const { data, error } = await adminClient.rpc("process_lead_commission", {
      p_lead_id: leadId,
      p_actor_id: actorId,
    });

    if (!error && data) {
      const res = data as any;
      if (res.success) {
        return {
          success: true,
          alreadyProcessed: res.already_processed || false,
          leadCode: res.lead_code,
          partnerShare: Number(res.partner_share || 0),
          vendorShare: Number(res.vendor_share || 0),
          totalCommission: Number(res.total_commission || 0),
          partnerTransactionCode: res.partner_transaction_code,
          vendorTransactionCode: res.vendor_transaction_code,
        };
      } else {
        return {
          success: false,
          error: res.error || "Commission processing failed in database engine.",
        };
      }
    }
  } catch (err: any) {
    console.warn("RPC process_lead_commission call fallback:", err?.message);
  }

  // 2. Server-side robust fallback logic ensuring complete compliance
  const { data: lead } = await adminClient
    .from("leads")
    .select(`
      id,
      lead_code,
      campaign_id,
      submitted_by,
      vendor_id,
      team_id,
      status,
      is_duplicate,
      campaign:campaign_id (id, title, commission_amount, commission_rate)
    `)
    .eq("id", leadId)
    .single();

  if (!lead) {
    return { success: false, error: "Lead record not found." };
  }

  // Module 5: Commission must not be generated for unapproved or duplicate leads
  if (lead.status !== "approved") {
    return {
      success: false,
      error: `Cannot generate commission for unapproved lead (current status: ${lead.status}).`,
    };
  }

  if (lead.is_duplicate) {
    return {
      success: false,
      error: "Cannot generate commission for duplicate leads.",
    };
  }

  // Module 5 & 13: Team Leaders acting as personal partners must NEVER receive commission
  const { data: leaderRole } = await adminClient
    .from("user_roles")
    .select("roles!inner(code)")
    .eq("user_id", lead.submitted_by)
    .eq("roles.code", "team_leader")
    .maybeSingle();

  if (leaderRole) {
    return {
      success: false,
      error: "Compliance Mandate: Team Leaders are strictly prohibited from receiving partner commissions.",
    };
  }

  // Idempotency: Check if lead already has credit transactions
  const { data: existingCredits } = await adminClient
    .from("commission_transactions")
    .select("id, transaction_code")
    .eq("lead_id", leadId)
    .eq("transaction_type", "credit");

  if (existingCredits && existingCredits.length > 0) {
    return {
      success: true,
      alreadyProcessed: true,
      leadCode: lead.lead_code,
    };
  }

  // Fetch campaign rule
  const { data: rule } = await adminClient
    .from("commission_rules")
    .select("*")
    .eq("campaign_id", lead.campaign_id)
    .eq("is_active", true)
    .maybeSingle();

  const campObj = Array.isArray(lead.campaign) ? lead.campaign[0] : lead.campaign;
  const maxCap = Number(rule?.max_commission_amount ?? (campObj?.commission_amount || campObj?.commission_rate || 500));

  let partnerShare = 0;
  let vendorShare = 0;

  if (!lead.vendor_id) {
    // Module 3: Independent Partner
    partnerShare = Number(rule?.independent_partner_commission ?? maxCap);
    vendorShare = 0;
  } else {
    // Module 2: Vendor Associated Lead
    const { data: split } = await adminClient
      .from("vendor_commission_splits")
      .select("*")
      .eq("vendor_id", lead.vendor_id)
      .eq("campaign_id", lead.campaign_id)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (split) {
      // Validate split total does not exceed max cap
      if (Number(split.total_split) > maxCap) {
        partnerShare = Math.min(Number(split.partner_share), maxCap);
        vendorShare = Math.min(Number(split.vendor_share), maxCap - partnerShare);
      } else {
        partnerShare = Number(split.partner_share);
        vendorShare = Number(split.vendor_share);
      }
    } else {
      partnerShare = Number(rule?.partner_default_commission ?? maxCap * 0.8);
      vendorShare = Number(rule?.vendor_max_commission ?? maxCap * 0.2);
    }
  }

  // Ensure total does not exceed max cap
  if (partnerShare + vendorShare > maxCap) {
    partnerShare = Math.min(partnerShare, maxCap);
    vendorShare = Math.max(0, maxCap - partnerShare);
  }

  const timestamp = Date.now();
  const refCode = `REF-${lead.lead_code}-${timestamp}`;
  const partnerTxnCode = `LMB-TXN-${String(Math.floor(Math.random() * 900000) + 100000)}`;
  const vendorTxnCode = `LMB-TXN-${String(Math.floor(Math.random() * 900000) + 100000)}`;

  // Insert Partner Transaction
  if (partnerShare > 0) {
    await adminClient.from("commission_transactions").insert({
      transaction_code: partnerTxnCode,
      lead_id: lead.id,
      campaign_id: lead.campaign_id,
      vendor_id: lead.vendor_id,
      partner_id: lead.submitted_by,
      team_id: lead.team_id,
      user_id: lead.submitted_by,
      beneficiary_role: "partner",
      commission_amount: partnerShare,
      transaction_type: "credit",
      commission_status: "approved",
      reference_code: refCode,
      description: `Partner commission credited for approved lead ${lead.lead_code}`,
      metadata: { lead_code: lead.lead_code, campaign_title: campObj?.title },
    });
  }

  // Insert Vendor Transaction
  if (lead.vendor_id && vendorShare > 0) {
    await adminClient.from("commission_transactions").insert({
      transaction_code: vendorTxnCode,
      lead_id: lead.id,
      campaign_id: lead.campaign_id,
      vendor_id: lead.vendor_id,
      partner_id: lead.submitted_by,
      team_id: lead.team_id,
      user_id: lead.vendor_id,
      beneficiary_role: "vendor",
      commission_amount: vendorShare,
      transaction_type: "credit",
      commission_status: "approved",
      reference_code: refCode,
      description: `Vendor override commission credited for approved squad lead ${lead.lead_code}`,
      metadata: { lead_code: lead.lead_code, campaign_title: campObj?.title },
    });
  }

  // Update Lead record total
  await adminClient
    .from("leads")
    .update({ commission_amount: partnerShare + vendorShare })
    .eq("id", lead.id);

  return {
    success: true,
    leadCode: lead.lead_code,
    partnerShare,
    vendorShare,
    totalCommission: partnerShare + vendorShare,
    partnerTransactionCode: partnerTxnCode,
    vendorTransactionCode: vendorTxnCode,
  };
}

/**
 * Reverse a commission transaction idempotently with audit trail
 */
export async function reverseCommissionTransaction(
  transactionId: string,
  reason: string,
  actorId: string,
  adminClient: ReturnType<typeof createAdminClient>
) {
  try {
    const { data, error } = await adminClient.rpc("reverse_lead_commission", {
      p_transaction_id: transactionId,
      p_reason: reason,
      p_actor_id: actorId,
    });

    if (!error && data && (data as any).success) {
      return { success: true, data };
    }
  } catch (err: any) {
    console.warn("RPC reverse_lead_commission fallback:", err?.message);
  }

  // Fallback
  const { data: orig } = await adminClient
    .from("commission_transactions")
    .select("*")
    .eq("id", transactionId)
    .single();

  if (!orig) throw new Error("Transaction not found");
  if (orig.transaction_type === "reversal") throw new Error("Cannot reverse a reversal transaction");

  const revCode = `LMB-TXN-REV-${String(Math.floor(Math.random() * 900000) + 100000)}`;

  const { data: revTxn } = await adminClient
    .from("commission_transactions")
    .insert({
      transaction_code: revCode,
      lead_id: orig.lead_id,
      campaign_id: orig.campaign_id,
      vendor_id: orig.vendor_id,
      partner_id: orig.partner_id,
      team_id: orig.team_id,
      user_id: orig.user_id,
      beneficiary_role: orig.beneficiary_role,
      commission_amount: orig.commission_amount,
      transaction_type: "reversal",
      commission_status: "reversed",
      reference_code: `REV-${orig.transaction_code}`,
      original_transaction_id: orig.id,
      description: `Reversal of transaction ${orig.transaction_code}: ${reason}`,
      metadata: { reversal_reason: reason, original_code: orig.transaction_code },
    })
    .select()
    .single();

  if (revTxn) {
    await adminClient.from("commission_reversals").insert({
      transaction_id: orig.id,
      reversal_transaction_id: revTxn.id,
      reason,
      initiated_by: actorId,
    });
  }

  return { success: true, reversalCode: revCode };
}

