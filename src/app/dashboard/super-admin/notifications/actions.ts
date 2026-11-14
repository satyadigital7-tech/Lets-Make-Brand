"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) {
    throw new Error(`Failed to update notification: ${error.message}`);
  }

  revalidatePath("/dashboard/super-admin/notifications");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const user = await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) {
    throw new Error(`Failed to mark all as read: ${error.message}`);
  }

  await logAuditEvent({
    userId: user.id,
    action: "notifications_marked_all_read",
    entityType: "notifications",
  });

  revalidatePath("/dashboard/super-admin/notifications");
  return { success: true };
}

export async function broadcastSystemNotificationAction(formData: {
  title: string;
  message: string;
  type: string;
  targetRole?: string;
}) {
  const user = await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // If targetRole specified, lookup recipient users
  let recipientIds: string[] = [];
  if (formData.targetRole && formData.targetRole !== "all") {
    const { data: userRoles } = await adminClient
      .from("user_roles")
      .select("user_id, roles!inner(code)")
      .eq("roles.code", formData.targetRole);

    recipientIds = (userRoles || []).map((ur: any) => ur.user_id);
  } else {
    const { data: allProfiles } = await adminClient.from("profiles").select("id").limit(500);
    recipientIds = (allProfiles || []).map((p: any) => p.id);
  }

  if (recipientIds.length === 0) {
    recipientIds = [user.id];
  }

  const inserts = recipientIds.map((uid) => ({
    user_id: uid,
    title: formData.title,
    message: formData.message,
    type: formData.type || "system_broadcast",
    is_read: false,
  }));

  const { error } = await adminClient.from("notifications").insert(inserts);

  if (error) {
    throw new Error(`Failed to broadcast notification: ${error.message}`);
  }

  await logAuditEvent({
    userId: user.id,
    action: "system_notification_broadcast",
    entityType: "notifications",
    details: { title: formData.title, recipientCount: recipientIds.length, targetRole: formData.targetRole },
  });

  revalidatePath("/dashboard/super-admin/notifications");
  return { success: true, count: recipientIds.length };
}

