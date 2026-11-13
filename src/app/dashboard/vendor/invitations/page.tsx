import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { InvitationManager, InvitationItem, AvailableTeam } from "./invitation-manager";

export default async function VendorInvitationsPage() {
  const currentVendor = await requireRole(["vendor"]);
  const adminClient = createAdminClient();

  // 1. Fetch invitations dispatched by this vendor
  const { data: invData } = await adminClient
    .from("invitations")
    .select(`
      id,
      email,
      role,
      token,
      team_id,
      status,
      expires_at,
      accepted_at,
      created_at,
      team:team_id (
        id,
        name
      )
    `)
    .eq("vendor_id", currentVendor.id)
    .order("created_at", { ascending: false });

  // 2. Fetch vendor's teams for squad assignment
  const { data: teamsData } = await adminClient
    .from("teams")
    .select("id, name, team_code")
    .eq("vendor_id", currentVendor.id)
    .eq("status", "active");

  const availableTeams: AvailableTeam[] = ((teamsData as any[]) || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    teamCode: t.team_code,
  }));

  const initialInvitations: InvitationItem[] = ((invData as any[]) || []).map((inv: any) => {
    const teamObj = Array.isArray(inv.team) ? inv.team[0] : inv.team;
    return {
      id: inv.id,
      email: inv.email,
      role: inv.role,
      teamId: inv.team_id,
      teamName: teamObj?.name || null,
      token: inv.token,
      status: inv.status,
      expiresAt: inv.expires_at,
      acceptedAt: inv.accepted_at,
      createdAt: inv.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Squad Invitations & Member Onboarding"
        description="Dispatch cryptographically signed invitations to onboarding Team Leaders and promotional members."
        badge={`${initialInvitations.length} Dispatched`}
      />

      <InvitationManager
        initialInvitations={initialInvitations}
        availableTeams={availableTeams}
      />
    </div>
  );
}
