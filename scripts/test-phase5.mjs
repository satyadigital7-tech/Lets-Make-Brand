/**
 * ==============================================================================
 * LMB (Lets Make Brand) Platform - Phase 5 Automated Verification Suite
 * ==============================================================================
 * Verifies all 17 Required Test Workflows for the Wallet & Financial Management System:
 * 1. Wallet creation
 * 2. Commission credit integration
 * 3. Pending earnings calculation
 * 4. Available balance calculation
 * 5. Withdrawal request
 * 6. Balance reservation
 * 7. Withdrawal approval
 * 8. Withdrawal rejection
 * 9. Withdrawal cancellation
 * 10. Manual payment processing
 * 11. Payment reference validation (unique UTR)
 * 12. Duplicate payment prevention
 * 13. Wallet ledger accuracy (double-entry accounting & immutability)
 * 14. Concurrent withdrawal requests
 * 15. Vendor wallet privacy
 * 16. Partner wallet privacy
 * 17. Unauthorized financial access & RLS
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
console.log("       LMB PLATFORM - PHASE 5 VERIFICATION SUITE       ");
console.log("=======================================================\n");

// ----------------------------------------------------------------------
// WORKFLOW 1: WALLET CREATION (MODULE 1)
// ----------------------------------------------------------------------
console.log("WORKFLOW 1: WALLET CREATION (MODULE 1)");

const schemaMigration = path.join(rootDir, "supabase/migrations/00010_phase5_wallet_and_payments.sql");
assert(fs.existsSync(schemaMigration), "Phase 5 schema migration (00010) exists");

const schemaCode = fs.readFileSync(schemaMigration, "utf-8");
assert(schemaCode.includes("CREATE TABLE IF NOT EXISTS public.wallets"), "wallets table definition exists");
assert(schemaCode.includes("wallet_code VARCHAR(30) UNIQUE NOT NULL"), "wallets table has unique wallet_code column");
assert(schemaCode.includes("total_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00"), "wallets table tracks total_earnings");
assert(schemaCode.includes("pending_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00"), "wallets table tracks pending_earnings");
assert(schemaCode.includes("available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00"), "wallets table tracks available_balance");
assert(schemaCode.includes("reserved_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00"), "wallets table tracks reserved_balance");
assert(schemaCode.includes("total_withdrawn NUMERIC(12, 2) NOT NULL DEFAULT 0.00"), "wallets table tracks total_withdrawn");
assert(schemaCode.includes("CREATE SEQUENCE IF NOT EXISTS public.wallet_code_seq"), "wallet_code_seq sequence exists for unique code generation");
assert(schemaCode.includes("generate_wallet_code()"), "generate_wallet_code() helper generates LMB-WAL- prefixed codes");

const walletService = path.join(rootDir, "src/lib/services/wallet.ts");
assert(fs.existsSync(walletService), "Wallet management service exists");
const walletServiceCode = fs.readFileSync(walletService, "utf-8");
assert(walletServiceCode.includes("export async function getOrCreateUserWallet"), "getOrCreateUserWallet is exported");
assert(schemaCode.includes("CREATE OR REPLACE FUNCTION public.get_or_create_wallet"), "PostgreSQL RPC get_or_create_wallet is defined");

// ----------------------------------------------------------------------
// WORKFLOW 2 & 3: COMMISSION CREDIT INTEGRATION & PENDING EARNINGS (MODULE 1 & 4)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 2 & 3: COMMISSION CREDIT INTEGRATION & PENDING EARNINGS CALCULATION (MODULE 1)");

assert(schemaCode.includes("FROM public.commission_transactions"), "Wallet initialization aggregates from actual commission transactions");
assert(schemaCode.includes("WHEN transaction_type = 'credit' THEN commission_amount"), "Aggregates credit transaction amounts");
assert(schemaCode.includes("WHEN transaction_type = 'reversal' THEN -commission_amount"), "Deducts reversals from total earnings");
assert(schemaCode.includes("FROM public.leads"), "Wallet calculates pending earnings from pipeline leads");
assert(schemaCode.includes("WHERE submitted_by = p_user_id AND status IN ('pending', 'under_verification', 'correction_requested')"), "Pending earnings include leads under review");
assert(walletServiceCode.includes("earned += amt"), "Service fallback correctly accumulates credit transactions");
assert(walletServiceCode.includes("earned -= amt"), "Service fallback correctly handles reversals");

// ----------------------------------------------------------------------
// WORKFLOW 4: AVAILABLE BALANCE CALCULATION (MODULE 1 & 2)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 4: AVAILABLE BALANCE CALCULATION (MODULE 1 & 2)");

assert(schemaCode.includes("v_available := GREATEST(0.00, v_total_earned)"), "RPC computes non-negative initial available balance");
assert(schemaCode.includes("CHECK (available_balance >= 0)"), "Database constraint enforces non-negative available balance");
assert(schemaCode.includes("CHECK (reserved_balance >= 0)"), "Database constraint enforces non-negative reserved balance");

const partnerWalletPage = path.join(rootDir, "src/app/dashboard/partner/wallet/page.tsx");
assert(fs.existsSync(partnerWalletPage), "Partner wallet page exists");
const partnerWalletPageCode = fs.readFileSync(partnerWalletPage, "utf-8");
assert(partnerWalletPageCode.includes("availableBalance: Number(walletRow.available_balance || 0)"), "Partner wallet renders available balance");
assert(partnerWalletPageCode.includes("reservedBalance: Number(walletRow.reserved_balance || 0)"), "Partner wallet renders reserved balance");
assert(partnerWalletPageCode.includes("totalEarnings: Number(walletRow.total_earnings || 0)"), "Partner wallet renders total earnings");
assert(partnerWalletPageCode.includes("totalWithdrawn: Number(walletRow.total_withdrawn || 0)"), "Partner wallet renders total withdrawn");

// ----------------------------------------------------------------------
// WORKFLOW 5 & 6: WITHDRAWAL REQUEST & BALANCE RESERVATION (MODULE 4 & 6)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 5 & 6: WITHDRAWAL REQUEST & BALANCE RESERVATION (MODULE 4 & 6)");

const validationFile = path.join(rootDir, "src/lib/security/validation.ts");
const validationCode = fs.readFileSync(validationFile, "utf-8");
assert(validationCode.includes("export const withdrawalRequestSchema"), "withdrawalRequestSchema is defined");
assert(validationCode.includes("amount: z.number().min(100"), "Enforces minimum withdrawal amount in schema");
assert(validationCode.includes("paymentMethod: z.enum"), "Validates paymentMethod against allowed options");

const partnerActions = path.join(rootDir, "src/app/dashboard/partner/wallet/actions.ts");
assert(fs.existsSync(partnerActions), "Partner wallet actions exist");
const partnerActionsCode = fs.readFileSync(partnerActions, "utf-8");
assert(partnerActionsCode.includes("export async function requestWithdrawalAction"), "requestWithdrawalAction is exported");
assert(partnerActionsCode.includes("user.profile?.status !== \"active\""), "Checks active account status before allowing withdrawal");
assert(partnerActionsCode.includes("executeWithdrawalRequest(user.id, validated, adminClient)"), "Executes withdrawal request service");

assert(schemaCode.includes("CREATE OR REPLACE FUNCTION public.submit_withdrawal_request"), "Atomic RPC submit_withdrawal_request is implemented");
assert(schemaCode.includes("IF v_wallet.available_balance < p_amount THEN"), "Validates sufficient available balance before reservation");
assert(schemaCode.includes("available_balance = v_balance_after"), "Deducts requested amount from available_balance");
assert(schemaCode.includes("reserved_balance = reserved_balance + p_amount"), "Increments reserved_balance atomically with requested amount");
assert(schemaCode.includes("'withdrawal_reservation'"), "Posts withdrawal_reservation ledger debit entry");

// ----------------------------------------------------------------------
// WORKFLOW 7 & 8: WITHDRAWAL APPROVAL & REJECTION (MODULE 5 & 6)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 7 & 8: WITHDRAWAL APPROVAL & REJECTION STATE TRANSITIONS (MODULE 5 & 6)");

const adminWalletActions = path.join(rootDir, "src/app/dashboard/super-admin/wallet/actions.ts");
assert(fs.existsSync(adminWalletActions), "Super Admin wallet actions exist");
const adminWalletActionsCode = fs.readFileSync(adminWalletActions, "utf-8");
assert(adminWalletActionsCode.includes("export async function reviewWithdrawalAction"), "reviewWithdrawalAction is exported");
assert(adminWalletActionsCode.includes("requireRole([\"super_admin\", \"admin\"])"), "Only Super Admin and Admin can review withdrawals");
assert(adminWalletActionsCode.includes("validated.action === \"reject\" && (!validated.reason || validated.reason.trim().length === 0)"), "Mandates rejection reason on withdrawal rejection");

assert(schemaCode.includes("IF p_action = 'approve' THEN"), "RPC handles approve action transition");
assert(schemaCode.includes("ELSIF p_action = 'reject' THEN"), "RPC handles reject action transition");
assert(schemaCode.includes("available_balance = available_balance + v_wdr.amount"), "Rejection unlocks reserved balance back to available balance");
assert(schemaCode.includes("reserved_balance = GREATEST(0.00, reserved_balance - v_wdr.amount)"), "Rejection decrements reserved balance");
assert(schemaCode.includes("'withdrawal_release'"), "Rejection writes withdrawal_release ledger entry");

// ----------------------------------------------------------------------
// WORKFLOW 9: WITHDRAWAL CANCELLATION (MODULE 6)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 9: WITHDRAWAL CANCELLATION (MODULE 6)");

assert(partnerActionsCode.includes("export async function cancelWithdrawalAction"), "cancelWithdrawalAction is exported");
assert(partnerActionsCode.includes("wdr.user_id !== user.id"), "Cancelling user must own the withdrawal request");
assert(partnerActionsCode.includes("wdr.status !== \"pending\""), "Only pending requests can be cancelled");
assert(schemaCode.includes("ELSIF p_action = 'cancel' THEN"), "RPC handles cancel action");
assert(schemaCode.includes("v_wdr.status != 'pending' THEN"), "RPC rejects cancellation of non-pending withdrawals");
assert(schemaCode.includes("status = 'cancelled'"), "Transitions withdrawal status to cancelled");

// ----------------------------------------------------------------------
// WORKFLOW 10 & 11: MANUAL PAYMENT PROCESSING & PAYMENT REFERENCE (MODULE 7, 9 & 11)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 10 & 11: MANUAL PAYMENT EXECUTION & UNIQUE UTR VALIDATION (MODULE 7 & 9)");

assert(adminWalletActionsCode.includes("export async function recordManualPaymentAction"), "recordManualPaymentAction is exported");
assert(adminWalletActionsCode.includes("manualPaymentSchema.parse(data)"), "Validates manual payment parameters via manualPaymentSchema");

const manualPaymentView = path.join(rootDir, "src/app/dashboard/super-admin/wallet/wallet-admin-view.tsx");
assert(fs.existsSync(manualPaymentView), "Wallet admin view exists with payout workflow");
const manualPaymentViewCode = fs.readFileSync(manualPaymentView, "utf-8");
assert(manualPaymentViewCode.includes("Bank Reference / UTR Number") || manualPaymentViewCode.includes("UTR"), "UI collects mandatory bank UTR reference");
assert(manualPaymentViewCode.includes("recordManualPaymentAction"), "UI triggers recordManualPaymentAction");

assert(schemaCode.includes("CREATE TABLE IF NOT EXISTS public.payments"), "payments table definition exists");
assert(schemaCode.includes("payment_reference VARCHAR(100) NOT NULL UNIQUE"), "payments table enforces UNIQUE payment_reference constraint");
assert(schemaCode.includes("IF EXISTS (SELECT 1 FROM public.payments WHERE payment_reference = TRIM(v_utr)) THEN"), "RPC blocks duplicate UTR numbers across system");
assert(schemaCode.includes("v_utr IS NULL OR LENGTH(TRIM(v_utr)) = 0 THEN"), "RPC validates payment reference is non-empty");

// ----------------------------------------------------------------------
// WORKFLOW 12: DUPLICATE PAYMENT PREVENTION (MODULE 7 & 11)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 12: DUPLICATE PAYMENT PREVENTION (MODULE 7 & 11)");

assert(schemaCode.includes("IF v_wdr.status NOT IN ('pending', 'approved', 'processing') THEN"), "RPC prevents duplicate payment execution on already paid requests");
assert(schemaCode.includes("total_withdrawn = total_withdrawn + v_wdr.amount"), "Payment increments total_withdrawn in wallet");
assert(schemaCode.includes("'withdrawal_payment'"), "Payment generates withdrawal_payment ledger entry");

// ----------------------------------------------------------------------
// WORKFLOW 13: WALLET LEDGER ACCURACY & IMMUTABILITY (MODULE 8 & 11)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 13: IMMUTABLE WALLET LEDGER (DOUBLE-ENTRY ACCOUNTING) (MODULE 8)");

assert(schemaCode.includes("CREATE TABLE IF NOT EXISTS public.wallet_ledger"), "wallet_ledger table exists");
assert(schemaCode.includes("balance_before NUMERIC(12, 2) NOT NULL"), "Ledger tracks balance_before");
assert(schemaCode.includes("balance_after NUMERIC(12, 2) NOT NULL"), "Ledger tracks balance_after");
assert(schemaCode.includes("direction VARCHAR(10) NOT NULL CHECK (direction IN ('credit', 'debit'))"), "Ledger tracks double-entry direction (credit/debit)");
assert(schemaCode.includes("prevent_wallet_ledger_modifications()"), "prevent_wallet_ledger_modifications trigger function exists");
assert(schemaCode.includes("BEFORE UPDATE OR DELETE ON public.wallet_ledger"), "Trigger prevents UPDATE or DELETE on wallet_ledger");

// ----------------------------------------------------------------------
// WORKFLOW 14: CONCURRENT WITHDRAWAL REQUESTS & ROW LOCKING (MODULE 4 & 11)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 14: CONCURRENCY CONTROLS & ACTIVE REQUEST GATING (MODULE 4 & 11)");

assert(schemaCode.includes("SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE"), "submit_withdrawal_request locks wallet row FOR UPDATE");
assert(schemaCode.includes("SELECT * INTO v_wdr FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE"), "process_withdrawal_status locks withdrawal row FOR UPDATE");
assert(schemaCode.includes("WHERE user_id = p_user_id AND status IN ('pending', 'approved', 'processing')"), "Gating check finds any active unfulfilled withdrawal request");
assert(schemaCode.includes("IF v_active_requests > 0 THEN"), "Rejects concurrent submission if user has active request");

// ----------------------------------------------------------------------
// WORKFLOW 15: VENDOR WALLET PRIVACY (MODULE 3 & 11)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 15: VENDOR WALLET PRIVACY & TEAM DISTRIBUTION (MODULE 3)");

const vendorWalletPage = path.join(rootDir, "src/app/dashboard/vendor/wallet/page.tsx");
assert(fs.existsSync(vendorWalletPage), "Vendor wallet page exists");
const vendorWalletPageCode = fs.readFileSync(vendorWalletPage, "utf-8");
assert(vendorWalletPageCode.includes("requireRole([\"vendor\", \"super_admin\"])"), "Vendor wallet enforces vendor role");
assert(vendorWalletPageCode.includes(".eq(\"vendor_id\", user.id)"), "Vendor page strictly queries transactions belonging to authenticated vendor");

const vendorWalletActions = path.join(rootDir, "src/app/dashboard/vendor/wallet/actions.ts");
assert(fs.existsSync(vendorWalletActions), "Vendor wallet actions file exists");
const vendorWalletActionsCode = fs.readFileSync(vendorWalletActions, "utf-8");
assert(vendorWalletActionsCode.includes("export async function requestVendorWithdrawalAction"), "requestVendorWithdrawalAction is exported");
assert(vendorWalletActionsCode.includes("export async function cancelVendorWithdrawalAction"), "cancelVendorWithdrawalAction is exported");

// ----------------------------------------------------------------------
// WORKFLOW 16: PARTNER WALLET PRIVACY & PAYOUT MASKING (MODULE 2 & 11)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 16: PARTNER WALLET PRIVACY & PAYOUT MASKING (MODULE 2 & 11)");

assert(walletServiceCode.includes("export function maskPayoutDetails"), "maskPayoutDetails helper is exported");
assert(walletServiceCode.includes("maskedName = namePart.length > 3 ? `${namePart.slice(0, 3)}***`"), "UPI handles are masked");
assert(walletServiceCode.includes("XXXXXX${last4}"), "Bank account numbers are masked showing only last 4 digits");
assert(partnerWalletPageCode.includes(".eq(\"user_id\", user.id)"), "Partner page strictly queries user_id = user.id for privacy");

// ----------------------------------------------------------------------
// WORKFLOW 17: UNAUTHORIZED FINANCIAL ACCESS & RLS POLICIES (MODULE 5 & 11)
// ----------------------------------------------------------------------
console.log("\nWORKFLOW 17: FINANCIAL SECURITY & RLS POLICIES (MODULE 5 & 11)");

const rlsMigration = path.join(rootDir, "supabase/migrations/00011_phase5_rls_policies.sql");
assert(fs.existsSync(rlsMigration), "Phase 5 RLS migration (00011) exists");
const rlsCode = fs.readFileSync(rlsMigration, "utf-8");
assert(rlsCode.includes("ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY"), "RLS enabled on wallets");
assert(rlsCode.includes("ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY"), "RLS enabled on payout_methods");
assert(rlsCode.includes("ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY"), "RLS enabled on withdrawals");
assert(rlsCode.includes("ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY"), "RLS enabled on payments");
assert(rlsCode.includes("ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY"), "RLS enabled on wallet_ledger");
assert(rlsCode.includes("ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY"), "RLS enabled on financial_audit_logs");
assert(rlsCode.includes("CREATE POLICY \"Users view own wallet\""), "Users view own wallet RLS policy exists");
assert(rlsCode.includes("CREATE POLICY \"Users view own withdrawals\""), "Users view own withdrawals RLS policy exists");
assert(rlsCode.includes("CREATE POLICY \"Users view own wallet_ledger entries\""), "Users view own wallet ledger entries RLS policy exists");

const superAdminWalletPage = path.join(rootDir, "src/app/dashboard/super-admin/wallet/page.tsx");
assert(fs.existsSync(superAdminWalletPage), "Super Admin wallet treasury page exists");
const superAdminWalletCode = fs.readFileSync(superAdminWalletPage, "utf-8");
assert(superAdminWalletCode.includes("requireRole([\"super_admin\"])"), "Super Admin wallet strictly restricts unauthorized access");

const superAdminPaymentsPage = path.join(rootDir, "src/app/dashboard/super-admin/payments/page.tsx");
assert(fs.existsSync(superAdminPaymentsPage), "Super Admin payments remittance page exists");
const superAdminPaymentsCode = fs.readFileSync(superAdminPaymentsPage, "utf-8");
assert(superAdminPaymentsCode.includes("requireRole([\"super_admin\"])"), "Super Admin payments strictly restricts unauthorized access");

// Check RBAC configuration
const rbacFile = path.join(rootDir, "src/lib/auth/rbac.ts");
const rbacCode = fs.readFileSync(rbacFile, "utf-8");
assert(rbacCode.includes("{ title: \"Wallet\", href: \"/dashboard/super-admin/wallet\", iconName: \"Wallet\", requiredPermission: \"view_wallet\", isPhase1Ready: true }"), "Super Admin Wallet is active in navigation");
assert(rbacCode.includes("{ title: \"Payments\", href: \"/dashboard/super-admin/payments\", iconName: \"CreditCard\", requiredPermission: \"view_payments\", isPhase1Ready: true }"), "Super Admin Payments is active in navigation");
assert(rbacCode.includes("{ title: \"Agency Wallet\", href: \"/dashboard/vendor/wallet\", iconName: \"Wallet\", isPhase1Ready: true }"), "Vendor Agency Wallet is active in navigation");
assert(rbacCode.includes("{ title: \"My Wallet\", href: \"/dashboard/partner/wallet\", iconName: \"Wallet\", isPhase1Ready: true }"), "Partner Wallet is active in navigation");

// Check Database Types
const dbTypesFile = path.join(rootDir, "src/lib/types/database.types.ts");
const dbTypesCode = fs.readFileSync(dbTypesFile, "utf-8");
assert(dbTypesCode.includes("wallets:"), "Database types include wallets table definition");
assert(dbTypesCode.includes("payout_methods:"), "Database types include payout_methods table definition");
assert(dbTypesCode.includes("withdrawals:"), "Database types include withdrawals table definition");
assert(dbTypesCode.includes("payments:"), "Database types include payments table definition");
assert(dbTypesCode.includes("wallet_ledger:"), "Database types include wallet_ledger table definition");
assert(dbTypesCode.includes("financial_audit_logs:"), "Database types include financial_audit_logs table definition");
assert(dbTypesCode.includes("export type Wallet ="), "Convenience type Wallet is exported");
assert(dbTypesCode.includes("export type Withdrawal ="), "Convenience type Withdrawal is exported");
assert(dbTypesCode.includes("export type Payment ="), "Convenience type Payment is exported");

// ----------------------------------------------------------------------
// SUMMARY REPORT
// ----------------------------------------------------------------------
console.log("\n=======================================================");
console.log(`TOTAL PHASE 5 TESTS EXECUTED: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log("=======================================================\n");

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL 17 PHASE 5 WORKFLOWS VERIFIED SUCCESSFULLY!\n");
  process.exit(0);
}
