import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { NotificationsView, NotificationItem, NotificationPreferencesData } from "./notifications-view";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  // Fetch notifications
  const { data: rows } = await adminClient
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const initialNotifications: NotificationItem[] = ((rows as any[]) || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    message: r.message,
    type: r.type,
    category: r.category || "system",
    actionUrl: r.action_url,
    isRead: r.is_read,
    createdAt: r.created_at,
  }));

  // Fetch preferences
  const { data: prefRow } = await adminClient
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const initialPreferences: NotificationPreferencesData = {
    emailAccountUpdates: prefRow?.email_account_updates ?? true,
    emailCampaignUpdates: prefRow?.email_campaign_updates ?? true,
    emailLeadUpdates: prefRow?.email_lead_updates ?? true,
    emailFinancialUpdates: prefRow?.email_financial_updates ?? true,
    emailSupportUpdates: prefRow?.email_support_updates ?? true,
    inappAll: prefRow?.inapp_all ?? true,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Alerts"
        description="Review transactional milestones, lead verifications, payout dispatches, and configure delivery preferences."
      />
      <NotificationsView
        initialNotifications={initialNotifications}
        initialPreferences={initialPreferences}
      />
    </div>
  );
}
