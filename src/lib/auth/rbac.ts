import { UserRoleCode } from "@/lib/types/database.types";
import { RoleNavigationItem } from "@/lib/types/auth.types";

export interface RoleConfig {
  code: UserRoleCode;
  name: string;
  defaultPath: string;
  description: string;
  navigation: RoleNavigationItem[];
}

export const ROLE_CONFIGS: Record<UserRoleCode, RoleConfig> = {
  super_admin: {
    code: "super_admin",
    name: "Super Admin",
    defaultPath: "/dashboard/super-admin",
    description: "Full platform governance, security controls, and admin management",
    navigation: [
      { title: "Overview", href: "/dashboard/super-admin", iconName: "LayoutDashboard", isPhase1Ready: true },
      { title: "Pending Approvals", href: "/dashboard/super-admin/approvals", iconName: "CheckCircle2", isPhase1Ready: true },
      { title: "Admin Management", href: "/dashboard/super-admin/admins", iconName: "ShieldAlert", requiredPermission: "view_admin_management", isPhase1Ready: true },
      { title: "Vendors", href: "/dashboard/super-admin/vendors", iconName: "Store", requiredPermission: "view_vendors", isPhase1Ready: true },
      { title: "Partners", href: "/dashboard/super-admin/partners", iconName: "Users", requiredPermission: "view_partners", isPhase1Ready: true },
      { title: "Teams", href: "/dashboard/super-admin/teams", iconName: "Users2", isPhase1Ready: true },
      { title: "Campaigns", href: "/dashboard/super-admin/campaigns", iconName: "Megaphone", requiredPermission: "view_campaigns", isPhase1Ready: true },
      { title: "Leads", href: "/dashboard/super-admin/leads", iconName: "Filter", requiredPermission: "view_leads", isPhase1Ready: true },
      { title: "Commission", href: "/dashboard/super-admin/commission", iconName: "Percent", requiredPermission: "view_commission", isPhase1Ready: true },
      { title: "Wallet", href: "/dashboard/super-admin/wallet", iconName: "Wallet", requiredPermission: "view_wallet", isPhase1Ready: true },
      { title: "Payments", href: "/dashboard/super-admin/payments", iconName: "CreditCard", requiredPermission: "view_payments", isPhase1Ready: true },
      { title: "KYC Management", href: "/dashboard/super-admin/kyc", iconName: "ShieldCheck", isPhase1Ready: true },
      { title: "Document Templates", href: "/dashboard/super-admin/documents", iconName: "FileText", isPhase1Ready: true },
      { title: "Support Desk", href: "/dashboard/super-admin/support", iconName: "LifeBuoy", isPhase1Ready: true },
      { title: "Reports", href: "/dashboard/super-admin/reports", iconName: "BarChart3", requiredPermission: "view_reports", isPhase1Ready: true },
      { title: "Settings", href: "/dashboard/super-admin/settings", iconName: "Settings", requiredPermission: "view_settings", isPhase1Ready: true },
    ],
  },
  admin: {
    code: "admin",
    name: "Admin",
    defaultPath: "/dashboard/admin",
    description: "Platform operations with explicit granular access permissions",
    navigation: [
      { title: "Overview", href: "/dashboard/admin", iconName: "LayoutDashboard", isPhase1Ready: true },
      { title: "Vendors", href: "/dashboard/admin/vendors", iconName: "Store", requiredPermission: "view_vendors", isPhase1Ready: true },
      { title: "Partners", href: "/dashboard/admin/partners", iconName: "Users", requiredPermission: "view_partners", isPhase1Ready: true },
      { title: "Campaigns", href: "/dashboard/admin/campaigns", iconName: "Megaphone", requiredPermission: "view_campaigns", isPhase1Ready: true },
      { title: "Leads", href: "/dashboard/admin/leads", iconName: "Filter", requiredPermission: "view_leads", isPhase1Ready: true },
      { title: "Commission", href: "/dashboard/admin/commission", iconName: "Percent", requiredPermission: "view_commission", isPhase1Ready: true },
      { title: "Wallet", href: "/dashboard/admin/wallet", iconName: "Wallet", requiredPermission: "view_wallet", isPhase1Ready: true },
      { title: "Payments", href: "/dashboard/admin/payments", iconName: "CreditCard", requiredPermission: "view_payments", isPhase1Ready: true },
      { title: "KYC Verification", href: "/dashboard/admin/kyc", iconName: "ShieldCheck", isPhase1Ready: true },
      { title: "Support Desk", href: "/dashboard/admin/support", iconName: "LifeBuoy", isPhase1Ready: true },
      { title: "Reports", href: "/dashboard/admin/reports", iconName: "BarChart3", requiredPermission: "view_reports", isPhase1Ready: true },
      { title: "Settings", href: "/dashboard/admin/settings", iconName: "Settings", requiredPermission: "view_settings", isPhase1Ready: true },
    ],
  },
  vendor: {
    code: "vendor",
    name: "Vendor",
    defaultPath: "/dashboard/vendor",
    description: "Manage brand campaigns, teams, performance analytics, and marketing assets",
    navigation: [
      { title: "Overview", href: "/dashboard/vendor", iconName: "LayoutDashboard", isPhase1Ready: true },
      { title: "My Campaigns", href: "/dashboard/vendor/campaigns", iconName: "Megaphone", isPhase1Ready: true },
      { title: "Teams", href: "/dashboard/vendor/teams", iconName: "Users2", isPhase1Ready: true },
      { title: "Invitations", href: "/dashboard/vendor/invitations", iconName: "Mail", isPhase1Ready: true },
      { title: "Team Leaders", href: "/dashboard/vendor/team-leaders", iconName: "Shield", isPhase1Ready: true },
      { title: "Team Members", href: "/dashboard/vendor/team-members", iconName: "Users", isPhase1Ready: true },
      { title: "Team Performance", href: "/dashboard/vendor/team-performance", iconName: "LineChart", isPhase1Ready: true },
      { title: "Commission & Splits", href: "/dashboard/vendor/commission", iconName: "Percent", isPhase1Ready: true },
      { title: "Agency Wallet", href: "/dashboard/vendor/wallet", iconName: "Wallet", isPhase1Ready: true },
      { title: "KYC Verification", href: "/dashboard/vendor/kyc", iconName: "ShieldCheck", isPhase1Ready: true },
      { title: "Agency Documents", href: "/dashboard/vendor/documents", iconName: "FileText", isPhase1Ready: true },
      { title: "Agency Reports", href: "/dashboard/vendor/reports", iconName: "BarChart3", isPhase1Ready: true },
      { title: "Support Desk", href: "/dashboard/support", iconName: "LifeBuoy", isPhase1Ready: true },
      { title: "Brand Profile", href: "/dashboard/vendor/profile", iconName: "Building2", isPhase1Ready: true },
    ],
  },
  team_leader: {
    code: "team_leader",
    name: "Team Leader",
    defaultPath: "/dashboard/team-leader",
    description: "Lead promotional squads, view assigned members, monitor squad activity without personal earning",
    navigation: [
      { title: "Overview", href: "/dashboard/team-leader", iconName: "LayoutDashboard", isPhase1Ready: true },
      { title: "Assigned Team", href: "/dashboard/team-leader/team", iconName: "Users2", isPhase1Ready: true },
      { title: "Assigned Campaigns", href: "/dashboard/team-leader/campaigns", iconName: "Megaphone", isPhase1Ready: true },
      { title: "Team Leads", href: "/dashboard/team-leader/leads", iconName: "Filter", isPhase1Ready: true },
      { title: "Team Reports", href: "/dashboard/team-leader/reports", iconName: "BarChart3", isPhase1Ready: true },
      { title: "Support Desk", href: "/dashboard/support", iconName: "LifeBuoy", isPhase1Ready: true },
    ],
  },
  team_member: {
    code: "team_member",
    name: "Team Member",
    defaultPath: "/dashboard/partner", // Team member uses same partner dashboard as requested in Module 2!
    description: "Execute campaign promotions under a team leader, track referrals, and view individual metrics",
    navigation: [
      { title: "Overview", href: "/dashboard/partner", iconName: "LayoutDashboard", isPhase1Ready: true },
      { title: "Campaign Catalog", href: "/dashboard/partner/campaigns", iconName: "Megaphone", isPhase1Ready: true },
      { title: "Promotional Links", href: "/dashboard/partner/links", iconName: "Link2", badge: "Phase 2", isPhase1Ready: false },
      { title: "Submitted Leads", href: "/dashboard/partner/leads", iconName: "Filter", isPhase1Ready: true },
      { title: "Commission Accruals", href: "/dashboard/partner/commission", iconName: "Percent", isPhase1Ready: true },
      { title: "My Wallet", href: "/dashboard/partner/wallet", iconName: "Wallet", isPhase1Ready: true },
      { title: "KYC & Banking", href: "/dashboard/partner/kyc", iconName: "ShieldCheck", isPhase1Ready: true },
      { title: "Official Documents", href: "/dashboard/partner/documents", iconName: "FileText", isPhase1Ready: true },
      { title: "Support Desk", href: "/dashboard/support", iconName: "LifeBuoy", isPhase1Ready: true },
    ],
  },
  independent_partner: {
    code: "independent_partner",
    name: "Independent Partner",
    defaultPath: "/dashboard/partner",
    description: "Solo promotional affiliate, link performance tracking, and direct payouts",
    navigation: [
      { title: "Overview", href: "/dashboard/partner", iconName: "LayoutDashboard", isPhase1Ready: true },
      { title: "Campaign Catalog", href: "/dashboard/partner/campaigns", iconName: "Megaphone", isPhase1Ready: true },
      { title: "Promotional Links", href: "/dashboard/partner/links", iconName: "Link2", badge: "Phase 2", isPhase1Ready: false },
      { title: "Submitted Leads", href: "/dashboard/partner/leads", iconName: "Filter", isPhase1Ready: true },
      { title: "Commission Accruals", href: "/dashboard/partner/commission", iconName: "Percent", isPhase1Ready: true },
      { title: "My Wallet", href: "/dashboard/partner/wallet", iconName: "Wallet", isPhase1Ready: true },
      { title: "KYC & Banking", href: "/dashboard/partner/kyc", iconName: "ShieldCheck", isPhase1Ready: true },
      { title: "Official Documents", href: "/dashboard/partner/documents", iconName: "FileText", isPhase1Ready: true },
      { title: "Support Desk", href: "/dashboard/support", iconName: "LifeBuoy", isPhase1Ready: true },
    ],
  },
};

export const SENSITIVE_PERMISSIONS = {
  CAN_MANAGE_VENDOR_TRANSFERS: "can_manage_vendor_transfers",
};
