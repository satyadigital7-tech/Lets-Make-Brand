"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";
import { vendorSplitSchema, VendorSplitFormData } from "@/lib/security/validation";

/**
 * Vendor saves or adjusts commission split for a campaign (Module 2)
 */
export async function saveVendorSplitAction(data: VendorSplitFormData) {
  const user = await requireRole(["vendor", "super_admin"]);
  const validated = vendorSplitSchema.parse(data);
  const adminClient = createAdminClient();

  // 1. Fetch Super Admin Campaign Limit (Module 2)
  const { data: rule } = await adminClient
    .from("commission_rules")
    .select("max_commission_amount, campaign:campaign_id (title, commission_amount, commission_rate)")
    .eq("campaign_id", validated.campaignId)
    .maybeSingle();

  const campObj = Array.isArray(rule?.campaign) ? rule?.campaign[0] : rule?.campaign;
  const maxCap = Number(rule?.max_commission_amount ?? (campObj?.commission_amount || campObj?.commission_rate || 500));

  const totalSplit = validated.vendorShare + validated.partnerShare;

  // CRITICAL VALIDATION (Module 2):
  // The total distribution must NEVER exceed the Super Admin campaign limit
  if (totalSplit > maxCap) {
    throw new Error(
      `Compliance Violation: Total commission split (₹${totalSplit}) exceeds the Super Admin campaign limit of ₹${maxCap}.`
    );
  }

  // 2. Fetch existing active split for versioning
  const { data: existingSplit } = await adminClient
    .from("vendor_commission_splits")
    .select("id, version")
    .eq("vendor_id", user.id)
    .eq("campaign_id", validated.campaignId)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = existingSplit ? existingSplit.version + 1 : 1;

  // 3. Mark existing split as inactive (preserves historical record)
  if (existingSplit) {
    await adminClient
      .from("vendor_commission_splits")
      .update({ is_active: false })
      .eq("id", existingSplit.id);
  }

  // 4. Insert new versioned split
  const { data: newSplit, error: insErr } = await adminClient
    .from("vendor_commission_splits")
    .insert({
      vendor_id: user.id,
      campaign_id: validated.campaignId,
      vendor_share: validated.vendorShare,
      partner_share: validated.partnerShare,
      version: nextVersion,
      is_active: true,
      notes: validated.notes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (insErr || !newSplit) {
    throw new Error(`Failed to save commission split: ${insErr?.message || "Database error"}`);
  }

  // 5. Audit Log
  await logAuditEvent({
    userId: user.id,
    action: "SAVE_VENDOR_COMMISSION_SPLIT",
    entityType: "vendor_commission_splits",
    entityId: newSplit.id,
    details: {
      vendorId: user.id,
      campaignId: validated.campaignId,
      vendorShare: validated.vendorShare,
      partnerShare: validated.partnerShare,
      totalSplit,
      maxCap,
      version: nextVersion,
    },
  });

  revalidatePath("/dashboard/vendor/commission");
  revalidatePath("/dashboard/vendor/team-performance");
  revalidatePath("/dashboard/super-admin/commission");

  return { success: true, splitId: newSplit.id, version: nextVersion };
}

