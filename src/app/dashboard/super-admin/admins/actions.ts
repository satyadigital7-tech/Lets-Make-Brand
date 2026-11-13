"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";
import { createAdminSchema, CreateAdminFormData } from "@/lib/security/validation";

export async function createAdminAction(formData: CreateAdminFormData) {
  const currentSuperAdmin = await requireRole(["super_admin"]);
  const validated = createAdminSchema.parse(formData);

  const adminClient = createAdminClient();

  // 1. Create auth user with confirmed email
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: validated.email,
    password: validated.password,
    email_confirm: true,
    user_metadata: {
      full_name: validated.fullName,
      mobile: validated.mobile || null,
      phone: validated.mobile || null,
      role: "admin",
    },
  });

  if (authError || !authData.user) {
    throw new Error(`Failed to create admin user: ${authError?.message || "Unknown error"}`);
  }

  const newAdminId = authData.user.id;

  // 2. Ensure profile exists and is active
  await adminClient.from("profiles").upsert({
    id: newAdminId,
    email: validated.email,
    full_name: validated.fullName,
    mobile: validated.mobile || null,
    phone: validated.mobile || null,
    status: "active",
  });

  // 3. Assign admin role
  const { data: roleRecord } = await adminClient
    .from("roles")
    .select("id")
    .eq("code", "admin")
    .single();

  if (roleRecord) {
    await adminClient.from("user_roles").upsert(
      {
        user_id: newAdminId,
        role_id: roleRecord.id,
        assigned_by: currentSuperAdmin.id,
      },
      { onConflict: "user_id, role_id" }
    );
  }

  // 4. Handle sensitive permission: can_manage_vendor_transfers
  // CRITICAL REQUIREMENT: Defaults to FALSE. Only assigned if explicitly true!
  const { data: transferPerm } = await adminClient
    .from("permissions")
    .select("id")
    .eq("code", "can_manage_vendor_transfers")
    .single();

  if (transferPerm) {
    await adminClient.from("user_permissions").upsert(
      {
        user_id: newAdminId,
        permission_id: transferPerm.id,
        is_granted: Boolean(validated.canManageVendorTransfers),
        assigned_by: currentSuperAdmin.id,
      },
      { onConflict: "user_id, permission_id" }
    );
  }

  // 5. Log audit event
  await logAuditEvent({
    userId: currentSuperAdmin.id,
    action: "ADMIN_ACCOUNT_CREATED",
    entityType: "profiles",
    entityId: newAdminId,
    details: {
      createdAdminId: newAdminId,
      email: validated.email,
      canManageVendorTransfers: Boolean(validated.canManageVendorTransfers),
    },
  });

  revalidatePath("/dashboard/super-admin/admins");
  return { success: true, adminId: newAdminId };
}

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

  const { data: permission } = await adminClient
    .from("permissions")
    .select("id, name")
    .eq("code", permissionCode)
    .single();

  if (!permission) {
    throw new Error(`Permission ${permissionCode} not found`);
  }

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
