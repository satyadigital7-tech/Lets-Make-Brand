import type { createAdminClient } from "@/lib/supabase/admin";
import {
  SupportTicketCreateFormData,
  SupportMessageFormData,
  SupportTicketUpdateFormData,
} from "@/lib/security/validation";
import { logAuditEvent } from "@/lib/security/audit";
import { createNotification } from "@/lib/services/notifications";

/**
 * Create a new support ticket with initial message and optional attachments (Module 5)
 */
export async function createSupportTicket(
  userId: string,
  userRole: string,
  data: SupportTicketCreateFormData,
  adminClient: ReturnType<typeof createAdminClient>
) {
  const ticketCode = `LMB-TCK-${String(Math.floor(Math.random() * 900000) + 100000)}`;

  // 1. Insert Support Ticket
  const { data: ticket, error: ticketError } = await adminClient
    .from("support_tickets")
    .insert({
      ticket_code: ticketCode,
      user_id: userId,
      user_role: userRole,
      subject: data.subject,
      category: data.category,
      description: data.description,
      priority: data.priority,
      status: "open",
    })
    .select("id, ticket_code")
    .single();

  if (ticketError || !ticket) {
    throw new Error(ticketError?.message || "Failed to create support ticket.");
  }

  // 2. Insert Initial Message
  const { data: msg } = await adminClient
    .from("support_messages")
    .insert({
      ticket_id: ticket.id,
      sender_id: userId,
      sender_role: userRole,
      message: data.description,
      is_staff_reply: false,
    })
    .select("id")
    .single();

  // 3. Attachments if provided
  if (data.attachments && data.attachments.length > 0) {
    for (const att of data.attachments) {
      await adminClient.from("support_attachments").insert({
        ticket_id: ticket.id,
        message_id: msg?.id || null,
        file_name: att.fileName,
        file_path: att.filePath,
        file_size: att.fileSize || 0,
        mime_type: att.mimeType || "application/octet-stream",
      });
    }
  }

  // 4. Audit Log
  await logAuditEvent({
    userId,
    action: "SUPPORT_TICKET_CREATED",
    entityType: "support_tickets",
    entityId: ticket.id,
    details: { ticketCode, category: data.category, priority: data.priority },
  });

  // 5. Notify user
  await createNotification({
    userId,
    title: "Support Ticket Registered",
    message: `Your support request #${ticketCode} ("${data.subject}") has been assigned to our support desk.`,
    type: "support_reply",
    category: "support",
    entityType: "support_tickets",
    entityId: ticket.id,
    actionUrl: `/dashboard/support?ticket=${ticket.id}`,
  });

  return { success: true, ticketId: ticket.id, ticketCode };
}

/**
 * Add a response message to a support ticket thread (Module 5)
 */
export async function addSupportMessage(
  userId: string,
  userRole: string,
  isStaff: boolean,
  data: SupportMessageFormData,
  adminClient: ReturnType<typeof createAdminClient>
) {
  // Fetch ticket
  const { data: ticket } = await adminClient
    .from("support_tickets")
    .select("id, ticket_code, user_id, status")
    .eq("id", data.ticketId)
    .single();

  if (!ticket) throw new Error("Support ticket not found.");

  // Tenant security validation: normal users can only reply to their own tickets
  if (!isStaff && ticket.user_id !== userId) {
    throw new Error("Unauthorized: You can only reply to your own support tickets.");
  }

  // 1. Insert message
  const { data: msg, error } = await adminClient
    .from("support_messages")
    .insert({
      ticket_id: ticket.id,
      sender_id: userId,
      sender_role: userRole,
      message: data.message,
      is_staff_reply: isStaff,
    })
    .select()
    .single();

  if (error || !msg) throw new Error(error?.message || "Failed to post message.");

  // 2. Status Transition:
  // If staff replies, transition from 'open' or 'in_progress' to 'waiting_user'
  // If user replies, transition to 'in_progress'
  const newStatus = isStaff ? "waiting_user" : "in_progress";
  await adminClient
    .from("support_tickets")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", ticket.id);

  // 3. Audit log
  await logAuditEvent({
    userId,
    action: isStaff ? "SUPPORT_STAFF_REPLIED" : "SUPPORT_USER_REPLIED",
    entityType: "support_tickets",
    entityId: ticket.id,
    details: { ticketCode: ticket.ticket_code, isStaff },
  });

  // 4. Notify recipient
  const targetRecipient = isStaff ? ticket.user_id : null;
  if (targetRecipient) {
    await createNotification({
      userId: targetRecipient,
      title: "New Support Reply",
      message: `Support staff responded to ticket #${ticket.ticket_code}.`,
      type: "support_reply",
      category: "support",
      entityType: "support_tickets",
      entityId: ticket.id,
      actionUrl: `/dashboard/support?ticket=${ticket.id}`,
    });
  }

  return { success: true, messageId: msg.id, status: newStatus };
}

/**
 * Super Admin or authorized Admin updates ticket metadata (Module 5)
 */
export async function updateSupportTicket(
  actorId: string,
  data: SupportTicketUpdateFormData,
  adminClient: ReturnType<typeof createAdminClient>
) {
  const updatePayload: any = { updated_at: new Date().toISOString() };

  if (data.status) {
    updatePayload.status = data.status;
    if (data.status === "resolved") {
      updatePayload.resolved_at = new Date().toISOString();
    } else if (data.status === "closed") {
      updatePayload.closed_at = new Date().toISOString();
    }
  }

  if (data.priority) {
    updatePayload.priority = data.priority;
  }

  if (data.assignedTo !== undefined) {
    updatePayload.assigned_to = data.assignedTo || null;
  }

  const { data: ticket, error } = await adminClient
    .from("support_tickets")
    .update(updatePayload)
    .eq("id", data.ticketId)
    .select()
    .single();

  if (error || !ticket) throw new Error(error?.message || "Failed to update ticket.");

  await logAuditEvent({
    userId: actorId,
    action: "SUPPORT_TICKET_UPDATED",
    entityType: "support_tickets",
    entityId: ticket.id,
    details: { updates: updatePayload },
  });

  return { success: true, ticket };
}
