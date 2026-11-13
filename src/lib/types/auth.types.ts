import { UserRoleCode, AccountStatus, RegistrationType } from "./database.types";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  business_name: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  avatar_url: string | null;
  profile_photo_url: string | null;
  dob: string | null;
  gender: string | null;
  referral_code: string | null;
  registration_type: RegistrationType;
  associated_vendor_id: string | null;
  vendor_id_code: string | null;
  partner_id_code: string | null;
  profile_code?: string | null;
  rejection_reason: string | null;
  suspension_reason: string | null;
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
