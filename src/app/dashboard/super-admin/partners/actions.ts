"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getAdminOrSessionClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";

/**
 * Generate unique sequential server-side Partner ID (e.g. LMB-PAR-000001)
 */
async function getNextPartnerIdCode(db: any): Promise<string> {
  try {
    const { data, error } = await db.rpc("generate_partner_id");
    if (!error && data && typeof data === "string") {
      return data;
    }
  } catch {
    // Fallback if RPC is not deployed in active connection
  }

  // Safe fallback sequence generator
  const { data: latestPartner } = await db
    .from("profiles")
    .select("partner_id_code")
    .not("partner_id_code", "is", null)
    .order("partner_id_code", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (latestPartner?.partner_id_code) {
    const match = latestPartner.partner_id_code.match(/LMB-PAR-(\d+)/);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `LMB-PAR-${String(nextNum).padStart(6, "0")}`;
}

export async function approvePartnerAction(partnerUserId: string) {
  const currentUser = await requireRole(["super_admin", "admin"]);
  if (!currentUser.roles.includes("super_admin") && !hasPermission(currentUser, "manage_partners")) {
    throw new Error("Unauthorized: You do not possess permission to approve partner applications.");
  }

  const db = await getAdminOrSessionClient();

  const { data: profile, error: fetchErr } = await db
    .from("profiles")
    .select("id, email, full_name, status, partner_id_code")
    .eq("id", partnerUserId)
    .single();

  if (fetchErr || !profile) {
    throw new Error("Partner profile not found");
  }

  let partnerIdCode = profile.partner_id_code;
  if (!partnerIdCode) {
    partnerIdCode = await getNextPartnerIdCode(db);
  }

  const { error: updateErr } = await db
    .from("profiles")
    .update({
      partner_id_code: partnerIdCode,
      status: "active",
      rejection_reason: null,
      suspension_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerUserId);

  if (updateErr) {
    throw new Error(`Failed to approve partner: ${updateErr.message}`);
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "PARTNER_APPROVED",
    entityType: "profiles",
    entityId: partnerUserId,
    details: {
      partnerUserId,
      partnerIdCode,
      approvedBy: currentUser.id,
      workflow: "DOCUMENT_GENERATION_TRIGGERED",
      documentType: "PARTNER_AGREEMENT_KIT",
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/dashboard/super-admin/partners");
  revalidatePath("/dashboard/super-admin/approvals");
  revalidatePath("/dashboard/admin/partners");
  return { success: true, partnerIdCode };
}

export async function rejectPartnerAction(partnerUserId: string, reason: string) {
  const currentUser = await requireRole(["super_admin", "admin"]);
  if (!currentUser.roles.includes("super_admin") && !hasPermission(currentUser, "manage_partners")) {
    throw new Error("Unauthorized: You do not possess permission to reject partner applications.");
  }

  const db = await getAdminOrSessionClient();

  if (!reason || reason.trim().length === 0) {
    throw new Error("A rejection reason is required.");
  }

  const { error } = await db
    .from("profiles")
    .update({
      status: "rejected",
      rejection_reason: reason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerUserId);

  if (error) {
    throw new Error(`Failed to reject partner: ${error.message}`);
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "PARTNER_REJECTED",
    entityType: "profiles",
    entityId: partnerUserId,
    details: {
      partnerUserId,
      reason: reason.trim(),
      rejectedBy: currentUser.id,
    },
  });

  revalidatePath("/dashboard/super-admin/partners");
  revalidatePath("/dashboard/super-admin/approvals");
  revalidatePath("/dashboard/admin/partners");
  return { success: true };
}

export async function requestPartnerCorrectionAction(partnerUserId: string, notes: string) {
  const currentUser = await requireRole(["super_admin", "admin"]);
  if (!currentUser.roles.includes("super_admin") && !hasPermission(currentUser, "manage_partners")) {
    throw new Error("Unauthorized: You do not possess permission to request corrections.");
  }

  const db = await getAdminOrSessionClient();

  if (!notes || notes.trim().length === 0) {
    throw new Error("Correction instructions are required.");
  }

  const { error } = await db
    .from("profiles")
    .update({
      rejection_reason: `[CORRECTION_REQUESTED]: ${notes.trim()}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerUserId);

  if (error) {
    throw new Error(`Failed to record correction request: ${error.message}`);
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "PARTNER_CORRECTION_REQUESTED",
    entityType: "profiles",
    entityId: partnerUserId,
    details: {
      partnerUserId,
      notes: notes.trim(),
      requestedBy: currentUser.id,
    },
  });

  revalidatePath("/dashboard/super-admin/partners");
  revalidatePath("/dashboard/super-admin/approvals");
  revalidatePath("/dashboard/admin/partners");
  return { success: true };
}

export async function suspendPartnerAction(partnerUserId: string, reason: string) {
  const currentUser = await requireRole(["super_admin", "admin"]);
  if (!currentUser.roles.includes("super_admin") && !hasPermission(currentUser, "manage_partners")) {
    throw new Error("Unauthorized: You do not possess permission to suspend partners.");
  }

  const db = await getAdminOrSessionClient();

  if (!reason || reason.trim().length === 0) {
    throw new Error("A suspension reason is required.");
  }

  const { error } = await db
    .from("profiles")
    .update({
      status: "suspended",
      suspension_reason: reason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerUserId);

  if (error) {
    throw new Error(`Failed to suspend partner: ${error.message}`);
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "PARTNER_SUSPENDED",
    entityType: "profiles",
    entityId: partnerUserId,
    details: {
      partnerUserId,
      reason: reason.trim(),
      suspendedBy: currentUser.id,
    },
  });

  revalidatePath("/dashboard/super-admin/partners");
  revalidatePath("/dashboard/admin/partners");
  return { success: true };
}

export async function deactivatePartnerAction(partnerUserId: string) {
  const currentUser = await requireRole(["super_admin", "admin"]);
  if (!currentUser.roles.includes("super_admin") && !hasPermission(currentUser, "manage_partners")) {
    throw new Error("Unauthorized: You do not possess permission to deactivate partners.");
  }

  const db = await getAdminOrSessionClient();

  const { error } = await db
    .from("profiles")
    .update({
      status: "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerUserId);

  if (error) {
    throw new Error(`Failed to deactivate partner: ${error.message}`);
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "PARTNER_DEACTIVATED",
    entityType: "profiles",
    entityId: partnerUserId,
    details: {
      partnerUserId,
      deactivatedBy: currentUser.id,
    },
  });

  revalidatePath("/dashboard/super-admin/partners");
  revalidatePath("/dashboard/admin/partners");
  return { success: true };
}
