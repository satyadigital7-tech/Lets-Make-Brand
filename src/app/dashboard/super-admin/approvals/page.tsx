import React from "react";
import { requireRole } from "@/lib/auth/session";
import { getAdminOrSessionClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { ApprovalQueue, PendingItem } from "./approval-queue";

export const dynamic = "force-dynamic";

export default async function SuperAdminApprovalsPage() {
  await requireRole(["super_admin"]);
  const db = await getAdminOrSessionClient();

  let pendingProfiles: any[] = [];

  // 1. Primary Query: Fetch pending profiles with disambiguated user_roles foreign key
  const { data, error } = await db
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      business_name,
      company_name,
      mobile,
      phone,
      address,
      city,
      state,
      pincode,
      status,
      created_at,
      rejection_reason,
      user_roles:user_roles!user_roles_user_id_fkey (
        roles (
          code,
          name
        )
      )
    `)
    .eq("status", "pending_approval")
    .order("created_at", { ascending: false });

  if (!error && data) {
    pendingProfiles = data;
  } else {
    // 2. Resilient Fallback: Two-step query to prevent embedding ambiguities from blanking the queue
    const { data: fallbackProfiles } = await db
      .from("profiles")
      .select("id, email, full_name, business_name, company_name, mobile, phone, address, city, state, pincode, status, created_at, rejection_reason")
      .eq("status", "pending_approval")
      .order("created_at", { ascending: false });

    if (fallbackProfiles && fallbackProfiles.length > 0) {
      const userIds = fallbackProfiles.map((p) => p.id);
      const { data: userRoles } = await db
        .from("user_roles")
        .select("user_id, roles(code, name)")
        .in("user_id", userIds);

      const rolesByUserId: Record<string, any[]> = {};
      (userRoles || []).forEach((ur: any) => {
        if (!rolesByUserId[ur.user_id]) rolesByUserId[ur.user_id] = [];
        rolesByUserId[ur.user_id].push(ur);
      });

      pendingProfiles = fallbackProfiles.map((p) => ({
        ...p,
        user_roles: rolesByUserId[p.id] || [],
      }));
    }
  }

  const pendingItems: PendingItem[] = pendingProfiles.map((item) => {
    const rolesArr = (item.user_roles || []).map((ur: any) => ur.roles?.code).filter(Boolean);
    const isVendor = rolesArr.includes("vendor");

    return {
      id: item.id,
      type: isVendor ? "vendor" : "partner",
      displayName: item.full_name || (isVendor ? "Merchant Applicant" : "Partner Applicant"),
      secondaryName: isVendor
        ? item.business_name || item.company_name || "Merchant Brand"
        : (item.user_roles?.[0]?.roles?.name || "Independent Partner"),
      email: item.email || "applicant@platform.com",
      phone: item.mobile || item.phone || "N/A",
      address: item.address || null,
      city: item.city || null,
      state: item.state || null,
      pincode: item.pincode || null,
      rejectionReason: item.rejection_reason || null,
      createdAt: item.created_at || new Date().toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approvals & Verification Queue"
        description="Review incoming merchant vendor and promotional partner registrations awaiting administrative validation."
        badge={`${pendingItems.length} Awaiting Review`}
      />

      <ApprovalQueue initialItems={pendingItems} />
    </div>
  );
}
