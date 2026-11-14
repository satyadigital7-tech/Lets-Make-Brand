"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getAdminOrSessionClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";

/**
 * Generate unique sequential server-side Vendor ID (e.g. LMB-VEN-000001)
 */
async function getNextVendorIdCode(db: any): Promise<string> {
  try {
    const { data, error } = await db.rpc("generate_vendor_id");
    if (!error && data && typeof data === "string") {
      return data;
    }
  } catch {
    // Fallback if RPC is not deployed in active connection
  }

  // Safe fallback sequence generator
  const { data: latestVendor } = await db
    .from("profiles")
    .select("vendor_id_code")
    .not("vendor_id_code", "is", null)
    .order("vendor_id_code", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (latestVendor?.vendor_id_code) {
    const match = latestVendor.vendor_id_code.match(/LMB-VEN-(\d+)/);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `LMB-VEN-${String(nextNum).padStart(6, "0")}`;
}

export async function approveVendorAction(vendorUserId: string) {
  const currentUser = await requireRole(["super_admin", "admin"]);
  if (!currentUser.roles.includes("super_admin") && !hasPermission(currentUser, "manage_vendors")) {
    throw new Error("Unauthorized: You do not possess permission to approve vendor applications.");
  }

  const db = await getAdminOrSessionClient();

  // Check current profile
  const { data: profile, error: fetchErr } = await db
    .from("profiles")
    .select("id, email, full_name, status, vendor_id_code")
    .eq("id", vendorUserId)
    .single();

  if (fetchErr || !profile) {
    throw new Error("Vendor profile not found");
  }

  // If already has vendor_id_code, keep it, otherwise generate a new one
  let vendorIdCode = profile.vendor_id_code;
  if (!vendorIdCode) {
    vendorIdCode = await getNextVendorIdCode(db);
  }

  const { error: updateErr } = await db
    .from("profiles")
    .update({
      vendor_id_code: vendorIdCode,
      status: "active",
      rejection_reason: null,
      suspension_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorUserId);

  if (updateErr) {
    throw new Error(`Failed to approve vendor: ${updateErr.message}`);
  }

  // Record audit log
  await logAuditEvent({
    userId: currentUser.id,
    action: "VENDOR_APPROVED",
    entityType: "profiles",
    entityId: vendorUserId,
    details: {
      vendorUserId,
      vendorIdCode,
      approvedBy: currentUser.id,
      workflow: "DOCUMENT_GENERATION_TRIGGERED",
      documentType: "VENDOR_ONBOARDING_KIT",
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/dashboard/super-admin/vendors");
  revalidatePath("/dashboard/super-admin/approvals");
  revalidatePath("/dashboard/admin/vendors");
  return { success: true, vendorIdCode };
}

export async function rejectVendorAction(vendorUserId: string, reason: string) {
  const currentUser = await requireRole(["super_admin", "admin"]);
  if (!currentUser.roles.includes("super_admin") && !hasPermission(currentUser, "manage_vendors")) {
    throw new Error("Unauthorized: You do not possess permission to reject vendor applications.");
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
    .eq("id", vendorUserId);

  if (error) {
    throw new Error(`Failed to reject vendor: ${error.message}`);
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "VENDOR_REJECTED",
    entityType: "profiles",
    entityId: vendorUserId,
    details: {
      vendorUserId,
      reason: reason.trim(),
      rejectedBy: currentUser.id,
    },
  });

  revalidatePath("/dashboard/super-admin/vendors");
  revalidatePath("/dashboard/super-admin/approvals");
  revalidatePath("/dashboard/admin/vendors");
  return { success: true };
}

export async function requestVendorCorrectionAction(vendorUserId: string, notes: string) {
  const currentUser = await requireRole(["super_admin", "admin"]);
  if (!currentUser.roles.includes("super_admin") && !hasPermission(currentUser, "manage_vendors")) {
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
    .eq("id", vendorUserId);

  if (error) {
    throw new Error(`Failed to record correction request: ${error.message}`);
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "VENDOR_CORRECTION_REQUESTED",
    entityType: "profiles",
    entityId: vendorUserId,
    details: {
      vendorUserId,
      notes: notes.trim(),
      requestedBy: currentUser.id,
    },
  });

  revalidatePath("/dashboard/super-admin/vendors");
  revalidatePath("/dashboard/super-admin/approvals");
  revalidatePath("/dashboard/admin/vendors");
  return { success: true };
}

export async function suspendVendorAction(vendorUserId: string, reason: string) {
  const currentUser = await requireRole(["super_admin", "admin"]);
  if (!currentUser.roles.includes("super_admin") && !hasPermission(currentUser, "manage_vendors")) {
    throw new Error("Unauthorized: You do not possess permission to suspend vendors.");
  }

  const db = await getAdminOrSessionClient();

  if (!reason || reason.trim().length === 0) {
    throw new Error("A suspension reason is required.");
  }

  // LIFECYCLE RULE (Module 9):
  // Suspend ONLY the vendor account. Do NOT suspend team leaders or team members!
  const { error } = await db
    .from("profiles")
    .update({
      status: "suspended",
      suspension_reason: reason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorUserId);

  if (error) {
    throw new Error(`Failed to suspend vendor: ${error.message}`);
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "VENDOR_SUSPENDED",
    entityType: "profiles",
    entityId: vendorUserId,
    details: {
      vendorUserId,
      reason: reason.trim(),
      suspendedBy: currentUser.id,
      lifecyclePolicy: "TEAM_MEMBERS_PRESERVED_AS_PER_MODULE_9",
    },
  });

  revalidatePath("/dashboard/super-admin/vendors");
  revalidatePath("/dashboard/admin/vendors");
  return { success: true };
}

export async function deactivateVendorAction(vendorUserId: string) {
  const currentUser = await requireRole(["super_admin", "admin"]);
  if (!currentUser.roles.includes("super_admin") && !hasPermission(currentUser, "manage_vendors")) {
    throw new Error("Unauthorized: You do not possess permission to deactivate vendors.");
  }

  const db = await getAdminOrSessionClient();

  const { error } = await db
    .from("profiles")
    .update({
      status: "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorUserId);

  if (error) {
    throw new Error(`Failed to deactivate vendor: ${error.message}`);
  }

  await logAuditEvent({
    userId: currentUser.id,
    action: "VENDOR_DEACTIVATED",
    entityType: "profiles",
    entityId: vendorUserId,
    details: {
      vendorUserId,
      deactivatedBy: currentUser.id,
    },
  });

  revalidatePath("/dashboard/super-admin/vendors");
  revalidatePath("/dashboard/admin/vendors");
  return { success: true };
}
