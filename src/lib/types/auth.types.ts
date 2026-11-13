import { UserRoleCode, AccountStatus } from "./database.types";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface UserRoleInfo {
  id: string;
  code: UserRoleCode;
  name: string;
  description: string | null;
}

export interface UserPermissionInfo {
  id: string;
  code: string;
  name: string;
  module: string;
}

export interface AuthContextUser {
  id: string;
  email: string;
  profile: UserProfile;
  roles: UserRoleCode[];
  primaryRole: UserRoleCode;
  permissions: string[];
}

export interface RoleNavigationItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  requiredPermission?: string;
  isPhase1Ready?: boolean;
}

