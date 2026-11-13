"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  withdrawalReviewSchema,
  WithdrawalReviewFormData,
  manualPaymentSchema,
  ManualPaymentFormData,
} from "@/lib/security/validation";
import { executeWithdrawalStatus } from "@/lib/services/wallet";
import { logAuditEvent } from "@/lib/security/audit";

/**
 * Super Admin or authorized Admin reviews a withdrawal request (Module 5 & 6)
 */
export async function reviewWithdrawalAction(data: WithdrawalReviewFormData) {
  const user = await requireRole(["super_admin", "admin"]);
  const validated = withdrawalReviewSchema.parse(data);
  const adminClient = createAdminClient();

  if (validated.action === "reject" && (!validated.reason || validated.reason.trim().length === 0)) {
    throw new Error("A rejection reason is mandatory when rejecting a withdrawal request.");
  }

  const result = await executeWithdrawalStatus(
    validated.withdrawalId,
    validated.action,
    user.id,
    { rejection_reason: validated.reason?.trim() },
    adminClient
  );

  await logAuditEvent({
    userId: user.id,
    action: `WITHDRAWAL_${validated.action.toUpperCase()}`,
    entityType: "withdrawals",
    entityId: validated.withdrawalId,
    details: {
      action: validated.action,
      reason: validated.reason || null,
    },
  });

  revalidatePath("/dashboard/super-admin/wallet");
  revalidatePath("/dashboard/admin/wallet");
  revalidatePath("/dashboard/partner/wallet");
  revalidatePath("/dashboard/vendor/wallet");

  return result;
}

/**
 * Super Admin or authorized Admin records a manual payout (Module 7 & 9)
 * Transitions withdrawal to 'paid', debits reserved balance, records unique UTR in payments.
 */
export async function recordManualPaymentAction(data: ManualPaymentFormData) {
  const user = await requireRole(["super_admin", "admin"]);
  const validated = manualPaymentSchema.parse(data);
  const adminClient = createAdminClient();

  const result = await executeWithdrawalStatus(
    validated.withdrawalId,
    "mark_paid",
    user.id,
    {
      payment_reference: validated.paymentReference,
      payment_method: validated.paymentMethod,
      payment_date: validated.paymentDate || new Date().toISOString().split("T")[0],
      admin_remarks: validated.adminRemarks || null,
      proof_url: validated.proofUrl || null,
    },
    adminClient
  );

  await logAuditEvent({
    userId: user.id,
    action: "RECORD_MANUAL_PAYMENT",
    entityType: "payments",
    entityId: result.paymentCode,
    details: {
      withdrawalId: validated.withdrawalId,
      paymentCode: result.paymentCode,
      paymentReference: validated.paymentReference,
      paymentMethod: validated.paymentMethod,
    },
  });

  revalidatePath("/dashboard/super-admin/wallet");
  revalidatePath("/dashboard/super-admin/payments");
  revalidatePath("/dashboard/admin/wallet");
  revalidatePath("/dashboard/admin/payments");
  revalidatePath("/dashboard/partner/wallet");
  revalidatePath("/dashboard/vendor/wallet");

  return result;
}

/**
 * Super Admin executes a discretionary manual wallet adjustment (Module 8 & 11)
 */
export async function manualWalletAdjustmentAction({
  walletId,
  amount,
  direction,
  reason,
}: {
  walletId: string;
  amount: number;
  direction: "credit" | "debit";
  reason: string;
}) {
  const user = await requireRole(["super_admin"]);
  if (!reason || reason.trim().length < 5) {
    throw new Error("A detailed justification (min 5 chars) is mandatory for manual adjustments.");
  }
  if (amount <= 0) {
    throw new Error("Adjustment amount must be positive.");
  }

  const adminClient = createAdminClient();

  const { data: wallet } = await adminClient
    .from("wallets")
    .select("*")
    .eq("id", walletId)
    .single();

  if (!wallet) throw new Error("Wallet not found.");

  const balanceBefore = Number(wallet.available_balance);
  let balanceAfter = balanceBefore;

  if (direction === "credit") {
    balanceAfter = balanceBefore + amount;
  } else {
    if (balanceBefore < amount) {
      throw new Error(`Cannot debit ₹${amount}. Available balance is ₹${balanceBefore}.`);
    }
    balanceAfter = balanceBefore - amount;
  }

  await adminClient
    .from("wallets")
    .update({ available_balance: balanceAfter, updated_at: new Date().toISOString() })
    .eq("id", walletId);

  const ledgerCode = `LMB-WTR-${String(Math.floor(Math.random() * 900000) + 100000)}`;

  await adminClient.from("wallet_ledger").insert({
    ledger_code: ledgerCode,
    wallet_id: walletId,
    user_id: wallet.user_id,
    transaction_type: "manual_adjustment",
    amount,
    direction,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    reference_id: `ADJ-${Date.now()}`,
    description: `Manual adjustment by Super Admin: ${reason}`,
    processed_by: user.id,
  });

  await logAuditEvent({
    userId: user.id,
    action: "MANUAL_WALLET_ADJUSTMENT",
    entityType: "wallets",
    entityId: walletId,
    details: { amount, direction, reason, balanceBefore, balanceAfter },
  });

  revalidatePath("/dashboard/super-admin/wallet");
  revalidatePath("/dashboard/partner/wallet");
  revalidatePath("/dashboard/vendor/wallet");

  return { success: true, balanceAfter };
}
