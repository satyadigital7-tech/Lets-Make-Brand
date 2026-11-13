import { createAdminClient } from "@/lib/supabase/admin";
import { NotificationType } from "@/lib/types/database.types";

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category?: "account" | "campaign" | "lead" | "financial" | "support" | "system";
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
}

/**
 * Persist an in-app notification and optionally trigger email delivery (Module 4)
 */
export async function createNotification(payload: NotificationPayload) {
  try {
    const adminClient = createAdminClient();

    // 1. Persist In-App Notification
    await adminClient.from("notifications").insert({
      user_id: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      category: payload.category || "system",
      entity_type: payload.entityType || null,
      entity_id: payload.entityId || null,
      action_url: payload.actionUrl || null,
      is_read: false,
    });

    // 2. Trigger asynchronous server-side email dispatch
    await sendEmailNotification({
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      category: payload.category || "system",
    });
  } catch (error) {
    console.error("Failed to persist notification:", error);
  }
}

/**
 * Mark a single notification as read (Module 4)
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  const adminClient = createAdminClient();
  await adminClient
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", userId);
  return { success: true };
}

/**
 * Mark all notifications as read for a user (Module 4)
 */
export async function markAllNotificationsAsRead(userId: string) {
  const adminClient = createAdminClient();
  await adminClient
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false);
  return { success: true };
}

/**
 * Fetch unread notification count for badge rendering (Module 4)
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const adminClient = createAdminClient();
    const { count, error } = await adminClient
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Server-side email notification dispatcher (Module 4 & 8)
 * Respects user preferences and never exposes credentials to frontend code.
 */
export async function sendEmailNotification({
  userId,
  title,
  message,
  type,
  category,
}: {
  userId: string;
  title: string;
  message: string;
  type: string;
  category: string;
}) {
  try {
    const adminClient = createAdminClient();

    // Check user notification preferences
    const { data: prefs } = await adminClient
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (prefs) {
      if (category === "account" && !prefs.email_account_updates) return;
      if (category === "campaign" && !prefs.email_campaign_updates) return;
      if (category === "lead" && !prefs.email_lead_updates) return;
      if (category === "financial" && !prefs.email_financial_updates) return;
      if (category === "support" && !prefs.email_support_updates) return;
    }

    // Retrieve recipient email
    const { data: profile } = await adminClient
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (!profile?.email) return;

    // Check for configured email provider environment variables (e.g. RESEND_API_KEY)
    const emailApiKey = process.env.RESEND_API_KEY;
    if (emailApiKey) {
      // In production with Resend or SMTP configured
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${emailApiKey}`,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "notifications@letsmakebrand.com",
            to: profile.email,
            subject: `[LMB] ${title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="background-color: #0f172a; padding: 12px 20px; border-radius: 6px; color: #ffffff; font-weight: bold; font-size: 16px;">
                  Lets Make Brand
                </div>
                <h2 style="color: #1e293b; margin-top: 20px;">${title}</h2>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">${message}</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="color: #94a3b8; font-size: 11px;">You received this email because of your notification settings at Lets Make Brand. Log in to your dashboard to manage alerts.</p>
              </div>
            `,
          }),
        });
      } catch (err: any) {
        console.warn("Failed sending email via Resend API:", err?.message);
      }
    } else {
      // Fallback: Securely log server-side transactional dispatch
      console.log(`[EMAIL DISPATCH] To: ${profile.email} | Event: ${type} | Subject: [LMB] ${title}`);
    }
  } catch (err: any) {
    console.error("Error in sendEmailNotification:", err?.message);
  }
}
