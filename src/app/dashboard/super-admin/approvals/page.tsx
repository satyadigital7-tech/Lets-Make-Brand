import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { ApprovalQueue, PendingItem } from "./approval-queue";

export default async function SuperAdminApprovalsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // Fetch all pending profiles with their user_roles
  const { data } = await adminClient
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      business_name,
      company_name,
      mobile,
      phone,
      city,
      state,
      status,
      created_at,
      user_roles (
        roles (
          code,
          name
        )
      )
    `)
    .eq("status", "pending_approval")
    .order("created_at", { ascending: false });

  const rawList = (data as any[]) || [];

  const pendingItems: PendingItem[] = rawList.map((item) => {
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
      city: item.city || null,
      state: item.state || null,
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

