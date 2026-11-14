import React from "react";
import { requireRole } from "@/lib/auth/session";
import { getAdminOrSessionClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { VendorManager, VendorItem } from "./vendor-manager";

export default async function SuperAdminVendorsPage() {
  await requireRole(["super_admin"]);
  const adminClient = await getAdminOrSessionClient();

  // 1. Fetch all users with 'vendor' role
  const { data: vendorUsersData } = await adminClient
    .from("user_roles")
    .select(`
      user_id,
      profiles:user_id (
        id,
        email,
        full_name,
        business_name,
        company_name,
        phone,
        mobile,
        status,
        vendor_id_code,
        address,
        city,
        state,
        pincode,
        rejection_reason,
        suspension_reason,
        created_at
      ),
      roles!inner (
        code
      )
    `)
    .eq("roles.code", "vendor");

  const vendorUserIds = ((vendorUsersData as any[]) || []).map((u: any) => u.user_id);

  // 2. Fetch associated teams for all vendors
  let teamsByVendor: Record<string, any[]> = {};
  if (vendorUserIds.length > 0) {
    const { data: teamsData } = await adminClient
      .from("teams")
      .select(`
        id,
        team_code,
        name,
        vendor_id,
        leader_id,
        leader:leader_id (
          full_name
        ),
        team_members (
          id,
          status
        )
      `)
      .in("vendor_id", vendorUserIds);

    if (teamsData) {
      for (const t of teamsData as any[]) {
        if (!teamsByVendor[t.vendor_id]) {
          teamsByVendor[t.vendor_id] = [];
        }
        const leaderObj = Array.isArray(t.leader) ? t.leader[0] : t.leader;
        const activeMembers = Array.isArray(t.team_members)
          ? t.team_members.filter((m: any) => m.status === "active").length
          : 0;

        teamsByVendor[t.vendor_id].push({
          id: t.id,
          teamCode: t.team_code,
          name: t.name,
          leaderName: leaderObj?.full_name || null,
          memberCount: activeMembers,
        });
      }
    }
  }

  // 3. Format vendor items
  const vendors: VendorItem[] = ((vendorUsersData as any[]) || []).map((item: any) => {
    const prof = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    return {
      id: prof?.id || item.user_id,
      email: prof?.email || "vendor@company.com",
      fullName: prof?.full_name || "Merchant Owner",
      businessName: prof?.business_name || prof?.company_name || "Enterprise Brand",
      phone: prof?.mobile || prof?.phone || "N/A",
      status: prof?.status || "pending_approval",
      vendorIdCode: prof?.vendor_id_code || null,
      address: prof?.address || null,
      city: prof?.city || null,
      state: prof?.state || null,
      pincode: prof?.pincode || null,
      rejectionReason: prof?.rejection_reason || null,
      suspensionReason: prof?.suspension_reason || null,
      createdAt: prof?.created_at || new Date().toISOString(),
      teams: teamsByVendor[prof?.id || item.user_id] || [],
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Management & Brand Directory"
        description="Review merchant applications, approve brand accounts, issue unique vendor credentials, and inspect associated squads."
        badge="Super Admin Only"
      />

      <VendorManager initialVendors={vendors} />
    </div>
  );
}
