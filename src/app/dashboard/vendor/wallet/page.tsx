import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { VendorWalletView } from "./vendor-wallet-view";
import { getOrCreateUserWallet, maskPayoutDetails } from "@/lib/services/wallet";
import {
  WalletData,
  WithdrawalItem,
  WalletLedgerRow,
  PayoutMethodItem,
} from "@/app/dashboard/partner/wallet/partner-wallet-view";

export const dynamic = "force-dynamic";

export default async function VendorWalletPage() {
  const user = await requireRole(["vendor", "super_admin"]);
  const adminClient = createAdminClient();

  // 1. Get or create corporate vendor wallet
  const walletRow = await getOrCreateUserWallet(user.id, "vendor", adminClient);

  const wallet: WalletData = {
    id: walletRow.id,
    walletCode: walletRow.wallet_code,
    totalEarnings: Number(walletRow.total_earnings || 0),
    pendingEarnings: Number(walletRow.pending_earnings || 0),
    availableBalance: Number(walletRow.available_balance || 0),
    reservedBalance: Number(walletRow.reserved_balance || 0),
    totalWithdrawn: Number(walletRow.total_withdrawn || 0),
    currency: walletRow.currency || "INR",
    status: walletRow.status || "active",
  };

  // 2. Fetch Payout Methods
  const { data: methodsData } = await adminClient
    .from("payout_methods")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  const payoutMethods: PayoutMethodItem[] = ((methodsData as any[]) || []).map((m: any) => ({
    id: m.id,
    type: m.type,
    isDefault: m.is_default,
    upiId: m.upi_id,
    accountHolderName: m.account_holder_name,
    accountNumber: m.account_number,
    ifscCode: m.ifsc_code,
    bankName: m.bank_name,
  }));

  // 3. Fetch Withdrawals
  const { data: wdrData } = await adminClient
    .from("withdrawals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const withdrawals: WithdrawalItem[] = ((wdrData as any[]) || []).map((w: any) => ({
    id: w.id,
    withdrawalCode: w.withdrawal_code,
    amount: Number(w.amount),
    paymentMethod: w.payment_method,
    maskedDetails: maskPayoutDetails(w.payout_details),
    status: w.status,
    rejectionReason: w.rejection_reason,
    adminRemarks: w.admin_remarks,
    createdAt: w.created_at,
  }));

  // 4. Fetch Wallet Ledger
  const { data: ledgerData } = await adminClient
    .from("wallet_ledger")
    .select("*")
    .eq("wallet_id", wallet.id)
    .order("created_at", { ascending: false });

  const ledger: WalletLedgerRow[] = ((ledgerData as any[]) || []).map((l: any) => ({
    id: l.id,
    ledgerCode: l.ledger_code,
    transactionType: l.transaction_type,
    amount: Number(l.amount),
    direction: l.direction,
    balanceBefore: Number(l.balance_before),
    balanceAfter: Number(l.balance_after),
    referenceId: l.reference_id,
    description: l.description,
    createdAt: l.created_at,
  }));

  // 5. Calculate team distributed amount
  const { data: teamTxns } = await adminClient
    .from("commission_transactions")
    .select("commission_amount")
    .eq("vendor_id", user.id)
    .eq("beneficiary_role", "partner")
    .eq("commission_status", "approved");

  let teamDistributedAmount = 0;
  for (const tx of (teamTxns as any[]) || []) {
    teamDistributedAmount += Number(tx.commission_amount || 0);
  }

  // 6. Minimum threshold
  const minThreshold = 1000; // Default corporate minimum

  return (
    <div className="space-y-6">
      <PageHeader
        title="Corporate Agency Wallet & Settlements"
        description="Manage corporate override accruals, track squad distribution volumes, and request banking settlements."
        badge="Vendor Workspace"
      />

      <VendorWalletView
        wallet={wallet}
        payoutMethods={payoutMethods}
        withdrawals={withdrawals}
        ledger={ledger}
        teamDistributedAmount={teamDistributedAmount}
        minThreshold={minThreshold}
      />
    </div>
  );
}
