"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";

export async function acceptInvitationAction(token: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be signed in to accept an invitation");
  }

  const adminClient = createAdminClient();

  // 1. Fetch and validate invitation
  const { data: invitation, error: fetchErr } = await adminClient
    .from("invitations")
    .select(`
      id,
      vendor_id,
      team_id,
      email,
      role,
      token,
      status,
      expires_at
    `)
    .eq("token", token)
    .single();

  if (fetchErr || !invitation) {
    throw new Error("Invitation not found or invalid token");
  }

  if (invitation.status !== "pending") {
    throw new Error(`Invitation has already been ${invitation.status}`);
  }

  const isExpired = new Date(invitation.expires_at) < new Date();
  if (isExpired) {
    await adminClient
      .from("invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);
    throw new Error("This invitation has expired");
  }

  // 2. Critical Email Verification Security check:
  // Authenticated user's email MUST match the invited email!
  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new Error(
      `Invitation mismatch: This invitation was issued for ${invitation.email}, but you are currently signed in as ${user.email}. Please sign in with the invited email.`
    );
  }

  // 3. Update invitation record (Vendor cannot modify consent directly)
  const { error: inviteUpdateErr } = await adminClient
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: user.id,
    })
    .eq("id", invitation.id);

  if (inviteUpdateErr) {
    throw new Error(`Failed to accept invitation: ${inviteUpdateErr.message}`);
  }

  // 4. Assign Team Membership if team_id is present
  if (invitation.team_id) {
    const roleInTeam = invitation.role === "team_leader" ? "leader" : "member";

    await adminClient.from("team_members").upsert(
      {
        team_id: invitation.team_id,
        user_id: user.id,
        role_in_team: roleInTeam,
        status: "active",
      },
      { onConflict: "team_id, user_id" }
    );

    if (invitation.role === "team_leader") {
      await adminClient
        .from("teams")
        .update({ leader_id: user.id })
        .eq("id", invitation.team_id);
    }
  }

  // 5. Update user roles and profile association
  const { data: roleRecord } = await adminClient
    .from("roles")
    .select("id")
    .eq("code", invitation.role)
    .single();

  if (roleRecord) {
    await adminClient.from("user_roles").upsert(
      {
        user_id: user.id,
        role_id: roleRecord.id,
        assigned_by: invitation.vendor_id,
      },
      { onConflict: "user_id, role_id" }
    );
  }

  await adminClient
    .from("profiles")
    .update({
      associated_vendor_id: invitation.vendor_id,
      registration_type: "team_member",
      status: "active", // Activated via verified vendor squad invitation
    })
    .eq("id", user.id);

  // 6. Record Audit Log
  await logAuditEvent({
    userId: user.id,
    action: "INVITATION_ACCEPTED",
    entityType: "invitations",
    entityId: invitation.id,
    details: {
      invitationId: invitation.id,
      vendorId: invitation.vendor_id,
      teamId: invitation.team_id,
      role: invitation.role,
      acceptedBy: user.id,
    },
  });

  revalidatePath("/dashboard");
  return {
    success: true,
    role: invitation.role,
    redirectPath: invitation.role === "team_leader" ? "/dashboard/team-leader" : "/dashboard/partner",
  };
}
