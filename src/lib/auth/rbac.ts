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
      { title: "Admin Management", href: "/dashboard/super-admin/admins", iconName: "ShieldAlert", requiredPermission: "view_admin_management", isPhase1Ready: true },
      { title: "Vendors", href: "/dashboard/super-admin/vendors", iconName: "Store", requiredPermission: "view_vendors", isPhase1Ready: true },
      { title: "Partners", href: "/dashboard/super-admin/partners", iconName: "Users", requiredPermission: "view_partners", isPhase1Ready: true },
      { title: "Campaigns", href: "/dashboard/super-admin/campaigns", iconName: "Megaphone", requiredPermission: "view_campaigns", isPhase1Ready: true },
      { title: "Leads", href: "/dashboard/super-admin/leads", iconName: "Filter", requiredPermission: "view_leads", badge: "Phase 2", isPhase1Ready: false },
      { title: "Commission", href: "/dashboard/super-admin/commission", iconName: "Percent", requiredPermission: "view_commission", badge: "Phase 3", isPhase1Ready: false },
      { title: "Wallet", href: "/dashboard/super-admin/wallet", iconName: "Wallet", requiredPermission: "view_wallet", badge: "Phase 4", isPhase1Ready: false },
      { title: "Payments", href: "/dashboard/super-admin/payments", iconName: "CreditCard", requiredPermission: "view_payments", badge: "Phase 4", isPhase1Ready: false },
      { title: "Reports", href: "/dashboard/super-admin/reports", iconName: "BarChart3", requiredPermission: "view_reports", badge: "Phase 5", isPhase1Ready: false },
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
      { title: "Leads", href: "/dashboard/admin/leads", iconName: "Filter", requiredPermission: "view_leads", badge: "Phase 2", isPhase1Ready: false },
      { title: "Commission", href: "/dashboard/admin/commission", iconName: "Percent", requiredPermission: "view_commission", badge: "Phase 3", isPhase1Ready: false },
      { title: "Wallet", href: "/dashboard/admin/wallet", iconName: "Wallet", requiredPermission: "view_wallet", badge: "Phase 4", isPhase1Ready: false },
      { title: "Payments", href: "/dashboard/admin/payments", iconName: "CreditCard", requiredPermission: "view_payments", badge: "Phase 4", isPhase1Ready: false },
      { title: "Reports", href: "/dashboard/admin/reports", iconName: "BarChart3", requiredPermission: "view_reports", badge: "Phase 5", isPhase1Ready: false },
      { title: "Settings", href: "/dashboard/admin/settings", iconName: "Settings", requiredPermission: "view_settings", isPhase1Ready: true },
    ],
  },
  vendor: {
    code: "vendor",
    name: "Vendor",
    defaultPath: "/dashboard/vendor",
    description: "Manage brand campaigns, performance analytics, and marketing assets",
    navigation: [
      { title: "Overview", href: "/dashboard/vendor", iconName: "LayoutDashboard", isPhase1Ready: true },
      { title: "My Campaigns", href: "/dashboard/vendor/campaigns", iconName: "Megaphone", isPhase1Ready: true },
      { title: "Lead Inflow", href: "/dashboard/vendor/leads", iconName: "Inbox", badge: "Phase 2", isPhase1Ready: false },
      { title: "Billing & Wallet", href: "/dashboard/vendor/wallet", iconName: "Wallet", badge: "Phase 4", isPhase1Ready: false },
      { title: "Analytics", href: "/dashboard/vendor/reports", iconName: "LineChart", badge: "Phase 5", isPhase1Ready: false },
      { title: "Brand Profile", href: "/dashboard/vendor/profile", iconName: "Building2", isPhase1Ready: true },
    ],
  },
  team_leader: {
    code: "team_leader",
    name: "Team Leader",
    defaultPath: "/dashboard/team-leader",
    description: "Lead promotional squads, assign partner targets, and review team earnings",
    navigation: [
      { title: "Overview", href: "/dashboard/team-leader", iconName: "LayoutDashboard", isPhase1Ready: true },
      { title: "Team Members", href: "/dashboard/team-leader/team", iconName: "Users2", isPhase1Ready: true },
      { title: "Assigned Campaigns", href: "/dashboard/team-leader/campaigns", iconName: "Megaphone", isPhase1Ready: true },
      { title: "Team Leads", href: "/dashboard/team-leader/leads", iconName: "Filter", badge: "Phase 2", isPhase1Ready: false },
      { title: "Group Commission", href: "/dashboard/team-leader/commission", iconName: "Percent", badge: "Phase 3", isPhase1Ready: false },
      { title: "Team Wallet", href: "/dashboard/team-leader/wallet", iconName: "Wallet", badge: "Phase 4", isPhase1Ready: false },
    ],
  },
  team_member: {
    code: "team_member",
    name: "Team Member",
    defaultPath: "/dashboard/team-member",
    description: "Execute campaign promotions, track link referrals, and view individual metrics",
    navigation: [
      { title: "Overview", href: "/dashboard/team-member", iconName: "LayoutDashboard", isPhase1Ready: true },
      { title: "Available Campaigns", href: "/dashboard/team-member/campaigns", iconName: "Megaphone", isPhase1Ready: true },
      { title: "My Leads", href: "/dashboard/team-member/leads", iconName: "CheckCircle2", badge: "Phase 2", isPhase1Ready: false },
      { title: "My Commission", href: "/dashboard/team-member/commission", iconName: "Percent", badge: "Phase 3", isPhase1Ready: false },
      { title: "Earnings Wallet", href: "/dashboard/team-member/wallet", iconName: "Wallet", badge: "Phase 4", isPhase1Ready: false },
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
      { title: "Submitted Leads", href: "/dashboard/partner/leads", iconName: "Filter", badge: "Phase 2", isPhase1Ready: false },
      { title: "Commission Accruals", href: "/dashboard/partner/commission", iconName: "Percent", badge: "Phase 3", isPhase1Ready: false },
      { title: "My Wallet", href: "/dashboard/partner/wallet", iconName: "Wallet", badge: "Phase 4", isPhase1Ready: false },
      { title: "Payout History", href: "/dashboard/partner/payouts", iconName: "CreditCard", badge: "Phase 4", isPhase1Ready: false },
    ],
  },
};

export const SENSITIVE_PERMISSIONS = {
  CAN_MANAGE_VENDOR_TRANSFERS: "can_manage_vendor_transfers",
};

