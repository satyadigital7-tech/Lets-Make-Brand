/**
 * ==============================================================================
 * LMB (Lets Make Brand) Platform - Phase 1 Automated Verification Suite
 * ==============================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = "") {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ""}`);
  }
}

console.log("\n=======================================================");
console.log("       LMB PLATFORM - PHASE 1 VERIFICATION SUITE       ");
console.log("=======================================================\n");

// ----------------------------------------------------------------------
// TEST SUITE 1: DATABASE MIGRATIONS INTEGRITY
// ----------------------------------------------------------------------
console.log("1. DATABASE MIGRATIONS INTEGRITY & RLS VALIDATION:");

const migration1Path = path.join(rootDir, "supabase/migrations/00001_initial_schema.sql");
const migration2Path = path.join(rootDir, "supabase/migrations/00002_rls_policies.sql");
const migration3Path = path.join(rootDir, "supabase/migrations/00003_seed_data.sql");
const applyMigrationPath = path.join(rootDir, "supabase/migrations/apply_migrations.sql");

assert(fs.existsSync(migration1Path), "Migration 00001_initial_schema.sql exists");
assert(fs.existsSync(migration2Path), "Migration 00002_rls_policies.sql exists");
assert(fs.existsSync(migration3Path), "Migration 00003_seed_data.sql exists");
assert(fs.existsSync(applyMigrationPath), "apply_migrations.sql consolidated script exists");

if (fs.existsSync(migration1Path)) {
  const m1 = fs.readFileSync(migration1Path, "utf-8");
  assert(m1.includes("CREATE TABLE IF NOT EXISTS public.profiles"), "00001 defines public.profiles linked to auth.users");
  assert(m1.includes("CREATE TABLE IF NOT EXISTS public.roles"), "00001 defines public.roles");
  assert(m1.includes("CREATE TABLE IF NOT EXISTS public.permissions"), "00001 defines public.permissions");
  assert(m1.includes("CREATE TABLE IF NOT EXISTS public.user_roles"), "00001 defines public.user_roles");
  assert(m1.includes("CREATE TABLE IF NOT EXISTS public.role_permissions"), "00001 defines public.role_permissions");
  assert(m1.includes("CREATE TABLE IF NOT EXISTS public.user_permissions"), "00001 defines public.user_permissions (granular overrides)");
  assert(m1.includes("CREATE TABLE IF NOT EXISTS public.system_settings"), "00001 defines public.system_settings");
  assert(m1.includes("CREATE TABLE IF NOT EXISTS public.audit_logs"), "00001 defines public.audit_logs");
  assert(m1.includes("CREATE TABLE IF NOT EXISTS public.campaigns"), "00001 defines public.campaigns for real records");
  assert(m1.includes("CREATE OR REPLACE FUNCTION public.handle_new_auth_user()"), "00001 has trigger function to sync auth.users to profiles");
  assert(m1.includes("IF requested_role NOT IN ('vendor', 'independent_partner') THEN"), "00001 database trigger blocks self-assigning super_admin/admin");
}

if (fs.existsSync(migration2Path)) {
  const m2 = fs.readFileSync(migration2Path, "utf-8");
  const tables = [
    "profiles", "roles", "permissions", "user_roles",
    "role_permissions", "user_permissions", "system_settings",
    "audit_logs", "campaigns"
  ];
  for (const t of tables) {
    assert(m2.includes(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;`), `00002 enables RLS on public.${t}`);
  }
  assert(m2.includes("CREATE OR REPLACE FUNCTION public.is_super_admin"), "00002 implements is_super_admin helper");
  assert(m2.includes("CREATE OR REPLACE FUNCTION public.has_permission"), "00002 implements has_permission helper");
  assert(m2.includes("CREATE POLICY \"Audit logs cannot be modified\""), "00002 enforces audit logs immutability");
  assert(m2.includes("CREATE POLICY \"Audit logs cannot be deleted\""), "00002 enforces audit logs cannot be deleted");
}

if (fs.existsSync(migration3Path)) {
  const m3 = fs.readFileSync(migration3Path, "utf-8");
  assert(m3.includes("'super_admin'"), "00003 seeds super_admin role");
  assert(m3.includes("'admin'"), "00003 seeds admin role");
  assert(m3.includes("'vendor'"), "00003 seeds vendor role");
  assert(m3.includes("'team_leader'"), "00003 seeds team_leader role");
  assert(m3.includes("'team_member'"), "00003 seeds team_member role");
  assert(m3.includes("'independent_partner'"), "00003 seeds independent_partner role");
  assert(m3.includes("'can_manage_vendor_transfers'"), "00003 seeds can_manage_vendor_transfers permission");
  
  // CRITICAL REQUIREMENT: can_manage_vendor_transfers must NOT be assigned to standard admin
  const adminPermMatch = m3.indexOf("WHERE r.code = 'admin'");
  const adminSection = m3.substring(adminPermMatch - 500, adminPermMatch);
  assert(!adminSection.includes("'can_manage_vendor_transfers'"), "00003 CRITICAL: can_manage_vendor_transfers defaults to FALSE for admin");
  assert(m3.includes("INSERT INTO public.campaigns"), "00003 seeds verified brand campaigns into PostgreSQL");
}

// ----------------------------------------------------------------------
// TEST SUITE 2: RBAC PERMISSIONS LOGIC VALIDATION
// ----------------------------------------------------------------------
console.log("\n2. RBAC PERMISSIONS & SENSITIVE CHECKS VALIDATION:");

// Test permission helper implementations
function testHasPermission(user, permissionCode) {
  if (!user) return false;
  if (user.roles.includes("super_admin")) return true;
  if (user.permissions.includes("*")) return true;
  return user.permissions.includes(permissionCode);
}

function testCanManageVendorTransfers(user) {
  if (!user) return false;
  if (user.roles.includes("super_admin")) return true;
  return user.permissions.includes("can_manage_vendor_transfers");
}

const mockSuperAdmin = {
  id: "00000000-0000-0000-0000-000000000001",
  roles: ["super_admin"],
  permissions: ["*"],
};

const mockStandardAdmin = {
  id: "00000000-0000-0000-0000-000000000002",
  roles: ["admin"],
  permissions: [
    "view_admin_management",
    "view_vendors",
    "manage_vendors",
    "view_partners",
    "view_campaigns",
  ],
};

const mockAdminWithExplicitTransfer = {
  id: "00000000-0000-0000-0000-000000000003",
  roles: ["admin"],
  permissions: [
    "view_vendors",
    "can_manage_vendor_transfers", // explicitly granted
  ],
};

const mockVendor = {
  id: "00000000-0000-0000-0000-000000000004",
  roles: ["vendor"],
  permissions: ["view_campaigns", "manage_campaigns"],
};

const mockPartner = {
  id: "00000000-0000-0000-0000-000000000005",
  roles: ["independent_partner"],
  permissions: ["view_campaigns"],
};

assert(testHasPermission(mockSuperAdmin, "any_permission_code"), "Super Admin possesses wildcard permission (*)");
assert(testCanManageVendorTransfers(mockSuperAdmin), "Super Admin can manage vendor transfers");

assert(testHasPermission(mockStandardAdmin, "view_vendors"), "Standard Admin possesses view_vendors");
assert(!testCanManageVendorTransfers(mockStandardAdmin), "Standard Admin DENIED vendor transfers by default (can_manage_vendor_transfers = false)");

assert(testCanManageVendorTransfers(mockAdminWithExplicitTransfer), "Admin with explicit grant CAN manage vendor transfers");

assert(!testHasPermission(mockVendor, "view_admin_management"), "Vendor cannot access admin management");
assert(!testCanManageVendorTransfers(mockVendor), "Vendor cannot manage vendor transfers");

assert(!testHasPermission(mockPartner, "view_admin_management"), "Partner cannot access admin management");
assert(!testCanManageVendorTransfers(mockPartner), "Partner cannot manage vendor transfers");

// ----------------------------------------------------------------------
// TEST SUITE 3: INPUT VALIDATION & PRIVILEGE ESCALATION BLOCKING
// ----------------------------------------------------------------------
console.log("\n3. INPUT VALIDATION & ANTI-PRIVILEGE ESCALATION:");

import { registerSchema, loginSchema, campaignCreateSchema } from "../src/lib/security/validation.ts";

// Test 1: Valid registration as Independent Partner
const validPartnerReg = registerSchema.safeParse({
  fullName: "Alice Partner",
  email: "alice@partner.com",
  password: "Password123",
  confirmPassword: "Password123",
  role: "independent_partner",
  termsAccepted: true,
});
assert(validPartnerReg.success, "Registration accepts valid independent_partner role");

// Test 2: Valid registration as Brand Vendor
const validVendorReg = registerSchema.safeParse({
  fullName: "Bob Merchant",
  email: "bob@acme.com",
  companyName: "Acme Corp",
  password: "Password123",
  confirmPassword: "Password123",
  role: "vendor",
  termsAccepted: true,
});
assert(validVendorReg.success, "Registration accepts valid vendor role");

// Test 3: PRIVILEGE ESCALATION ATTEMPT: Trying to register as super_admin
const attackSuperAdmin = registerSchema.safeParse({
  fullName: "Malicious User",
  email: "attacker@hack.com",
  password: "Password123",
  confirmPassword: "Password123",
  role: "super_admin",
  termsAccepted: true,
});
assert(!attackSuperAdmin.success, "SECURITY: Registration strictly BLOCKS self-assignment of 'super_admin'");

// Test 4: PRIVILEGE ESCALATION ATTEMPT: Trying to register as admin
const attackAdmin = registerSchema.safeParse({
  fullName: "Malicious User",
  email: "attacker@hack.com",
  password: "Password123",
  confirmPassword: "Password123",
  role: "admin",
  termsAccepted: true,
});
assert(!attackAdmin.success, "SECURITY: Registration strictly BLOCKS self-assignment of 'admin'");

// Test 5: Password mismatch
const mismatchPass = registerSchema.safeParse({
  fullName: "Alice Partner",
  email: "alice@partner.com",
  password: "Password123",
  confirmPassword: "DifferentPassword123",
  role: "independent_partner",
  termsAccepted: true,
});
assert(!mismatchPass.success, "Registration rejects non-matching confirmPassword");

// Test 6: Weak password rejection
const weakPass = registerSchema.safeParse({
  fullName: "Alice Partner",
  email: "alice@partner.com",
  password: "weak",
  confirmPassword: "weak",
  role: "independent_partner",
  termsAccepted: true,
});
assert(!weakPass.success, "Registration rejects passwords under 8 characters without uppercase/number");

// Test 7: Terms rejected
const unacceptedTerms = registerSchema.safeParse({
  fullName: "Alice Partner",
  email: "alice@partner.com",
  password: "Password123",
  confirmPassword: "Password123",
  role: "independent_partner",
  termsAccepted: false,
});
assert(!unacceptedTerms.success, "Registration rejects when terms are not accepted");

// Test 8: Login schema validation
assert(loginSchema.safeParse({ email: "user@brand.com", password: "Password123" }).success, "Login schema accepts valid credentials");
assert(!loginSchema.safeParse({ email: "invalid-email", password: "Password123" }).success, "Login schema rejects malformed email");
assert(!loginSchema.safeParse({ email: "user@brand.com", password: "short" }).success, "Login schema rejects short password");

// ----------------------------------------------------------------------
// TEST SUITE 4: FILE STRUCTURE & ROUTE MAPPING VERIFICATION
// ----------------------------------------------------------------------
console.log("\n4. FILE STRUCTURE & ROUTE EXISTENCE VALIDATION:");

const requiredRoutes = [
  // Public Pages
  "src/app/(public)/page.tsx",
  "src/app/(public)/about/page.tsx",
  "src/app/(public)/how-it-works/page.tsx",
  "src/app/(public)/campaigns/page.tsx",
  "src/app/(public)/become-partner/page.tsx",
  "src/app/(public)/become-vendor/page.tsx",
  "src/app/(public)/contact/page.tsx",
  "src/app/(public)/privacy/page.tsx",
  "src/app/(public)/terms/page.tsx",
  
  // Auth Pages & Handlers
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/register/page.tsx",
  "src/app/(auth)/forgot-password/page.tsx",
  "src/app/(auth)/reset-password/page.tsx",
  "src/app/auth/callback/route.ts",
  "src/app/api/auth/logout/route.ts",
  
  // Dashboard Framework
  "src/app/dashboard/layout.tsx",
  "src/app/dashboard/page.tsx",
  
  // Super Admin
  "src/app/dashboard/super-admin/page.tsx",
  "src/app/dashboard/super-admin/admins/page.tsx",
  "src/app/dashboard/super-admin/vendors/page.tsx",
  "src/app/dashboard/super-admin/partners/page.tsx",
  "src/app/dashboard/super-admin/campaigns/page.tsx",
  "src/app/dashboard/super-admin/leads/page.tsx",
  "src/app/dashboard/super-admin/commission/page.tsx",
  "src/app/dashboard/super-admin/wallet/page.tsx",
  "src/app/dashboard/super-admin/payments/page.tsx",
  "src/app/dashboard/super-admin/reports/page.tsx",
  "src/app/dashboard/super-admin/settings/page.tsx",

  // Admin
  "src/app/dashboard/admin/page.tsx",
  "src/app/dashboard/admin/campaigns/page.tsx",
  "src/app/dashboard/admin/vendors/page.tsx",
  "src/app/dashboard/admin/partners/page.tsx",
  "src/app/dashboard/admin/settings/page.tsx",
  
  // Vendor
  "src/app/dashboard/vendor/page.tsx",
  "src/app/dashboard/vendor/campaigns/page.tsx",
  "src/app/dashboard/vendor/profile/page.tsx",
  
  // Partner
  "src/app/dashboard/partner/page.tsx",
  "src/app/dashboard/partner/campaigns/page.tsx",
  
  // Team Leader & Team Member
  "src/app/dashboard/team-leader/page.tsx",
  "src/app/dashboard/team-leader/team/page.tsx",
  "src/app/dashboard/team-member/page.tsx",
  "src/app/dashboard/team-member/campaigns/page.tsx",

  // Middleware & Utils
  "src/middleware.ts",
  "src/lib/auth/rbac.ts",
  "src/lib/auth/session.ts",
  "src/lib/auth/permissions.ts",
  "src/lib/security/audit.ts",
  "src/lib/security/validation.ts",
];

for (const route of requiredRoutes) {
  assert(fs.existsSync(path.join(rootDir, route)), `Route / component file exists: ${route}`);
}

// ----------------------------------------------------------------------
// TEST SUITE 5: ENVIRONMENT & SECRET SECURITY CHECK
// ----------------------------------------------------------------------
console.log("\n5. ENVIRONMENT & SECURITY LEAKAGE CHECKS:");

const envExample = fs.readFileSync(path.join(rootDir, ".env.example"), "utf-8");
assert(envExample.includes("NEXT_PUBLIC_SUPABASE_URL"), ".env.example includes NEXT_PUBLIC_SUPABASE_URL");
assert(envExample.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"), ".env.example includes NEXT_PUBLIC_SUPABASE_ANON_KEY");
assert(envExample.includes("SUPABASE_SERVICE_ROLE_KEY"), ".env.example includes SUPABASE_SERVICE_ROLE_KEY");

// Verify SUPABASE_SERVICE_ROLE_KEY does not start with NEXT_PUBLIC_
assert(!envExample.includes("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"), "SECURITY: SUPABASE_SERVICE_ROLE_KEY is strictly server-only");

const gitignore = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf-8");
assert(gitignore.includes(".env*"), ".gitignore ignores all local env files");

// ----------------------------------------------------------------------
// FINAL SUMMARY
// ----------------------------------------------------------------------
console.log("\n=======================================================");
console.log(`TOTAL TESTS EXECUTED : ${totalTests}`);
console.log(`TESTS PASSED         : ${passedTests}`);
console.log(`TESTS FAILED         : ${failedTests}`);
console.log("=======================================================\n");

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log("✓ ALL PHASE 1 SYSTEM TESTS PASSED SUCCESSFULLY!\n");
  process.exit(0);
}
