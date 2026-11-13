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

