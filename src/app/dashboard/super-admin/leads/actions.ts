"use server";

import { revalidatePath } from "next/cache";
import { requireRole, getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";
import { leadReviewSchema, LeadReviewFormData } from "@/lib/security/validation";
import { createNotification } from "@/lib/services/notifications";
import { processLeadCommission } from "@/lib/services/commission";

export async function reviewLeadAction(data: LeadReviewFormData) {
  const reviewer = await requireRole(["super_admin", "admin"]);
  const validated = leadReviewSchema.parse(data);
  const adminClient = createAdminClient();

  // 1. Fetch current lead
  const { data: lead, error: fetchErr } = await adminClient
    .from("leads")
    .select(`
      id,
      lead_code,
      status,
      customer_name,
      submitted_by,
      campaign_id,
      campaign:campaign_id (title)
    `)
    .eq("id", validated.leadId)
    .single();

  if (fetchErr || !lead) {
    throw new Error("Lead record not found");
  }

  const previousStatus = lead.status;
  let newStatus: "approved" | "rejected" | "correction_requested" | "under_verification";
  let actionName: string;
  let notificationType: "lead_approved" | "lead_rejected" | "correction_requested" | "lead_submitted";
  let notificationTitle: string;
  let notificationMessage: string;

  const campaignTitle = (lead.campaign as any)?.title || "Campaign";

  switch (validated.action) {
    case "approve":
      newStatus = "approved";
      actionName = "APPROVED";
      notificationType = "lead_approved";
      notificationTitle = "Lead Approved!";
      notificationMessage = `Your lead ${lead.lead_code || ""} (${lead.customer_name}) for ${campaignTitle} has been verified and approved.`;
      break;

    case "reject":
      if (!validated.reason || validated.reason.trim().length === 0) {
        throw new Error("A rejection reason is required.");
      }
      newStatus = "rejected";
      actionName = "REJECTED";
      notificationType = "lead_rejected";
      notificationTitle = "Lead Application Rejected";
      notificationMessage = `Lead ${lead.lead_code || ""} (${lead.customer_name}) was rejected. Reason: ${validated.reason}`;
      break;

    case "request_correction":
      if (!validated.reason || validated.reason.trim().length === 0) {
        throw new Error("Correction instructions are required.");
      }
      newStatus = "correction_requested";
      actionName = "CORRECTION_REQUESTED";
      notificationType = "correction_requested";
      notificationTitle = "Correction Requested for Lead";
      notificationMessage = `Action required on lead ${lead.lead_code || ""}: ${validated.reason}`;
      break;

    case "mark_under_verification":
      newStatus = "under_verification";
      actionName = "UNDER_VERIFICATION";
      notificationType = "lead_submitted";
      notificationTitle = "Lead Under Verification";
      notificationMessage = `Lead ${lead.lead_code || ""} is currently under manual compliance verification.`;
      break;

    default:
      throw new Error("Invalid review action specified.");
  }

  // 2. Update Lead Record
  const updatePayload: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === "rejected") {
    updatePayload.rejection_reason = validated.reason?.trim() || null;
  } else if (newStatus === "correction_requested") {
    updatePayload.correction_notes = validated.reason?.trim() || null;
  }

  const { error: updateErr } = await adminClient
    .from("leads")
    .update(updatePayload)
    .eq("id", validated.leadId);

  if (updateErr) {
    throw new Error(`Failed to update lead: ${updateErr.message}`);
  }

  // 3. Record in Immutable Status History (Module 10)
  await adminClient.from("lead_status_history").insert({
    lead_id: validated.leadId,
    actor_id: reviewer.id,
    action: actionName,
    previous_status: previousStatus,
    new_status: newStatus,
    comments: validated.reason?.trim() || `Marked as ${newStatus} by admin`,
  });

  // 4. Notify Submitter (Module 11)
  await createNotification({
    userId: lead.submitted_by,
    title: notificationTitle,
    message: notificationMessage,
    type: notificationType,
    entityType: "lead",
    entityId: lead.id,
  });

  // 5. Automatic Commission Calculation Engine (Phase 4 Module 4 & 5)
  if (newStatus === "approved") {
    try {
      const commResult = await processLeadCommission(lead.id, reviewer.id, adminClient);
      if (commResult.success && !commResult.alreadyProcessed) {
        // Notify partner of credited commission
        if (commResult.partnerShare && commResult.partnerShare > 0) {
          await createNotification({
            userId: lead.submitted_by,
            title: "Commission Accrued!",
            message: `₹${commResult.partnerShare} commission credited for lead ${lead.lead_code}.`,
            type: "commission_credited",
            entityType: "commission_transaction",
            entityId: commResult.partnerTransactionCode || null,
          });
        }
      }
    } catch (commErr: any) {
      console.error("Automatic commission calculation error:", commErr?.message);
    }
  }

  // 6. Audit Log
  await logAuditEvent({
    userId: reviewer.id,
    action: `LEAD_${actionName}`,
    entityType: "leads",
    entityId: lead.id,
    details: {
      leadId: lead.id,
      leadCode: lead.lead_code,
      previousStatus,
      newStatus,
      comments: validated.reason || null,
    },
  });

  revalidatePath("/dashboard/super-admin/leads");
  revalidatePath("/dashboard/partner/leads");
  revalidatePath("/dashboard/vendor/leads");
  revalidatePath("/dashboard/team-leader/leads");
  revalidatePath("/dashboard/super-admin/commission");
  revalidatePath("/dashboard/partner/commission");
  revalidatePath("/dashboard/vendor/commission");

  return { success: true, newStatus };
}

/**
 * Allows a partner to resubmit a lead after fixing requested corrections.
 */
export async function resubmitLeadAction(leadId: string, notes: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required");

  const adminClient = createAdminClient();

  const { data: lead } = await adminClient
    .from("leads")
    .select("id, submitted_by, status, lead_code")
    .eq("id", leadId)
    .single();

  if (!lead || lead.submitted_by !== user.id) {
    throw new Error("Unauthorized: Lead not found or does not belong to you.");
  }

  if (lead.status !== "correction_requested") {
    throw new Error("Only leads with 'correction_requested' status can be resubmitted.");
  }

  await adminClient
    .from("leads")
    .update({
      status: "pending",
      correction_notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  // Record in History
  await adminClient.from("lead_status_history").insert({
    lead_id: leadId,
    actor_id: user.id,
    action: "RESUBMITTED",
    previous_status: "correction_requested",
    new_status: "pending",
    comments: notes || "Resubmitted with requested corrections",
  });

  revalidatePath("/dashboard/partner/leads");
  revalidatePath("/dashboard/super-admin/leads");
  return { success: true };
}

