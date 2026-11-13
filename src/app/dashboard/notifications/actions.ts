"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/services/notifications";

/**
 * Mark a single notification as read (Module 4)
 */
export async function markAsReadAction(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");

  const result = await markNotificationAsRead(notificationId, user.id);
  revalidatePath("/dashboard/notifications");
  return result;
}

/**
 * Mark all notifications as read for current user (Module 4)
 */
export async function markAllAsReadAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");

  const result = await markAllNotificationsAsRead(user.id);
  revalidatePath("/dashboard/notifications");
  return result;
}

/**
 * Save user notification preferences (Module 4)
 */
export async function saveNotificationPreferencesAction(prefs: {
  emailAccountUpdates: boolean;
  emailCampaignUpdates: boolean;
  emailLeadUpdates: boolean;
  emailFinancialUpdates: boolean;
  emailSupportUpdates: boolean;
  inappAll: boolean;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");

  const adminClient = createAdminClient();
  await adminClient
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        email_account_updates: prefs.emailAccountUpdates,
        email_campaign_updates: prefs.emailCampaignUpdates,
        email_lead_updates: prefs.emailLeadUpdates,
        email_financial_updates: prefs.emailFinancialUpdates,
        email_support_updates: prefs.emailSupportUpdates,
        inapp_all: prefs.inappAll,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  revalidatePath("/dashboard/notifications");
  return { success: true };
}
