import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { SupportAdminView, AdminSupportTicket } from "./support-admin-view";

export const dynamic = "force-dynamic";

export default async function SuperAdminSupportPage() {
  const user = await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // Fetch all tickets with sender profile and messages
  const { data: ticketRows } = await adminClient
    .from("support_tickets")
    .select("*, user:user_id(id, full_name, email, profile_code), assignee:assigned_to(full_name), messages:support_messages(*)")
    .order("created_at", { ascending: false });

  const initialTickets: AdminSupportTicket[] = ((ticketRows as any[]) || []).map((t: any) => {
    const sender = Array.isArray(t.user) ? t.user[0] : t.user;
    const assignee = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee;
    return {
      id: t.id,
      ticketCode: t.ticket_code,
      userId: t.user_id,
      userName: sender?.full_name || "Platform User",
      userEmail: sender?.email || "N/A",
      userRole: t.user_role,
      subject: t.subject,
      category: t.category,
      description: t.description,
      priority: t.priority,
      status: t.status,
      assignedTo: t.assigned_to,
      assignedAdminName: assignee?.full_name || null,
      createdAt: t.created_at,
      messages: ((t.messages as any[]) || [])
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderRole: m.sender_role,
          message: m.message,
          isStaffReply: m.is_staff_reply,
          createdAt: m.created_at,
        })),
    };
  });

  // Fetch staff users for assignment
  const { data: staffRows } = await adminClient
    .from("user_roles")
    .select("user_id, role_code, user:user_id(id, full_name)")
    .in("role_code", ["super_admin", "admin"]);

  const staffUsers = ((staffRows as any[]) || []).map((s: any) => {
    const u = Array.isArray(s.user) ? s.user[0] : s.user;
    return {
      id: s.user_id,
      name: u?.full_name || "Staff Admin",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Support Desk Management"
        description="Review inbound partner & vendor support tickets, assign team members, and track customer resolution timelines."
        badge={`${initialTickets.filter((t) => t.status === "open").length} Open`}
      />
      <SupportAdminView
        initialTickets={initialTickets}
        staffUsers={staffUsers}
        currentUserId={user.id}
      />
    </div>
  );
}
