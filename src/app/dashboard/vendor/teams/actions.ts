"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";
import { teamSchema } from "@/lib/security/validation";

/**
 * Generate unique server-side Team ID (e.g. LMB-TEAM-000001)
 */
async function getNextTeamIdCode(adminClient: ReturnType<typeof createAdminClient>): Promise<string> {
  try {
    const { data, error } = await adminClient.rpc("generate_team_id");
    if (!error && data && typeof data === "string") {
      return data;
    }
  } catch {
    // Fallback if RPC is not yet applied
  }

  const { data: latestTeam } = await adminClient
    .from("teams")
    .select("team_code")
    .order("team_code", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (latestTeam?.team_code) {
    const match = latestTeam.team_code.match(/LMB-TEAM-(\d+)/);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `LMB-TEAM-${String(nextNum).padStart(6, "0")}`;
}

export async function createTeamAction(input: {
  name: string;
  description?: string;
  leaderId?: string;
}) {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  // Validate input
  const validated = teamSchema.parse({
    name: input.name,
    description: input.description,
    leaderId: input.leaderId || undefined,
  });

  const teamCode = await getNextTeamIdCode(adminClient);

  // If leaderId is provided, verify it exists and assign team_leader role if needed
  if (validated.leaderId) {
    const { data: leaderProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", validated.leaderId)
      .single();

    if (!leaderProfile) {
      throw new Error("Specified Team Leader was not found");
    }

    // Ensure role is assigned
    const { data: leaderRole } = await adminClient
      .from("roles")
      .select("id")
      .eq("code", "team_leader")
      .single();

    if (leaderRole) {
      await adminClient.from("user_roles").upsert(
        {
          user_id: validated.leaderId,
          role_id: leaderRole.id,
          assigned_by: currentVendor.id,
        },
        { onConflict: "user_id, role_id" }
      );
    }
  }

  const { data: newTeam, error: insertError } = await adminClient
    .from("teams")
    .insert({
      team_code: teamCode,
      vendor_id: currentVendor.id,
      name: validated.name,
      description: validated.description || null,
      leader_id: validated.leaderId || null,
      status: "active",
    })
    .select("id, team_code")
    .single();

  if (insertError || !newTeam) {
    throw new Error(`Failed to create team: ${insertError?.message || "Database error"}`);
  }

  // If leader was selected, add to team_members as leader
  if (validated.leaderId) {
    await adminClient.from("team_members").upsert(
      {
        team_id: newTeam.id,
        user_id: validated.leaderId,
        role_in_team: "leader",
        status: "active",
      },
      { onConflict: "team_id, user_id" }
    );
  }

  await logAuditEvent({
    userId: currentVendor.id,
    action: "TEAM_CREATED",
    entityType: "teams",
    entityId: newTeam.id,
    details: {
      teamId: newTeam.id,
      teamCode: newTeam.team_code,
      name: validated.name,
      vendorId: currentVendor.id,
      leaderId: validated.leaderId || null,
    },
  });

  revalidatePath("/dashboard/vendor/teams");
  revalidatePath("/dashboard/vendor/team-leaders");
  return { success: true, teamId: newTeam.id, teamCode: newTeam.team_code };
}

export async function updateTeamAction(
  teamId: string,
  input: {
    name: string;
    description?: string;
    leaderId?: string;
    status?: "active" | "inactive" | "archived";
  }
) {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  // Cross-vendor isolation check: Must belong to current vendor!
  const { data: team, error: fetchErr } = await adminClient
    .from("teams")
    .select("id, vendor_id, leader_id")
    .eq("id", teamId)
    .single();

  if (fetchErr || !team || team.vendor_id !== currentVendor.id) {
    throw new Error("Unauthorized: You do not have permission to manage this team.");
  }

  const validated = teamSchema.parse({
    name: input.name,
    description: input.description,
    leaderId: input.leaderId || undefined,
  });

  const { error: updateErr } = await adminClient
    .from("teams")
    .update({
      name: validated.name,
      description: validated.description || null,
      leader_id: validated.leaderId || null,
      status: input.status || "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamId);

  if (updateErr) {
    throw new Error(`Failed to update team: ${updateErr.message}`);
  }

  // If leader changed, update team_members
  if (validated.leaderId && validated.leaderId !== team.leader_id) {
    // Add new leader as team_member
    await adminClient.from("team_members").upsert(
      {
        team_id: teamId,
        user_id: validated.leaderId,
        role_in_team: "leader",
        status: "active",
      },
      { onConflict: "team_id, user_id" }
    );

    // Assign team_leader role if needed
    const { data: leaderRole } = await adminClient
      .from("roles")
      .select("id")
      .eq("code", "team_leader")
      .single();

    if (leaderRole) {
      await adminClient.from("user_roles").upsert(
        {
          user_id: validated.leaderId,
          role_id: leaderRole.id,
          assigned_by: currentVendor.id,
        },
        { onConflict: "user_id, role_id" }
      );
    }
  }

  await logAuditEvent({
    userId: currentVendor.id,
    action: "TEAM_UPDATED",
    entityType: "teams",
    entityId: teamId,
    details: {
      teamId,
      name: validated.name,
      leaderId: validated.leaderId || null,
    },
  });

  revalidatePath("/dashboard/vendor/teams");
  revalidatePath("/dashboard/vendor/team-leaders");
  return { success: true };
}

export async function addMemberToTeamAction(teamId: string, memberUserId: string) {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  // Cross-vendor isolation check
  const { data: team } = await adminClient
    .from("teams")
    .select("id, vendor_id")
    .eq("id", teamId)
    .single();

  if (!team || team.vendor_id !== currentVendor.id) {
    throw new Error("Unauthorized: Team does not belong to your vendor account.");
  }

  // Upsert member
  const { error } = await adminClient.from("team_members").upsert(
    {
      team_id: teamId,
      user_id: memberUserId,
      role_in_team: "member",
      status: "active",
    },
    { onConflict: "team_id, user_id" }
  );

  if (error) {
    throw new Error(`Failed to assign member: ${error.message}`);
  }

  // Associate user profile with this vendor if not already
  await adminClient
    .from("profiles")
    .update({
      associated_vendor_id: currentVendor.id,
      registration_type: "team_member",
    })
    .eq("id", memberUserId);

  await logAuditEvent({
    userId: currentVendor.id,
    action: "TEAM_MEMBER_ASSIGNED",
    entityType: "team_members",
    entityId: teamId,
    details: { teamId, memberUserId },
  });

  revalidatePath("/dashboard/vendor/teams");
  revalidatePath("/dashboard/vendor/team-members");
  return { success: true };
}

export async function removeMemberFromTeamAction(teamId: string, memberUserId: string) {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  // Cross-vendor isolation check
  const { data: team } = await adminClient
    .from("teams")
    .select("id, vendor_id, leader_id")
    .eq("id", teamId)
    .single();

  if (!team || team.vendor_id !== currentVendor.id) {
    throw new Error("Unauthorized: Team does not belong to your vendor account.");
  }

  // Soft-remove from team_members
  const { error } = await adminClient
    .from("team_members")
    .update({
      status: "removed",
      updated_at: new Date().toISOString(),
    })
    .eq("team_id", teamId)
    .eq("user_id", memberUserId);

  if (error) {
    throw new Error(`Failed to remove team member: ${error.message}`);
  }

  // If this member was the team leader, clear team leader_id
  if (team.leader_id === memberUserId) {
    await adminClient
      .from("teams")
      .update({ leader_id: null, updated_at: new Date().toISOString() })
      .eq("id", teamId);
  }

  await logAuditEvent({
    userId: currentVendor.id,
    action: "TEAM_MEMBER_REMOVED",
    entityType: "team_members",
    entityId: teamId,
    details: { teamId, memberUserId },
  });

  revalidatePath("/dashboard/vendor/teams");
  revalidatePath("/dashboard/vendor/team-members");
  revalidatePath("/dashboard/vendor/team-leaders");
  return { success: true };
}

