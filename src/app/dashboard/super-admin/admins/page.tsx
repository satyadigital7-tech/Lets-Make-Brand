import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { AdminManager } from "./admin-manager";
import { CreateAdminDialog } from "./create-admin-dialog";

export default async function AdminManagementPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  // 1. Fetch all permissions
  const { data: permissionsData } = await adminClient
    .from("permissions")
    .select("*")
    .order("module", { ascending: true });

  const availablePermissions = (permissionsData as any[]) || [];

  // 2. Fetch all users with admin role
  const { data: adminUsersData } = await adminClient
    .from("user_roles")
    .select(`
      user_id,
      profiles:user_id (
        id,
        email,
        full_name,
        status,
        created_at
      ),
      roles!inner (
        code
      )
    `)
    .eq("roles.code", "admin");

  // 3. For each admin, fetch explicit permissions from user_permissions
  const adminIds = ((adminUsersData as any[]) || []).map((u: any) => u.user_id);
  let explicitPermissions: { user_id: string; permission_id: string; is_granted: boolean }[] = [];

  if (adminIds.length > 0) {
    const { data: userPerms } = await adminClient
      .from("user_permissions")
      .select("user_id, permission_id, is_granted")
      .in("user_id", adminIds);
    explicitPermissions = (userPerms as any[]) || [];
  }

  // Create permission lookup by ID
  const permMapById: Record<string, string> = {};
  for (const p of availablePermissions) {
    permMapById[p.id] = p.code;
  }

  // Build admin objects
  const admins = ((adminUsersData as any[]) || []).map((item: any) => {
    const prof = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    const permissions: Record<string, boolean> = {
      // Default to false for can_manage_vendor_transfers
      can_manage_vendor_transfers: false,
    };

    // Apply explicit user permissions
    const userPerms = explicitPermissions.filter((up) => up.user_id === item.user_id);
    for (const up of userPerms) {
      const code = permMapById[up.permission_id];
      if (code) {
        permissions[code] = up.is_granted;
      }
    }

    return {
      id: prof?.id || item.user_id,
      email: prof?.email || "admin@letsmakebrand.com",
      full_name: prof?.full_name || null,
      status: prof?.status || "active",
      created_at: prof?.created_at || new Date().toISOString(),
      permissions,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Admin Management & Explicit Permissions"
          description="Inspect administrator accounts, assign module privileges, and govern sensitive vendor portfolio transfer authorizations."
          badge="Super Admin Only"
        />
        <CreateAdminDialog />
      </div>

      <AdminManager
        admins={admins}
        availablePermissions={availablePermissions}
      />
    </div>
  );
}
