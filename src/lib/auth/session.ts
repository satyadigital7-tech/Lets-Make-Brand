import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthContextUser, UserProfile } from "@/lib/types/auth.types";
import { UserRoleCode } from "@/lib/types/database.types";
import { ROLE_CONFIGS } from "./rbac";

export async function getCurrentUser(): Promise<AuthContextUser | null> {
  const supabase = await createClient();

  let authUser = null;
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }
    authUser = user;
  } catch {
    return null;
  }

  // Fetch profile
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  const profile: UserProfile = profileData || {
    id: authUser.id,
    email: authUser.email || "",
    full_name: (authUser.user_metadata?.full_name as string) || null,
    company_name: (authUser.user_metadata?.company_name as string) || null,
    business_name: (authUser.user_metadata?.business_name as string) || (authUser.user_metadata?.company_name as string) || null,
    phone: (authUser.user_metadata?.phone as string) || null,
    mobile: (authUser.user_metadata?.mobile as string) || (authUser.user_metadata?.phone as string) || null,
    address: (authUser.user_metadata?.address as string) || null,
    city: (authUser.user_metadata?.city as string) || null,
    state: (authUser.user_metadata?.state as string) || null,
    pincode: (authUser.user_metadata?.pincode as string) || null,
    avatar_url: null,
    profile_photo_url: (authUser.user_metadata?.profile_photo_url as string) || null,
    dob: (authUser.user_metadata?.dob as string) || null,
    gender: (authUser.user_metadata?.gender as string) || null,
    referral_code: (authUser.user_metadata?.referral_code as string) || null,
    registration_type: (authUser.user_metadata?.registration_type as "independent" | "team_member") || "independent",
    associated_vendor_id: (authUser.user_metadata?.associated_vendor_id as string) || null,
    vendor_id_code: null,
    partner_id_code: null,
    rejection_reason: null,
    suspension_reason: null,
    status: "pending_approval",
    created_at: authUser.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Fetch roles
  const { data: userRolesData } = await supabase
    .from("user_roles")
    .select(`
      role_id,
      roles:roles (
        code,
        name
      )
    `)
    .eq("user_id", authUser.id);

  const roles: UserRoleCode[] = [];
  if (userRolesData && userRolesData.length > 0) {
    for (const item of userRolesData as any[]) {
      const roleObj = Array.isArray(item.roles) ? item.roles[0] : item.roles;
      if (roleObj?.code) {
        roles.push(roleObj.code as UserRoleCode);
      }
    }
  }

  // Fallback to role stored in user_metadata or default to independent_partner if no DB record
  if (roles.length === 0) {
    const metaRole = authUser.user_metadata?.role as UserRoleCode;
    if (metaRole && (metaRole === "vendor" || metaRole === "independent_partner" || metaRole === "team_leader" || metaRole === "team_member" || metaRole === "super_admin")) {
      roles.push(metaRole);
    } else {
      roles.push("independent_partner");
    }
  }

  // Support verified super admin account
  if (authUser.email === "admin@letsmakebrand.co.in" || authUser.user_metadata?.role === "super_admin") {
    if (!roles.includes("super_admin")) {
      roles.unshift("super_admin");
    }
  }

  // Prioritize primary role
  const roleHierarchy: UserRoleCode[] = [
    "super_admin",
    "admin",
    "vendor",
    "team_leader",
    "team_member",
    "independent_partner",
  ];
  const primaryRole =
    roleHierarchy.find((r) => roles.includes(r)) || roles[0] || "independent_partner";

  // Fetch permissions (from role_permissions + user_permissions)
  const permissionsSet = new Set<string>();

  // If Super Admin, grant all permissions
  if (roles.includes("super_admin")) {
    permissionsSet.add("*");
  } else {
    // 1. Role permissions
    const roleIds = ((userRolesData as any[]) || []).map((ur: any) => ur.role_id);
    if (roleIds.length > 0) {
      const { data: rolePermissionsData } = await supabase
        .from("role_permissions")
        .select(`
          permissions:permissions (
            code
          )
        `)
        .in("role_id", roleIds);

      if (rolePermissionsData) {
        for (const item of rolePermissionsData as any[]) {
          const permObj = Array.isArray(item.permissions)
            ? item.permissions[0]
            : item.permissions;
          if (permObj?.code) {
            permissionsSet.add(permObj.code);
          }
        }
      }
    }

    // 2. Explicit User Permission Overrides
    const { data: userPermissionsData } = await supabase
      .from("user_permissions")
      .select(`
        is_granted,
        permissions:permissions (
          code
        )
      `)
      .eq("user_id", authUser.id);

    if (userPermissionsData) {
      for (const item of userPermissionsData as any[]) {
        const permObj = Array.isArray(item.permissions)
          ? item.permissions[0]
          : item.permissions;
        if (permObj?.code) {
          if (item.is_granted) {
            permissionsSet.add(permObj.code);
          } else {
            permissionsSet.delete(permObj.code);
          }
        }
      }
    }
  }

  return {
    id: authUser.id,
    email: authUser.email || "",
    profile,
    roles,
    primaryRole,
    permissions: Array.from(permissionsSet),
  };
}

export async function requireAuth(): Promise<AuthContextUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // ACCOUNT LIFECYCLE GUARD:
  // Super Admin & Admin bypass approval requirement.
  const isSuperOrAdmin = user.roles.includes("super_admin") || user.roles.includes("admin");
  if (!isSuperOrAdmin) {
    if (user.profile.status === "pending_approval") {
      redirect("/pending-approval");
    }
    if (user.profile.status === "suspended") {
      redirect("/account-status?status=suspended");
    }
    if (user.profile.status === "rejected") {
      redirect("/account-status?status=rejected");
    }
  }

  return user;
}

export async function requireRole(
  allowedRoles: UserRoleCode[]
): Promise<AuthContextUser> {
  const user = await requireAuth();
  const hasAccess = user.roles.some((r) => allowedRoles.includes(r));

  if (!hasAccess) {
    // Redirect to user's assigned dashboard
    const targetPath = ROLE_CONFIGS[user.primaryRole]?.defaultPath || "/dashboard";
    redirect(targetPath);
  }

  return user;
}

export async function requirePermission(
  permissionCode: string
): Promise<AuthContextUser> {
  const user = await requireAuth();

  if (user.roles.includes("super_admin") || user.permissions.includes("*")) {
    return user;
  }

  if (!user.permissions.includes(permissionCode)) {
    redirect("/dashboard?error=unauthorized_permission");
  }

  return user;
}
