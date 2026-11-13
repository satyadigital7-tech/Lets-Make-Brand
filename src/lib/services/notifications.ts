import { createAdminClient } from "@/lib/supabase/admin";
import { NotificationType } from "@/lib/types/database.types";

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  entityType?: "campaign" | "lead" | "commission_transaction" | string;
  entityId?: string | null;
}

export async function createNotification(payload: NotificationPayload) {
  try {
    const adminClient = createAdminClient();
    await adminClient.from("notifications").insert({
      user_id: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      entity_type: payload.entityType || null,
      entity_id: payload.entityId || null,
      is_read: false,
    });
  } catch (error) {
    console.error("Failed to persist notification:", error);
  }
}

