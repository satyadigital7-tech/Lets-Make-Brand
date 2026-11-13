"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";
import {
  campaignCreateSchema,
  CampaignCreateFormData,
  campaignAssignmentSchema,
  CampaignAssignmentFormData,
} from "@/lib/security/validation";
import { createNotification } from "@/lib/services/notifications";

/**
 * Generate unique server-side Campaign ID (e.g. LMB-CMP-000001)
 */
async function getNextCampaignCode(adminClient: ReturnType<typeof createAdminClient>): Promise<string> {
  try {
    const { data, error } = await adminClient.rpc("generate_campaign_code");
    if (!error && data && typeof data === "string") {
      return data;
    }
  } catch {
    // Fallback if RPC is not yet registered
  }

  const { data: latestCamp } = await adminClient
    .from("campaigns")
    .select("campaign_code")
    .not("campaign_code", "is", null)
    .order("campaign_code", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (latestCamp?.campaign_code) {
    const match = latestCamp.campaign_code.match(/LMB-CMP-(\d+)/);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `LMB-CMP-${String(nextNum).padStart(6, "0")}`;
}

export async function createCampaignAction(formData: CampaignCreateFormData) {
  const superAdmin = await requireRole(["super_admin", "admin"]);
  const validated = campaignCreateSchema.parse(formData);
  const adminClient = createAdminClient();

  const campaignCode = await getNextCampaignCode(adminClient);

  // Generate unique slug
  const baseSlug = validated.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  const commissionAmount = validated.commissionAmount || validated.commissionRate || 0;

  const { data: newCampaign, error } = await adminClient
    .from("campaigns")
    .insert({
      campaign_code: campaignCode,
      title: validated.title,
      brand_name: validated.brandName || "LMB Enterprise Client",
      slug,
      vendor_id: null,
      category: validated.category,
      description: validated.description,
      instructions: validated.instructions || null,
      eligibility: validated.eligibility || null,
      banner_image_url: validated.bannerImageUrl || null,
      target_audience: validated.targetAudience || null,
      commission_rate: validated.commissionRate,
      commission_amount: commissionAmount,
      max_payout: validated.maxPayout || null,
      commission_type: validated.commissionType,
      budget: validated.budget,
      start_date: validated.startDate || new Date().toISOString(),
      end_date: validated.endDate || null,
      status: validated.status,
      required_documents: validated.requiredDocuments,
      dynamic_fields: validated.dynamicFields,
    })
    .select()
    .single();

  if (error || !newCampaign) {
    throw new Error(`Failed to create campaign: ${error?.message || "Database error"}`);
  }

  await logAuditEvent({
    userId: superAdmin.id,
    action: "CAMPAIGN_CREATED",
    entityType: "campaigns",
    entityId: newCampaign.id,
    details: {
      campaignCode: newCampaign.campaign_code,
      title: validated.title,
      commissionAmount,
      status: validated.status,
    },
  });

  revalidatePath("/dashboard/super-admin/campaigns");
  revalidatePath("/dashboard/partner/campaigns");
  revalidatePath("/campaigns");
  return { success: true, campaign: newCampaign };
}

export async function updateCampaignAction(
  campaignId: string,
  formData: Partial<CampaignCreateFormData>
) {
  const superAdmin = await requireRole(["super_admin", "admin"]);
  const adminClient = createAdminClient();

  const { data: existing, error: fetchErr } = await adminClient
    .from("campaigns")
    .select("id, status, title")
    .eq("id", campaignId)
    .single();

  if (fetchErr || !existing) {
    throw new Error("Campaign not found");
  }

  const updatePayload: Record<string, any> = {};
  if (formData.title) updatePayload.title = formData.title;
  if (formData.brandName) updatePayload.brand_name = formData.brandName;
  if (formData.category) updatePayload.category = formData.category;
  if (formData.description) updatePayload.description = formData.description;
  if (formData.instructions !== undefined) updatePayload.instructions = formData.instructions;
  if (formData.eligibility !== undefined) updatePayload.eligibility = formData.eligibility;
  if (formData.bannerImageUrl !== undefined) updatePayload.banner_image_url = formData.bannerImageUrl;
  if (formData.commissionRate !== undefined) updatePayload.commission_rate = formData.commissionRate;
  if (formData.commissionAmount !== undefined) updatePayload.commission_amount = formData.commissionAmount;
  if (formData.maxPayout !== undefined) updatePayload.max_payout = formData.maxPayout;
  if (formData.budget !== undefined) updatePayload.budget = formData.budget;
  if (formData.startDate !== undefined) updatePayload.start_date = formData.startDate || null;
  if (formData.endDate !== undefined) updatePayload.end_date = formData.endDate || null;
  if (formData.status) updatePayload.status = formData.status;
  if (formData.requiredDocuments) updatePayload.required_documents = formData.requiredDocuments;
  if (formData.dynamicFields) updatePayload.dynamic_fields = formData.dynamicFields;
  updatePayload.updated_at = new Date().toISOString();

  const { error: updateErr } = await adminClient
    .from("campaigns")
    .update(updatePayload)
    .eq("id", campaignId);

  if (updateErr) {
    throw new Error(`Failed to update campaign: ${updateErr.message}`);
  }

  // If campaign status changed to 'active', send notification event
  if (formData.status === "active" && existing.status !== "active") {
    // Notify all active partners
    const { data: activePartners } = await adminClient
      .from("profiles")
      .select("id")
      .eq("status", "active")
      .limit(200);

    if (activePartners) {
      for (const p of activePartners) {
        await createNotification({
          userId: p.id,
          title: "New Campaign Published!",
          message: `Campaign "${existing.title}" is now active and ready for promotion.`,
          type: "campaign_published",
          entityType: "campaign",
          entityId: campaignId,
        });
      }
    }
  }

  await logAuditEvent({
    userId: superAdmin.id,
    action: "CAMPAIGN_UPDATED",
    entityType: "campaigns",
    entityId: campaignId,
    details: { changes: updatePayload },
  });

  revalidatePath("/dashboard/super-admin/campaigns");
  revalidatePath("/dashboard/partner/campaigns");
  revalidatePath("/campaigns");
  return { success: true };
}

export async function setCampaignStatusAction(
  campaignId: string,
  newStatus: "draft" | "active" | "paused" | "completed" | "archived"
) {
  const superAdmin = await requireRole(["super_admin", "admin"]);
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("campaigns")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", campaignId);

  if (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }

  await logAuditEvent({
    userId: superAdmin.id,
    action: "CAMPAIGN_STATUS_UPDATED",
    entityType: "campaigns",
    entityId: campaignId,
    details: { newStatus },
  });

  revalidatePath("/dashboard/super-admin/campaigns");
  revalidatePath("/dashboard/partner/campaigns");
  revalidatePath("/campaigns");
  return { success: true };
}

// MODULE 2: CAMPAIGN ASSIGNMENT ACTIONS
export async function assignCampaignAction(data: CampaignAssignmentFormData) {
  const superAdmin = await requireRole(["super_admin", "admin"]);
  const validated = campaignAssignmentSchema.parse(data);
  const adminClient = createAdminClient();

  const payload: Record<string, any> = {
    campaign_id: validated.campaignId,
    assigned_type: validated.assignedType,
    created_by: superAdmin.id,
  };

  let notifyUserId: string | null = null;

  if (validated.assignedType === "partner") {
    if (!validated.targetId) throw new Error("Partner target ID is required");
    payload.partner_id = validated.targetId;
    notifyUserId = validated.targetId;
  } else if (validated.assignedType === "vendor") {
    if (!validated.targetId) throw new Error("Vendor target ID is required");
    payload.vendor_id = validated.targetId;
    notifyUserId = validated.targetId;
  } else if (validated.assignedType === "team") {
    if (!validated.targetId) throw new Error("Team target ID is required");
    payload.team_id = validated.targetId;

    // Find team leader or members to notify
    const { data: team } = await adminClient
      .from("teams")
      .select("leader_id, vendor_id")
      .eq("id", validated.targetId)
      .single();

    if (team?.leader_id) notifyUserId = team.leader_id;
  } else if (validated.assignedType === "team_member") {
    if (!validated.targetId) throw new Error("Team Member target ID is required");
    payload.team_member_id = validated.targetId;
    notifyUserId = validated.targetId;
  }

  const { data: assignment, error } = await adminClient
    .from("campaign_assignments")
    .insert(payload)
    .select()
    .single();

  if (error || !assignment) {
    throw new Error(`Failed to assign campaign: ${error?.message || "Database error"}`);
  }

  // Send notification event
  if (notifyUserId) {
    await createNotification({
      userId: notifyUserId,
      title: "Exclusive Campaign Assigned",
      message: "A new promotional campaign has been assigned to your organization/squad.",
      type: "campaign_assignment",
      entityType: "campaign",
      entityId: validated.campaignId,
    });
  }

  await logAuditEvent({
    userId: superAdmin.id,
    action: "CAMPAIGN_ASSIGNED",
    entityType: "campaign_assignments",
    entityId: assignment.id,
    details: payload,
  });

  revalidatePath("/dashboard/super-admin/campaigns");
  revalidatePath("/dashboard/partner/campaigns");
  return { success: true, assignmentId: assignment.id };
}

export async function removeCampaignAssignmentAction(assignmentId: string) {
  const superAdmin = await requireRole(["super_admin", "admin"]);
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("campaign_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) {
    throw new Error(`Failed to remove assignment: ${error.message}`);
  }

  await logAuditEvent({
    userId: superAdmin.id,
    action: "CAMPAIGN_ASSIGNMENT_REMOVED",
    entityType: "campaign_assignments",
    entityId: assignmentId,
  });

  revalidatePath("/dashboard/super-admin/campaigns");
  revalidatePath("/dashboard/partner/campaigns");
  return { success: true };
}
