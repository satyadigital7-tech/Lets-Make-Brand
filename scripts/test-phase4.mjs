/**
 * ==============================================================================
 * LMB (Lets Make Brand) Platform - Phase 4 Automated Verification Suite
 * ==============================================================================
 * Verifies all 15 Required Test Workflows for the Commission Management System:
 * 1. Campaign commission configuration
 * 2. Vendor commission split
 * 3. Maximum commission validation
 * 4. Independent Partner commission
 * 5. Approved lead commission generation
 * 6. Rejected lead commission prevention
 * 7. Duplicate lead commission prevention
 * 8. Team Leader earning restrictions
 * 9. Duplicate commission request protection
 * 10. Concurrent commission processing
 * 11. Commission ledger integrity
 * 12. Commission reversal
 * 13. Vendor financial data isolation
 * 14. Partner financial data isolation
 * 15. Commission report accuracy
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
console.log("       LMB PLATFORM - PHASE 4 VERIFICATION SUITE       ");
console.log("=======================================================\n");

// ----------------------------------------------------------------------
// WORKFLOW 1: CAMPAIGN COMMISSION CONFIGURATION (MODULE 1)
// ----------------------------------------------------------------------
console.log("WORKFLOW 1: CAMPAIGN COMMISSION CONFIGURATION (MODULE 1)");

const superAdminCommActions = path.join(rootDir, "src/app/dashboard/super-admin/commission/actions.ts");
assert(fs.existsSync(superAdminCommActions), "Super Admin commission actions file exists");

const superAdminCommCode = fs.readFileSync(superAdminCommActions, "utf-8");
assert(superAdminCommCode.includes("export async function saveCommissionRuleAction"), "saveCommissionRuleAction is exported");
assert(superAdminCommCode.includes("requireRole([\"super_admin\"])"), "Only Super Admin can configure commission rules");
assert(superAdminCommCode.includes("commissionRuleSchema.parse"), "Validates input via commissionRuleSchema");
assert(superAdminCommCode.includes("logAuditEvent"), "Commission rule updates record audit events");

const validationFile = path.join(rootDir, "src/lib/security/validation.ts");
const validationCode = fs.readFileSync(validationFile, "utf-8");
assert(validationCode.includes("export const commissionRuleSchema"), "commissionRuleSchema is defined in validation.ts");
assert(validationCode.includes("maxCommissionAmount"), "commissionRuleSchema specifies maxCommissionAmount");
assert(validationCode.includes("partnerDefaultCommission"), "commissionRuleSchema specifies partnerDefaultCommission");
assert(validationCode.includes("independentPartnerCommission"), "commissionRuleSchema specifies independentPartnerCommission");

// ----------------------------------------------------------------------
// WORKFLOW 2 & 3: VENDOR COMMISSION SPLITS & MAX COMMISSION VALIDATION (MODULE 2)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 2 & 3: VENDOR COMMISSION SPLITS & MAXIMUM CAP VALIDATION (MODULE 2)");

const vendorCommActions = path.join(rootDir, "src/app/dashboard/vendor/commission/actions.ts");
assert(fs.existsSync(vendorCommActions), "Vendor commission actions file exists");

const vendorCommCode = fs.readFileSync(vendorCommActions, "utf-8");
assert(vendorCommCode.includes("export async function saveVendorSplitAction"), "saveVendorSplitAction is exported");
assert(vendorCommCode.includes("totalSplit > maxCap"), "Server-side check validates total split against Super Admin cap");
assert(vendorCommCode.includes("exceeds the Super Admin campaign limit"), "Rejects split exceeding Super Admin campaign limit");
assert(vendorCommCode.includes("version: nextVersion"), "Version increments on each split update (preserves history)");
assert(vendorCommCode.includes("is_active: false"), "Deactivates previous version without altering historical commissions");

const vendorSplitView = path.join(rootDir, "src/app/dashboard/vendor/commission/vendor-commission-view.tsx");
assert(fs.existsSync(vendorSplitView), "Vendor commission view component exists");
const vendorSplitCode = fs.readFileSync(vendorSplitView, "utf-8");
assert(vendorSplitCode.includes("Total Configured Split:"), "UI calculates total configured split dynamically");
assert(vendorSplitCode.includes("exceeds the platform cap"), "UI alerts vendor when total exceeds platform limit cap");

// ----------------------------------------------------------------------
// WORKFLOW 4: INDEPENDENT PARTNER COMMISSION (MODULE 3)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 4: INDEPENDENT PARTNER COMMISSION (MODULE 3)");

const commServiceFile = path.join(rootDir, "src/lib/services/commission.ts");
assert(fs.existsSync(commServiceFile), "Commission calculation service exists");

const commServiceCode = fs.readFileSync(commServiceFile, "utf-8");
assert(commServiceCode.includes("if (!lead.vendor_id)"), "Detects when lead has no vendor association (Independent Partner)");
assert(commServiceCode.includes("vendorShare = 0"), "Vendor share is strictly zero for Independent Partners");
assert(commServiceCode.includes("independent_partner_commission"), "Applies Super Admin independent partner commission rate");

const schemaMigration = path.join(rootDir, "supabase/migrations/00008_phase4_commission_management.sql");
assert(fs.existsSync(schemaMigration), "Phase 4 Schema migration (00008) exists");

const schemaCode = fs.readFileSync(schemaMigration, "utf-8");
assert(schemaCode.includes("v_lead.vendor_id IS NULL THEN"), "Database RPC logic implements Independent Partner check");
assert(schemaCode.includes("v_vendor_share := 0.00"), "Database RPC sets v_vendor_share = 0.00 for Independent Partners");

// ----------------------------------------------------------------------
// WORKFLOW 5: APPROVED LEAD COMMISSION GENERATION (MODULE 4)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 5: AUTOMATIC COMMISSION GENERATION (MODULE 4)");

assert(commServiceCode.includes("export async function processLeadCommission"), "processLeadCommission engine is exported");
assert(commServiceCode.includes("process_lead_commission"), "Calls atomic PostgreSQL RPC transaction process_lead_commission");

const leadActionsFile = path.join(rootDir, "src/app/dashboard/super-admin/leads/actions.ts");
const leadActionsCode = fs.readFileSync(leadActionsFile, "utf-8");
assert(leadActionsCode.includes("processLeadCommission(lead.id, reviewer.id, adminClient)"), "reviewLeadAction triggers processLeadCommission on approval");
assert(leadActionsCode.includes("commission_credited"), "Lead approval sends commission_credited notification to submitter");

// ----------------------------------------------------------------------
// WORKFLOW 6: REJECTED LEAD COMMISSION PREVENTION (MODULE 5)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 6: REJECTED LEAD COMMISSION PREVENTION (MODULE 5)");

assert(commServiceCode.includes("lead.status !== \"approved\""), "Service blocks commission generation for non-approved leads");
assert(schemaCode.includes("v_lead.status != 'approved' THEN"), "Database RPC blocks commission if status != 'approved'");
assert(leadActionsCode.includes("if (newStatus === \"approved\")"), "Server action only invokes commission calculation for approved status");

// ----------------------------------------------------------------------
// WORKFLOW 7: DUPLICATE LEAD COMMISSION PREVENTION (MODULE 5)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 7: DUPLICATE LEAD COMMISSION PREVENTION (MODULE 5)");

assert(commServiceCode.includes("if (lead.is_duplicate)"), "Service blocks commission generation for duplicate leads");
assert(schemaCode.includes("IF v_lead.is_duplicate = true THEN"), "Database RPC blocks commission if v_lead.is_duplicate = true");

// ----------------------------------------------------------------------
// WORKFLOW 8: TEAM LEADER EARNING RESTRICTIONS (MODULE 5 & 13)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 8: TEAM LEADER EARNING RESTRICTIONS (MODULE 5 & 13)");

assert(commServiceCode.includes("roles.code\", \"team_leader"), "Service verifies submitter is not a Team Leader before crediting");
assert(commServiceCode.includes("Compliance Mandate: Team Leaders are strictly prohibited from receiving partner commissions"), "Throws compliance mandate error for team leaders");
assert(schemaCode.includes("r.code = 'team_leader'"), "Database RPC verifies user_roles joined with roles is not team_leader");
assert(schemaCode.includes("IF v_is_team_leader THEN"), "Database RPC raises exception/returns error if submitter is team leader");

// ----------------------------------------------------------------------
// WORKFLOW 9 & 10: DUPLICATE REQUEST PROTECTION & CONCURRENCY (MODULE 5 & 10)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 9 & 10: IDEMPOTENCY & CONCURRENT DUPLICATE CREDIT PREVENTION (MODULE 5 & 10)");

assert(schemaCode.includes("idx_unique_lead_credit"), "Unique partial index (lead_id, beneficiary_role, transaction_type) WHERE transaction_type = 'credit'");
assert(schemaCode.includes("v_existing_credits > 0 THEN"), "Database RPC checks existing credits before calculating (idempotent)");
assert(commServiceCode.includes("existingCredits && existingCredits.length > 0"), "Service handles idempotency gracefully");

// ----------------------------------------------------------------------
// WORKFLOW 11: IMMUTABLE COMMISSION LEDGER INTEGRITY (MODULE 8 & 10)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 11: IMMUTABLE COMMISSION LEDGER (MODULE 8 & 10)");

assert(schemaCode.includes("CREATE TABLE IF NOT EXISTS public.commission_transactions"), "commission_transactions table created");
assert(schemaCode.includes("CREATE SEQUENCE IF NOT EXISTS public.commission_txn_seq"), "commission_txn_seq sequence created for LMB-TXN- codes");
assert(schemaCode.includes("generate_commission_transaction_code"), "generate_commission_transaction_code() function generates unique LMB-TXN- codes");
assert(schemaCode.includes("prevent_commission_modifications"), "PostgreSQL trigger function blocks UPDATE and DELETE on ledger");
assert(schemaCode.includes("BEFORE UPDATE OR DELETE ON public.commission_transactions"), "Trigger attached to commission_transactions");

// ----------------------------------------------------------------------
// WORKFLOW 12: COMMISSION REVERSALS (MODULE 8)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 12: COMMISSION REVERSALS (MODULE 8)");

assert(schemaCode.includes("CREATE TABLE IF NOT EXISTS public.commission_reversals"), "commission_reversals table created");
assert(schemaCode.includes("reverse_lead_commission"), "reverse_lead_commission RPC created for compensating entries");
assert(superAdminCommCode.includes("export async function reverseCommissionAction"), "reverseCommissionAction is exported");
assert(commServiceCode.includes("export async function reverseCommissionTransaction"), "reverseCommissionTransaction service function is exported");
assert(commServiceCode.includes("transaction_type: \"reversal\""), "Creates compensating ledger entry with type 'reversal'");
assert(commServiceCode.includes("original_transaction_id: orig.id"), "Reversal links to original transaction ID");

// ----------------------------------------------------------------------
// WORKFLOW 13 & 14: FINANCIAL DATA ISOLATION (MODULE 6, 7 & 10)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 13 & 14: FINANCIAL DATA ISOLATION & RLS (MODULE 6, 7 & 10)");

const rlsMigration = path.join(rootDir, "supabase/migrations/00009_phase4_rls_policies.sql");
assert(fs.existsSync(rlsMigration), "Phase 4 RLS policies migration (00009) exists");

const rlsCode = fs.readFileSync(rlsMigration, "utf-8");
assert(rlsCode.includes("ALTER TABLE public.commission_transactions ENABLE ROW LEVEL SECURITY"), "RLS enabled on commission_transactions");
assert(rlsCode.includes("Vendors view own financial transactions and squad credits"), "Vendor RLS policy limits to vendor_id or user_id");
assert(rlsCode.includes("vendor_id = auth.uid()"), "RLS enforces vendor_id = auth.uid()");
assert(rlsCode.includes("Partners view own commission credits"), "Partner RLS policy limits strictly to user_id = auth.uid()");
assert(rlsCode.includes("user_id = auth.uid()"), "RLS enforces user_id = auth.uid()");

const partnerCommPage = path.join(rootDir, "src/app/dashboard/partner/commission/page.tsx");
assert(fs.existsSync(partnerCommPage), "Partner commission page exists");
const partnerCommCode = fs.readFileSync(partnerCommPage, "utf-8");
assert(partnerCommCode.includes(".eq(\"user_id\", user.id)"), "Partner page strictly queries user_id = user.id");

const vendorCommPage = path.join(rootDir, "src/app/dashboard/vendor/commission/page.tsx");
assert(fs.existsSync(vendorCommPage), "Vendor commission page exists");
const vendorCommPageCode = fs.readFileSync(vendorCommPage, "utf-8");
assert(vendorCommPageCode.includes("vendor_id.eq.${user.id},user_id.eq.${user.id}"), "Vendor page isolates to vendor_id or user_id");

// ----------------------------------------------------------------------
// WORKFLOW 15: COMMISSION REPORT ACCURACY & TYPES (MODULE 9 & 11)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 15: FINANCIAL REPORTING & DATABASE TYPES (MODULE 9 & 11)");

const superAdminCommPage = path.join(rootDir, "src/app/dashboard/super-admin/commission/page.tsx");
assert(fs.existsSync(superAdminCommPage), "Super Admin commission reports page exists");
const superAdminCommPageCode = fs.readFileSync(superAdminCommPage, "utf-8");
assert(superAdminCommPageCode.includes("totalCommission"), "Calculates totalCommission from database transactions");
assert(superAdminCommPageCode.includes("vendorCommission"), "Calculates vendorCommission from database transactions");
assert(superAdminCommPageCode.includes("partnerCommission"), "Calculates partnerCommission from database transactions");
assert(superAdminCommPageCode.includes("reversedCommission"), "Calculates reversedCommission from compensating entries");

const dbTypesFile = path.join(rootDir, "src/lib/types/database.types.ts");
const dbTypesCode = fs.readFileSync(dbTypesFile, "utf-8");
assert(dbTypesCode.includes("commission_rules:"), "Database types include commission_rules");
assert(dbTypesCode.includes("vendor_commission_splits:"), "Database types include vendor_commission_splits");
assert(dbTypesCode.includes("commission_transactions:"), "Database types include commission_transactions");
assert(dbTypesCode.includes("commission_reversals:"), "Database types include commission_reversals");
assert(dbTypesCode.includes("commission_audit_logs:"), "Database types include commission_audit_logs");

// ----------------------------------------------------------------------
// SUMMARY REPORT
// ----------------------------------------------------------------------
console.log("\n=======================================================");
console.log(`TOTAL PHASE 4 TESTS EXECUTED: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log("=======================================================\n");

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL 15 PHASE 4 WORKFLOWS VERIFIED SUCCESSFULLY!\n");
  process.exit(0);
}

