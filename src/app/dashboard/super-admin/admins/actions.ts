"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";

export async function toggleAdminPermissionAction({
  adminUserId,
  permissionCode,
  isGranted,
}: {
  adminUserId: string;
  permissionCode: string;
  isGranted: boolean;
}) {
  const currentSuperAdmin = await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // Find permission ID from code
  const { data: permission } = await adminClient
    .from("permissions")
    .select("id, name")
    .eq("code", permissionCode)
    .single();

  if (!permission) {
    throw new Error(`Permission ${permissionCode} not found`);
  }

  // Upsert into user_permissions table
  const { error } = await adminClient
    .from("user_permissions")
    .upsert(
      {
        user_id: adminUserId,
        permission_id: permission.id,
        is_granted: isGranted,
        assigned_by: currentSuperAdmin.id,
      },
      { onConflict: "user_id, permission_id" }
    );

  if (error) {
    throw new Error(`Failed to update permission: ${error.message}`);
  }

  // Record in audit log
  await logAuditEvent({
    userId: currentSuperAdmin.id,
    action: isGranted ? "ADMIN_PERMISSION_GRANTED" : "ADMIN_PERMISSION_REVOKED",
    entityType: "user_permissions",
    entityId: adminUserId,
    details: {
      targetUserId: adminUserId,
      permissionCode,
      isGranted,
    },
  });

  revalidatePath("/dashboard/super-admin/admins");
  return { success: true };
}

export async function updateAdminStatusAction({
  adminUserId,
  status,
}: {
  adminUserId: string;
  status: "active" | "suspended" | "inactive";
}) {
  const currentSuperAdmin = await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("profiles")
    .update({ status })
    .eq("id", adminUserId);

  if (error) {
    throw new Error(`Failed to update admin status: ${error.message}`);
  }

  await logAuditEvent({
    userId: currentSuperAdmin.id,
    action: "ADMIN_STATUS_UPDATED",
    entityType: "profiles",
    entityId: adminUserId,
    details: {
      targetUserId: adminUserId,
      newStatus: status,
    },
  });

  revalidatePath("/dashboard/super-admin/admins");
  return { success: true };
}

