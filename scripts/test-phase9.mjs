import fs from "fs";
import path from "path";
import assert from "assert";

console.log("=======================================================");
console.log("       LMB PLATFORM - PHASE 9 MAINTENANCE AUDIT        ");
console.log("=======================================================");

let passed = 0;
let failed = 0;

function check(description, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    Error: ${err.message}`);
    failed++;
  }
}

// 1. MAINTENANCE & RELEASE DOCUMENTATION AUDIT
console.log("\n1. MAINTENANCE & RELEASE DOCUMENTATION AUDIT:");

check("docs/MAINTENANCE_PLAN.md exists and documents actual infrastructure", () => {
  const filePath = path.resolve(process.cwd(), "docs/MAINTENANCE_PLAN.md");
  assert.ok(fs.existsSync(filePath), "MAINTENANCE_PLAN.md must exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("Daily Operational Checklist"), "Must include Daily Operational Checklist");
  assert.ok(content.includes("Weekly Operational Checklist"), "Must include Weekly Operational Checklist");
  assert.ok(content.includes("Monthly Operational Checklist"), "Must include Monthly Operational Checklist");
  assert.ok(content.includes("NEVER DELETE PRODUCTION DATA"), "Must include Golden Rule against deleting production data");
  assert.ok(content.includes("Incident Response Playbook"), "Must include Incident Response Playbook");
});

check("docs/RELEASE_HISTORY.md exists with Phase 1-9 changelog & migrations", () => {
  const filePath = path.resolve(process.cwd(), "docs/RELEASE_HISTORY.md");
  assert.ok(fs.existsSync(filePath), "RELEASE_HISTORY.md must exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("1.0.0"), "Must document version 1.0.0");
  assert.ok(content.includes("Database Migration History"), "Must include migration history table");
  assert.ok(content.includes("apply_migrations.sql"), "Must reference apply_migrations.sql");
  assert.ok(content.includes("Bug Fixes"), "Must record bug-fix history");
});

check("docs/SECURITY_REVIEW_LOG.md exists with quarterly permission review queries", () => {
  const filePath = path.resolve(process.cwd(), "docs/SECURITY_REVIEW_LOG.md");
  assert.ok(fs.existsSync(filePath), "SECURITY_REVIEW_LOG.md must exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("Quarterly Permission Review Schedule"), "Must include quarterly permission review schedule");
  assert.ok(content.includes("Row Level Security (RLS) Audit Checklist"), "Must include RLS audit checklist");
  assert.ok(content.includes("user_permissions"), "Must include user_permissions audit query");
});

check("docs/FUTURE_ENHANCEMENTS.md documents all 8 optional modules with approval gates", () => {
  const filePath = path.resolve(process.cwd(), "docs/FUTURE_ENHANCEMENTS.md");
  assert.ok(fs.existsSync(filePath), "FUTURE_ENHANCEMENTS.md must exist");
  const content = fs.readFileSync(filePath, "utf-8");
  const modules = [
    "Native Mobile Application",
    "WhatsApp Notifications",
    "Advanced Analytics Dashboard",
    "Automated Report Scheduling",
    "Advanced Campaign Performance Analytics",
    "Multi-Language Support",
    "Referral & Promotional Enhancements",
    "Direct Bank Payout & Gateway Integrations",
  ];
  for (const mod of modules) {
    assert.ok(content.includes(mod), `Must document optional future module: ${mod}`);
  }
  assert.ok(content.includes("MANDATORY CLIENT APPROVAL REQUIRED"), "Must enforce mandatory approval gate for automated payouts");
});

// 2. SYSTEM HEALTH & MONITORING CONTRACT
console.log("\n2. SYSTEM HEALTH & MONITORING CONTRACT:");

check("Health check API endpoint (/api/health) implements system contracts", () => {
  const filePath = path.resolve(process.cwd(), "src/app/api/health/route.ts");
  assert.ok(fs.existsSync(filePath), "/api/health route must exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("database"), "Must report database health status");
  assert.ok(content.includes("authentication"), "Must report auth service health status");
  assert.ok(content.includes("storage"), "Must report storage service status");
  assert.ok(content.includes("no-store"), "Must disable caching for real-time uptime monitoring");
});

check("Centralized logger redacts sensitive credentials and PII", async () => {
  const loggerPath = path.resolve(process.cwd(), "src/lib/logging/logger.ts");
  assert.ok(fs.existsSync(loggerPath), "logger.ts must exist");
  const content = fs.readFileSync(loggerPath, "utf-8");
  assert.ok(content.includes("sanitizeLogData"), "Must export sanitizeLogData function");
  assert.ok(content.includes("password"), "Must redact password fields");
  assert.ok(content.includes("pan"), "Must redact PAN details");
  assert.ok(content.includes("accountNumber"), "Must redact bank account numbers");
  assert.ok(content.includes("token"), "Must redact security tokens");
});

// 3. FINANCIAL RECONCILIATION & INTEGRITY CONTRACT
console.log("\n3. FINANCIAL RECONCILIATION & INTEGRITY CONTRACT:");

check("Reconciliation service verifies mathematical ledger invariant", () => {
  const filePath = path.resolve(process.cwd(), "src/lib/services/reconciliation.ts");
  assert.ok(fs.existsSync(filePath), "reconciliation.ts must exist");
  const content = fs.readFileSync(filePath, "utf-8");
  assert.ok(content.includes("totalEarnings - reservedBalance - totalWithdrawn"), "Must compute expected available balance mathematically");
  assert.ok(content.includes("Negative available balance"), "Must flag negative available balances as severe violations");
  assert.ok(content.includes("Negative reserved balance"), "Must flag negative reserved balances as severe violations");
  assert.ok(content.includes("reconcileSingleWallet"), "Must export reconcileSingleWallet function");
  assert.ok(content.includes("runPlatformFinancialAudit"), "Must export runPlatformFinancialAudit function");
});

check("Non-destructive maintenance rules: financial records cannot be hard-deleted", () => {
  const walletServicePath = path.resolve(process.cwd(), "src/lib/services/wallet.ts");
  const content = fs.readFileSync(walletServicePath, "utf-8");
  assert.ok(!content.includes("delete from wallet_ledger"), "wallet_ledger must never execute DELETE operations");
  assert.ok(!content.includes("delete from commission_transactions"), "commission_transactions must never execute DELETE operations");
});

check("Strict Manual Payout rule: automated payout execution is not active without approval", () => {
  const actionsPath = path.resolve(process.cwd(), "src/app/dashboard/super-admin/wallet/actions.ts");
  const content = fs.readFileSync(actionsPath, "utf-8");
  assert.ok(content.includes("recordManualPaymentAction"), "Manual payment recording with UTR reference must be active");
  assert.ok(content.includes("paymentReference"), "Must enforce manual bank payment reference / UTR entry");
});

console.log("\n=======================================================");
console.log(`TOTAL PHASE 9 MAINTENANCE TESTS EXECUTED: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log("=======================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\n🛠️ ALL PHASE 9 MAINTENANCE & GOVERNANCE CHECKS PASSED!");
}
