import { AuthContextUser } from "@/lib/types/auth.types";
import { SENSITIVE_PERMISSIONS } from "./rbac";

/**
 * Check if the user has a specific permission code.
 * Super Admin always has full access ('*').
 */
export function hasPermission(
  user: AuthContextUser | null,
  permissionCode: string
): boolean {
  if (!user) return false;
  if (user.roles.includes("super_admin")) return true;
  if (user.permissions.includes("*")) return true;
  return user.permissions.includes(permissionCode);
}

/**
 * Check if the user has any of the specified permissions.
 */
export function hasAnyPermission(
  user: AuthContextUser | null,
  permissionCodes: string[]
): boolean {
  if (!user) return false;
  if (user.roles.includes("super_admin")) return true;
  if (user.permissions.includes("*")) return true;
  return permissionCodes.some((code) => user.permissions.includes(code));
}

/**
 * Check if the user has all of the specified permissions.
 */
export function hasAllPermissions(
  user: AuthContextUser | null,
  permissionCodes: string[]
): boolean {
  if (!user) return false;
  if (user.roles.includes("super_admin")) return true;
  if (user.permissions.includes("*")) return true;
  return permissionCodes.every((code) => user.permissions.includes(code));
}

/**
 * CRITICAL SECURITY REQUIREMENT:
 * Checks whether user has permission to manage vendor transfers.
 * MUST return FALSE by default for Admin unless explicitly granted!
 */
export function canManageVendorTransfers(user: AuthContextUser | null): boolean {
  if (!user) return false;
  // Super Admin has it
  if (user.roles.includes("super_admin")) return true;
  // For standard admin or other roles, it MUST be explicitly in their permissions
  return user.permissions.includes(SENSITIVE_PERMISSIONS.CAN_MANAGE_VENDOR_TRANSFERS);
}

/**
 * MODULE 7: TEAM LEADER RESTRICTIONS
 * Team Leader restrictions:
 * - Cannot submit personal earning leads.
 * - Cannot receive Partner commission.
 * - Cannot access Partner earning activities.
 * Never combine Team Leader and Partner earning permissions.
 */
export function canSubmitPersonalLeads(user: AuthContextUser | null): boolean {
  if (!user) return false;
  // Team leaders are strictly forbidden from personal lead submission
  if (user.primaryRole === "team_leader" || (user.roles.includes("team_leader") && !user.roles.includes("super_admin"))) {
    return false;
  }
  return user.roles.includes("independent_partner") || user.roles.includes("team_member") || user.roles.includes("super_admin");
}

export function canReceivePartnerCommission(user: AuthContextUser | null): boolean {
  if (!user) return false;
  if (user.primaryRole === "team_leader" || (user.roles.includes("team_leader") && !user.roles.includes("super_admin"))) {
    return false;
  }
  return user.roles.includes("independent_partner") || user.roles.includes("team_member") || user.roles.includes("super_admin");
}

export function canAccessPartnerEarningActivities(user: AuthContextUser | null): boolean {
  if (!user) return false;
  if (user.primaryRole === "team_leader" || (user.roles.includes("team_leader") && !user.roles.includes("super_admin"))) {
    return false;
  }
  return true;
}
