import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { NotificationsAdminView, NotificationItem } from "./notifications-admin-view";

export const dynamic = "force-dynamic";

export default async function SuperAdminNotificationsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { data: notifsData } = await adminClient
    .from("notifications")
    .select(`
      id,
      user_id,
      title,
      message,
      type,
      is_read,
      created_at,
      profiles:user_id (
        id,
        email,
        full_name
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const raw = (notifsData as any[]) || [];

  const initialNotifications: NotificationItem[] = raw.map((n) => {
    const profile = Array.isArray(n.profiles) ? n.profiles[0] : n.profiles;
    return {
      id: n.id,
      userId: n.user_id,
      userEmail: profile?.email || null,
      userFullName: profile?.full_name || null,
      title: n.title,
      message: n.message,
      type: n.type || "general",
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Dispatcher & Platform Alerts"
        description="Monitor system-wide notifications, partner alerts, submission triggers, and broadcast platform updates."
        badge={`${initialNotifications.length} Notifications Logged`}
      />

      <NotificationsAdminView initialNotifications={initialNotifications} />
    </div>
  );
}
