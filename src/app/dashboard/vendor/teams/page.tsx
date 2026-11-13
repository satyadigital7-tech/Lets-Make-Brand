import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { TeamManager, VendorTeam, AvailableLeader } from "./team-manager";

export default async function VendorTeamsPage() {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  // 1. Fetch all teams belonging strictly to this vendor
  const { data: teamsData } = await adminClient
    .from("teams")
    .select(`
      id,
      team_code,
      name,
      description,
      leader_id,
      status,
      created_at,
      leader:leader_id (
        id,
        full_name,
        email
      ),
      team_members (
        id,
        user_id,
        role_in_team,
        status,
        joined_at,
        profiles:user_id (
          id,
          full_name,
          email
        )
      )
    `)
    .eq("vendor_id", currentVendor.id)
    .order("created_at", { ascending: false });

  // 2. Fetch available potential leaders (profiles who have team_leader role or partner role)
  const { data: leadersData } = await adminClient
    .from("profiles")
    .select("id, full_name, email")
    .eq("status", "active")
    .limit(50);

  const availableLeaders: AvailableLeader[] = ((leadersData as any[]) || []).map((l: any) => ({
    id: l.id,
    fullName: l.full_name || l.email,
    email: l.email,
  }));

  const initialTeams: VendorTeam[] = ((teamsData as any[]) || []).map((t: any) => {
    const leaderObj = Array.isArray(t.leader) ? t.leader[0] : t.leader;
    const membersList = ((t.team_members as any[]) || []).map((m: any) => {
      const prof = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return {
        userId: m.user_id,
        fullName: prof?.full_name || prof?.email || "Team Member",
        email: prof?.email || "member@squad.com",
        roleInTeam: m.role_in_team,
        status: m.status,
        joinedAt: m.joined_at,
      };
    });

    return {
      id: t.id,
      teamCode: t.team_code,
      name: t.name,
      description: t.description || null,
      leaderId: t.leader_id || null,
      leaderName: leaderObj?.full_name || null,
      status: t.status,
      createdAt: t.created_at,
      members: membersList,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad & Team Management"
        description="Organize promotional squads, appoint dedicated Team Leaders, and manage squad rosters with strict vendor data isolation."
        badge={`${initialTeams.length} Active Squads`}
      />

      <TeamManager initialTeams={initialTeams} availableLeaders={availableLeaders} />
    </div>
  );
}
