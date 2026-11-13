import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";

export interface WalletReconciliationResult {
  walletId: string;
  userId: string;
  isConsistent: boolean;
  totalEarnings: number;
  availableBalance: number;
  reservedBalance: number;
  totalWithdrawn: number;
  computedAvailable: number;
  expectedReserved: number;
  discrepancies: string[];
}

export interface CommissionAuditResult {
  totalLeadsAudited: number;
  validLeads: number;
  violations: Array<{
    leadId: string;
    leadCode?: string;
    campaignId: string;
    maxAllowedCommission: number;
    actualTotalDistributed: number;
    vendorShare: number;
    partnerShare: number;
    discrepancy: string;
  }>;
  duplicateTransactionsFound: number;
}

export interface PlatformFinancialAuditReport {
  timestamp: string;
  totalWalletsAudited: number;
  consistentWallets: number;
  inconsistentWallets: number;
  walletDiscrepancies: WalletReconciliationResult[];
  commissionAudit: CommissionAuditResult;
  isAuditClean: boolean;
}

/**
 * Reconcile a single wallet against mathematical ledger balance rules and pending withdrawals.
 */
export async function reconcileSingleWallet(
  walletId: string,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<WalletReconciliationResult> {
  const discrepancies: string[] = [];

  const { data: wallet, error } = await adminClient
    .from("wallet_balances")
    .select("*")
    .eq("id", walletId)
    .single();

  if (error || !wallet) {
    return {
      walletId,
      userId: "unknown",
      isConsistent: false,
      totalEarnings: 0,
      availableBalance: 0,
      reservedBalance: 0,
      totalWithdrawn: 0,
      computedAvailable: 0,
      expectedReserved: 0,
      discrepancies: [`Wallet not found: ${error?.message || "Unknown error"}`],
    };
  }

  const totalEarnings = Number(wallet.total_earnings || 0);
  const availableBalance = Number(wallet.available_balance || 0);
  const reservedBalance = Number(wallet.reserved_balance || 0);
  const totalWithdrawn = Number(wallet.total_withdrawn || 0);

  // 1. Basic Balance Invariant: Total = Available + Reserved + Withdrawn
  const computedAvailable = Math.round((totalEarnings - reservedBalance - totalWithdrawn) * 100) / 100;
  if (Math.abs(availableBalance - computedAvailable) > 0.01) {
    discrepancies.push(
      `Mathematical mismatch: Available balance (₹${availableBalance}) does not equal total earnings (₹${totalEarnings}) minus reserved (₹${reservedBalance}) minus withdrawn (₹${totalWithdrawn}). Computed expected: ₹${computedAvailable}.`
    );
  }

  // 2. Non-negative Balances Rule
  if (availableBalance < 0) {
    discrepancies.push(`Severe violation: Negative available balance (₹${availableBalance})`);
  }
  if (reservedBalance < 0) {
    discrepancies.push(`Severe violation: Negative reserved balance (₹${reservedBalance})`);
  }
  if (totalEarnings < 0) {
    discrepancies.push(`Severe violation: Negative total earnings (₹${totalEarnings})`);
  }

  // 3. Verify Reserved Balance matches active Pending Withdrawals
  const { data: pendingRequests } = await adminClient
    .from("withdrawal_requests")
    .select("amount")
    .eq("wallet_id", walletId)
    .eq("status", "pending");

  const expectedReserved = Math.round(
    (pendingRequests || []).reduce((sum, req) => sum + Number(req.amount || 0), 0) * 100
  ) / 100;

  if (Math.abs(reservedBalance - expectedReserved) > 0.01) {
    discrepancies.push(
      `Reserved balance mismatch: Wallet reserved balance (₹${reservedBalance}) does not equal active pending withdrawals sum (₹${expectedReserved}).`
    );
  }

  return {
    walletId,
    userId: wallet.user_id,
    isConsistent: discrepancies.length === 0,
    totalEarnings,
    availableBalance,
    reservedBalance,
    totalWithdrawn,
    computedAvailable,
    expectedReserved,
    discrepancies,
  };
}

/**
 * Reconciles all platform wallets and verifies commission split rules.
 */
export async function runPlatformFinancialAudit(): Promise<PlatformFinancialAuditReport> {
  const adminClient = createAdminClient();
  const timestamp = new Date().toISOString();

  // 1. Audit all wallets
  const { data: wallets } = await adminClient.from("wallet_balances").select("id");
  const walletResults: WalletReconciliationResult[] = [];
  let consistentWallets = 0;
  let inconsistentWallets = 0;

  for (const w of wallets || []) {
    const res = await reconcileSingleWallet(w.id, adminClient);
    if (res.isConsistent) {
      consistentWallets++;
    } else {
      inconsistentWallets++;
      walletResults.push(res);
      logger.critical({
        message: `Wallet financial discrepancy on ${res.walletId}`,
        category: "financial",
        level: "critical",
        userId: res.userId,
        entityType: "WALLET_BALANCE",
        entityId: res.walletId,
        metadata: { discrepancies: res.discrepancies },
      });
    }
  }

  // 2. Audit Commission Splits vs Super Admin Campaign Limits
  const { data: commissions } = await adminClient
    .from("commission_transactions")
    .select(`
      id,
      lead_id,
      campaign_id,
      amount,
      partner_amount,
      vendor_amount
    `);

  const commissionAudit: CommissionAuditResult = {
    totalLeadsAudited: commissions?.length || 0,
    validLeads: 0,
    violations: [],
    duplicateTransactionsFound: 0,
  };

  const leadSeenMap = new Map<string, number>();

  for (const comm of commissions || []) {
    // Check for duplicate lead commission entries
    if (comm.lead_id) {
      const count = (leadSeenMap.get(comm.lead_id) || 0) + 1;
      leadSeenMap.set(comm.lead_id, count);
      if (count > 1) {
        commissionAudit.duplicateTransactionsFound++;
      }
    }

    // Verify against campaign max limit
    if (comm.campaign_id) {
      const { data: camp } = await adminClient
        .from("campaigns")
        .select("commission_rate, max_commission_amount")
        .eq("id", comm.campaign_id)
        .single();

      if (camp) {
        const maxLimit = Number(camp.max_commission_amount || camp.commission_rate || 0);
        const actualTotal = Number(comm.amount || (Number(comm.partner_amount || 0) + Number(comm.vendor_amount || 0)));

        if (maxLimit > 0 && actualTotal > maxLimit + 0.01) {
          commissionAudit.violations.push({
            leadId: comm.lead_id || "unknown",
            campaignId: comm.campaign_id,
            maxAllowedCommission: maxLimit,
            actualTotalDistributed: actualTotal,
            vendorShare: Number(comm.vendor_amount || 0),
            partnerShare: Number(comm.partner_amount || 0),
            discrepancy: `Distributed commission ₹${actualTotal} exceeds Super Admin configured campaign ceiling of ₹${maxLimit}`,
          });
        } else {
          commissionAudit.validLeads++;
        }
      }
    }
  }

  const isAuditClean =
    inconsistentWallets === 0 &&
    commissionAudit.violations.length === 0 &&
    commissionAudit.duplicateTransactionsFound === 0;

  return {
    timestamp,
    totalWalletsAudited: (wallets || []).length,
    consistentWallets,
    inconsistentWallets,
    walletDiscrepancies: walletResults,
    commissionAudit,
    isAuditClean,
  };
}
