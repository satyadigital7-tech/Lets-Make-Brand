import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { SupportClientView, SupportTicketItem } from "./support-client-view";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const adminClient = createAdminClient();

  // Fetch tickets owned by current user (strict tenant isolation)
  const { data: ticketRows } = await adminClient
    .from("support_tickets")
    .select("*, messages:support_messages(*), attachments:support_attachments(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const initialTickets: SupportTicketItem[] = ((ticketRows as any[]) || []).map((t: any) => ({
    id: t.id,
    ticketCode: t.ticket_code,
    subject: t.subject,
    category: t.category,
    description: t.description,
    priority: t.priority,
    status: t.status,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
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
    attachments: ((t.attachments as any[]) || []).map((a: any) => ({
      id: a.id,
      fileName: a.file_name,
      filePath: a.file_path,
    })),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support & Inquiry Desk"
        description="Submit inquiries to our operations and technical support teams with real-time status and ticket updates."
      />
      <SupportClientView
        initialTickets={initialTickets}
        currentUserId={user.id}
      />
    </div>
  );
}
