"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";
import { campaignCreateSchema, CampaignCreateFormData } from "@/lib/security/validation";

export async function createCampaignAction(formData: CampaignCreateFormData) {
  const user = await requireAuth();

  // Validate with Zod
  const validated = campaignCreateSchema.parse(formData);

  const adminClient = createAdminClient();

  // Create unique slug
  const baseSlug = validated.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

  const { data: newCampaign, error } = await adminClient
    .from("campaigns")
    .insert({
      title: validated.title,
      slug,
      vendor_id: user.id,
      category: validated.category,
      description: validated.description,
      target_audience: validated.targetAudience || null,
      commission_rate: validated.commissionRate,
      commission_type: validated.commissionType,
      budget: validated.budget,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create campaign: ${error.message}`);
  }

  // Audit log
  await logAuditEvent({
    userId: user.id,
    action: "CAMPAIGN_CREATED",
    entityType: "campaigns",
    entityId: newCampaign.id,
    details: {
      title: validated.title,
      category: validated.category,
      commissionRate: validated.commissionRate,
    },
  });

  revalidatePath("/dashboard/super-admin/campaigns");
  revalidatePath("/campaigns");
  return { success: true, campaign: newCampaign };
}

export async function toggleCampaignStatusAction(campaignId: string, newStatus: "active" | "paused") {
  const user = await requireAuth();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("campaigns")
    .update({ status: newStatus })
    .eq("id", campaignId);

  if (error) {
    throw new Error(`Failed to update campaign status: ${error.message}`);
  }

  await logAuditEvent({
    userId: user.id,
    action: "CAMPAIGN_STATUS_UPDATED",
    entityType: "campaigns",
    entityId: campaignId,
    details: { newStatus },
  });

  revalidatePath("/dashboard/super-admin/campaigns");
  revalidatePath("/campaigns");
  return { success: true };
}

