"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";
import { invitationSchema, InvitationFormData } from "@/lib/security/validation";

export async function sendInvitationAction(data: InvitationFormData) {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  const validated = invitationSchema.parse(data);

  // If a team is specified, verify ownership to prevent cross-vendor leakage
  if (validated.teamId) {
    const { data: team } = await adminClient
      .from("teams")
      .select("id, vendor_id")
      .eq("id", validated.teamId)
      .single();

    if (!team || team.vendor_id !== currentVendor.id) {
      throw new Error("Unauthorized: Specified squad does not belong to your vendor organization.");
    }
  }

  // Generate secure random token
  const token = crypto.randomBytes(32).toString("hex");

  // Set 7 days expiration
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invitation, error } = await adminClient
    .from("invitations")
    .insert({
      vendor_id: currentVendor.id,
      team_id: validated.teamId || null,
      email: validated.email.toLowerCase().trim(),
      role: validated.role,
      token,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id, token, email, role")
    .single();

  if (error || !invitation) {
    throw new Error(`Failed to dispatch invitation: ${error?.message || "Database error"}`);
  }

  await logAuditEvent({
    userId: currentVendor.id,
    action: "INVITATION_SENT",
    entityType: "invitations",
    entityId: invitation.id,
    details: {
      invitationId: invitation.id,
      invitedEmail: validated.email,
      role: validated.role,
      teamId: validated.teamId || null,
      vendorId: currentVendor.id,
    },
  });

  revalidatePath("/dashboard/vendor/invitations");
  revalidatePath("/dashboard/vendor/teams");
  return {
    success: true,
    invitationId: invitation.id,
    token: invitation.token,
    inviteUrl: `/invite/${invitation.token}`,
  };
}

export async function cancelInvitationAction(invitationId: string) {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  const { data: inv } = await adminClient
    .from("invitations")
    .select("id, vendor_id, status")
    .eq("id", invitationId)
    .single();

  if (!inv || inv.vendor_id !== currentVendor.id) {
    throw new Error("Unauthorized: Invitation not found or does not belong to you.");
  }

  const { error } = await adminClient
    .from("invitations")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", invitationId);

  if (error) {
    throw new Error(`Failed to cancel invitation: ${error.message}`);
  }

  await logAuditEvent({
    userId: currentVendor.id,
    action: "INVITATION_CANCELLED",
    entityType: "invitations",
    entityId: invitationId,
    details: { invitationId, vendorId: currentVendor.id },
  });

  revalidatePath("/dashboard/vendor/invitations");
  return { success: true };
}

