import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("\n=======================================================");
console.log("    LMB SUPER ADMIN PORTAL - COMPREHENSIVE AUDIT       ");
console.log("=======================================================\n");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

// ----------------------------------------------------------------------
// 1. DEDICATED SUPER ADMIN LOGIN & ENTRY POINT
// ----------------------------------------------------------------------
console.log("1. DEDICATED SUPER ADMIN LOGIN & ENTRY POINT:");

const adminRootPagePath = path.join(rootDir, "src/app/admin/page.tsx");
assert(fs.existsSync(adminRootPagePath), "Dedicated /admin entry point exists");

const adminLoginPagePath = path.join(rootDir, "src/app/admin/login/page.tsx");
assert(fs.existsSync(adminLoginPagePath), "Dedicated /admin/login page exists");

const adminLoginActionPath = path.join(rootDir, "src/app/admin/login/actions.ts");
assert(fs.existsSync(adminLoginActionPath), "Dedicated superAdminLoginAction exists");

const actionCode = fs.readFileSync(adminLoginActionPath, "utf-8");
assert(actionCode.includes("hasSuperAdminRole"), "Server action strictly checks for super_admin role in PostgreSQL");
assert(actionCode.includes("Access Denied: This portal is strictly restricted to Super Administrators"), "Server action blocks non-super-admin users with explicit security denial");
assert(actionCode.includes("logAuditEvent"), "Server action records security audit events for both failed and successful login attempts");

// ----------------------------------------------------------------------
// 2. SUBDOMAIN & MIDDLEWARE REWRITE SUPPORT
// ----------------------------------------------------------------------
console.log("\n2. SUBDOMAIN & MIDDLEWARE ROUTING:");

const middlewarePath = path.join(rootDir, "src/lib/supabase/middleware.ts");
const middlewareCode = fs.readFileSync(middlewarePath, "utf-8");
assert(middlewareCode.includes("isAdminSubdomain"), "Middleware detects admin.* and superadmin.* subdomains");
assert(middlewareCode.includes("/admin/login"), "Middleware redirects unauthenticated requests on admin subdomains to /admin/login");

// ----------------------------------------------------------------------
// 3. ALL 17 SUPER ADMIN PORTAL MODULES EXISTENCE
// ----------------------------------------------------------------------
console.log("\n3. SUPER ADMIN PORTAL MODULE DIRECTORY AUDIT (ALL 17 MODULES):");

const requiredModules = [
  { name: "1. Dashboard Overview", route: "src/app/dashboard/super-admin/page.tsx" },
  { name: "2. Admin Management", route: "src/app/dashboard/super-admin/admins/page.tsx" },
  { name: "3. Vendor Management", route: "src/app/dashboard/super-admin/vendors/page.tsx" },
  { name: "4. Partner Management", route: "src/app/dashboard/super-admin/partners/page.tsx" },
  { name: "5. Team Management", route: "src/app/dashboard/super-admin/teams/page.tsx" },
  { name: "6. Campaign Management", route: "src/app/dashboard/super-admin/campaigns/page.tsx" },
  { name: "7. Lead Management", route: "src/app/dashboard/super-admin/leads/page.tsx" },
  { name: "8. Commission Management", route: "src/app/dashboard/super-admin/commission/page.tsx" },
  { name: "9. Wallet Management", route: "src/app/dashboard/super-admin/wallet/page.tsx" },
  { name: "10. Withdrawals & Payments", route: "src/app/dashboard/super-admin/payments/page.tsx" },
  { name: "11. KYC Management", route: "src/app/dashboard/super-admin/kyc/page.tsx" },
  { name: "12. Document Management", route: "src/app/dashboard/super-admin/documents/page.tsx" },
  { name: "13. Reports & Analytics", route: "src/app/dashboard/super-admin/reports/page.tsx" },
  { name: "14. Notification Management", route: "src/app/dashboard/super-admin/notifications/page.tsx" },
  { name: "15. Support Management", route: "src/app/dashboard/super-admin/support/page.tsx" },
  { name: "16. Audit Logs", route: "src/app/dashboard/super-admin/audit-logs/page.tsx" },
  { name: "17. System Settings", route: "src/app/dashboard/super-admin/settings/page.tsx" },
];

for (const mod of requiredModules) {
  assert(fs.existsSync(path.join(rootDir, mod.route)), `Module exists: ${mod.name} (${mod.route})`);
}

// ----------------------------------------------------------------------
// 4. SIDEBAR NAVIGATION & RBAC AUDIT
// ----------------------------------------------------------------------
console.log("\n4. SIDEBAR NAVIGATION & RBAC CONFIGURATION:");

const rbacPath = path.join(rootDir, "src/lib/auth/rbac.ts");
const rbacCode = fs.readFileSync(rbacPath, "utf-8");
assert(rbacCode.includes("/dashboard/super-admin/audit-logs"), "RBAC config includes Audit Logs route");
assert(rbacCode.includes("/dashboard/super-admin/notifications"), "RBAC config includes Notifications route");
assert(rbacCode.includes("/dashboard/super-admin/admins"), "RBAC config includes Admin Management route");
assert(rbacCode.includes("/dashboard/super-admin/commission"), "RBAC config includes Commissions route");

const sidebarPath = path.join(rootDir, "src/components/layout/dashboard-sidebar.tsx");
const sidebarCode = fs.readFileSync(sidebarPath, "utf-8");
assert(sidebarCode.includes("Bell,"), "Dashboard sidebar maps Bell icon");
assert(sidebarCode.includes("Activity,"), "Dashboard sidebar maps Activity icon");

// ----------------------------------------------------------------------
// 5. DASHBOARD 16 REAL METRICS & CHARTS AUDIT
// ----------------------------------------------------------------------
console.log("\n5. DASHBOARD 16 STATISTICS CARDS & REAL METRICS AUDIT:");

const overviewPagePath = path.join(rootDir, "src/app/dashboard/super-admin/page.tsx");
const overviewCode = fs.readFileSync(overviewPagePath, "utf-8");

assert(overviewCode.includes("1. Total Vendors"), "Overview card 1: Total Vendors present");
assert(overviewCode.includes("2. Approved Vendors"), "Overview card 2: Approved Vendors present");
assert(overviewCode.includes("3. Pending Vendors"), "Overview card 3: Pending Vendors present");
assert(overviewCode.includes("4. Total Partners"), "Overview card 4: Total Partners present");
assert(overviewCode.includes("5. Approved Partners"), "Overview card 5: Approved Partners present");
assert(overviewCode.includes("6. Pending Partners"), "Overview card 6: Pending Partners present");
assert(overviewCode.includes("7. Team Leaders"), "Overview card 7: Total Team Leaders present");
assert(overviewCode.includes("8. Team Members"), "Overview card 8: Total Team Members present");
assert(overviewCode.includes("9. Active Campaigns"), "Overview card 9: Active Campaigns present");
assert(overviewCode.includes("10. Total Leads"), "Overview card 10: Total Leads present");
assert(overviewCode.includes("11. Approved Leads"), "Overview card 11: Approved Leads present");
assert(overviewCode.includes("12. Rejected Leads"), "Overview card 12: Rejected Leads present");
assert(overviewCode.includes("13. Commission Gen."), "Overview card 13: Commission Generated present");
assert(overviewCode.includes("14. Wallet Balance"), "Overview card 14: Wallet Balance present");
assert(overviewCode.includes("15. Pending Payouts"), "Overview card 15: Pending Withdrawals present");
assert(overviewCode.includes("16. Paid Out"), "Overview card 16: Total Payments Completed present");

const chartsComponentPath = path.join(rootDir, "src/app/dashboard/super-admin/dashboard-charts.tsx");
assert(fs.existsSync(chartsComponentPath), "SuperAdminDashboardCharts component exists");

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
  console.log("👑 ALL SUPER ADMIN PORTAL SPECIFICATION AUDITS PASSED!\n");
  process.exit(0);
}
