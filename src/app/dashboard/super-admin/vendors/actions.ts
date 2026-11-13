"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";

/**
 * Generate unique server-side Vendor ID (e.g. LMB-VEN-000001)
 */
async function getNextVendorIdCode(adminClient: ReturnType<typeof createAdminClient>): Promise<string> {
  try {
    const { data, error } = await adminClient.rpc("generate_vendor_id");
    if (!error && data && typeof data === "string") {
      return data;
    }
  } catch {
    // Fallback if RPC is not yet applied in active connection
  }

  // Safe fallback sequence generator
  const { data: latestVendor } = await adminClient
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
  const currentSuperAdmin = await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // Check current profile
  const { data: profile, error: fetchErr } = await adminClient
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
    vendorIdCode = await getNextVendorIdCode(adminClient);
  }

  const { error: updateErr } = await adminClient
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

  // Trigger document generation workflow simulation & audit log
  await logAuditEvent({
    userId: currentSuperAdmin.id,
    action: "VENDOR_APPROVED",
    entityType: "profiles",
    entityId: vendorUserId,
    details: {
      vendorUserId,
      vendorIdCode,
      approvedBy: currentSuperAdmin.id,
      workflow: "DOCUMENT_GENERATION_TRIGGERED",
      documentType: "VENDOR_ONBOARDING_KIT",
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/dashboard/super-admin/vendors");
  revalidatePath("/dashboard/super-admin/approvals");
  return { success: true, vendorIdCode };
}

export async function rejectVendorAction(vendorUserId: string, reason: string) {
  const currentSuperAdmin = await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  if (!reason || reason.trim().length === 0) {
    throw new Error("A rejection reason is required.");
  }

  const { error } = await adminClient
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
    userId: currentSuperAdmin.id,
    action: "VENDOR_REJECTED",
    entityType: "profiles",
    entityId: vendorUserId,
    details: {
      vendorUserId,
      reason: reason.trim(),
      rejectedBy: currentSuperAdmin.id,
    },
  });

  revalidatePath("/dashboard/super-admin/vendors");
  revalidatePath("/dashboard/super-admin/approvals");
  return { success: true };
}

export async function suspendVendorAction(vendorUserId: string, reason: string) {
  const currentSuperAdmin = await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  if (!reason || reason.trim().length === 0) {
    throw new Error("A suspension reason is required.");
  }

  // LIFECYCLE RULE (Module 9):
  // Suspend ONLY the vendor account. Do NOT suspend team leaders or team members!
  const { error } = await adminClient
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
    userId: currentSuperAdmin.id,
    action: "VENDOR_SUSPENDED",
    entityType: "profiles",
    entityId: vendorUserId,
    details: {
      vendorUserId,
      reason: reason.trim(),
      suspendedBy: currentSuperAdmin.id,
      lifecyclePolicy: "TEAM_MEMBERS_PRESERVED_AS_PER_MODULE_9",
    },
  });

  revalidatePath("/dashboard/super-admin/vendors");
  return { success: true };
}

export async function deactivateVendorAction(vendorUserId: string) {
  const currentSuperAdmin = await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { error } = await adminClient
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
    userId: currentSuperAdmin.id,
    action: "VENDOR_DEACTIVATED",
    entityType: "profiles",
    entityId: vendorUserId,
    details: {
      vendorUserId,
      deactivatedBy: currentSuperAdmin.id,
    },
  });

  revalidatePath("/dashboard/super-admin/vendors");
  return { success: true };
}

