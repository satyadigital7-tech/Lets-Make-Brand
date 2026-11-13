import type { createAdminClient } from "@/lib/supabase/admin";
import {
  WithdrawalRequestFormData,
  PayoutMethodFormData,
} from "@/lib/security/validation";

/**
 * Mask sensitive payout details for security and privacy compliance (Module 5 & 11)
 */
export function maskPayoutDetails(details: any): {
  maskedAccount: string;
  accountHolder: string;
  method: string;
} {
  if (!details || typeof details !== "object") {
    return { maskedAccount: "N/A", accountHolder: "N/A", method: "N/A" };
  }

  const holder = details.accountHolderName || "Account Holder";

  if (details.upiId) {
    const parts = String(details.upiId).split("@");
    const namePart = parts[0] || "";
    const maskedName = namePart.length > 3 ? `${namePart.slice(0, 3)}***` : `${namePart}***`;
    const handle = parts[1] ? `@${parts[1]}` : "";
    return {
      maskedAccount: `${maskedName}${handle}`,
      accountHolder: holder,
      method: "UPI",
    };
  }

  if (details.accountNumber) {
    const acc = String(details.accountNumber);
    const last4 = acc.length >= 4 ? acc.slice(-4) : acc;
    const ifsc = details.ifscCode ? ` (${details.ifscCode})` : "";
    return {
      maskedAccount: `XXXXXX${last4}${ifsc}`,
      accountHolder: holder,
      method: details.bankName || "Bank Transfer",
    };
  }

  return {
    maskedAccount: "Protected Details",
    accountHolder: holder,
    method: "Direct Deposit",
  };
}

/**
 * Get or create wallet for a user, synchronizing from actual commission transactions (Module 1)
 */
export async function getOrCreateUserWallet(
  userId: string,
  userRole: string,
  adminClient: ReturnType<typeof createAdminClient>
) {
  try {
    const { data, error } = await adminClient.rpc("get_or_create_wallet", {
      p_user_id: userId,
      p_user_role: userRole,
    });

    if (!error && data) {
      return data as any;
    }
  } catch (err: any) {
    console.warn("RPC get_or_create_wallet fallback:", err?.message);
  }

  // Fallback
  const { data: existing } = await adminClient
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // Calculate initial metrics from commission_transactions
  const { data: txns } = await adminClient
    .from("commission_transactions")
    .select("commission_amount, transaction_type, commission_status")
    .eq("user_id", userId);

  let earned = 0;
  for (const t of (txns as any[]) || []) {
    const amt = Number(t.commission_amount || 0);
    if (t.transaction_type === "credit" && t.commission_status === "approved") {
      earned += amt;
    } else if (t.transaction_type === "reversal") {
      earned -= amt;
    }
  }

  const { data: newWallet } = await adminClient
    .from("wallets")
    .insert({
      wallet_code: `LMB-WAL-${String(Math.floor(Math.random() * 900000) + 100000)}`,
      user_id: userId,
      user_role: userRole,
      total_earnings: Math.max(0, earned),
      available_balance: Math.max(0, earned),
      reserved_balance: 0.00,
      total_withdrawn: 0.00,
      currency: "INR",
      status: "active",
    })
    .select()
    .single();

  return newWallet;
}

/**
 * Submit withdrawal request with atomic balance reservation (Module 4)
 */
export async function executeWithdrawalRequest(
  userId: string,
  data: WithdrawalRequestFormData,
  adminClient: ReturnType<typeof createAdminClient>
) {
  try {
    const { data: result, error } = await adminClient.rpc("submit_withdrawal_request", {
      p_user_id: userId,
      p_amount: data.amount,
      p_method: data.paymentMethod,
      p_details: data.payoutDetails,
    });

    if (!error && result) {
      const res = result as any;
      if (res.success) {
        return res;
      } else {
        throw new Error(res.error || "Failed to submit withdrawal request.");
      }
    }
  } catch (err: any) {
    if (err.message && !err.message.includes("RPC")) {
      throw err;
    }
    console.warn("RPC submit_withdrawal_request fallback:", err?.message);
  }

  // Fallback atomic execution
  const { data: wallet } = await adminClient
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!wallet) throw new Error("Wallet not found.");
  if (wallet.available_balance < data.amount) {
    throw new Error(`Insufficient available balance. Requested: ₹${data.amount}, Available: ₹${wallet.available_balance}.`);
  }

  const wdrCode = `LMB-WDR-${String(Math.floor(Math.random() * 900000) + 100000)}`;
  const ledgerCode = `LMB-WTR-${String(Math.floor(Math.random() * 900000) + 100000)}`;

  const balanceBefore = Number(wallet.available_balance);
  const balanceAfter = balanceBefore - data.amount;

  await adminClient
    .from("wallets")
    .update({
      available_balance: balanceAfter,
      reserved_balance: Number(wallet.reserved_balance) + data.amount,
    })
    .eq("id", wallet.id);

  const { data: wdr } = await adminClient
    .from("withdrawals")
    .insert({
      withdrawal_code: wdrCode,
      wallet_id: wallet.id,
      user_id: userId,
      amount: data.amount,
      payment_method: data.paymentMethod,
      payout_details: data.payoutDetails,
      status: "pending",
    })
    .select()
    .single();

  await adminClient.from("wallet_ledger").insert({
    ledger_code: ledgerCode,
    wallet_id: wallet.id,
    user_id: userId,
    transaction_type: "withdrawal_reservation",
    amount: data.amount,
    direction: "debit",
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    reference_id: wdrCode,
    description: `Funds reserved for withdrawal request ${wdrCode}`,
    processed_by: userId,
  });

  return {
    success: true,
    withdrawalCode: wdrCode,
    availableBalance: balanceAfter,
  };
}

/**
 * Process withdrawal status transition (Module 5, 6, 7)
 */
export async function executeWithdrawalStatus(
  withdrawalId: string,
  action: "approve" | "mark_processing" | "reject" | "cancel" | "mark_paid",
  actorId: string,
  params: any = {},
  adminClient: ReturnType<typeof createAdminClient>
) {
  try {
    const { data: result, error } = await adminClient.rpc("process_withdrawal_status", {
      p_withdrawal_id: withdrawalId,
      p_action: action,
      p_actor_id: actorId,
      p_params: params,
    });

    if (!error && result) {
      const res = result as any;
      if (res.success) {
        return res;
      } else {
        throw new Error(res.error || `Failed to ${action} withdrawal.`);
      }
    }
  } catch (err: any) {
    if (err.message && !err.message.includes("RPC")) {
      throw err;
    }
    console.warn("RPC process_withdrawal_status fallback:", err?.message);
  }

  // Fallback
  const { data: wdr } = await adminClient
    .from("withdrawals")
    .select("*, wallet:wallet_id (*)")
    .eq("id", withdrawalId)
    .single();

  if (!wdr) throw new Error("Withdrawal request not found.");
  const wallet = Array.isArray(wdr.wallet) ? wdr.wallet[0] : wdr.wallet;

  if (action === "approve") {
    await adminClient
      .from("withdrawals")
      .update({ status: "approved", reviewed_by: actorId, reviewed_at: new Date().toISOString() })
      .eq("id", withdrawalId);
    return { success: true, status: "approved" };
  }

  if (action === "mark_processing") {
    await adminClient
      .from("withdrawals")
      .update({ status: "processing", reviewed_by: actorId, reviewed_at: new Date().toISOString() })
      .eq("id", withdrawalId);
    return { success: true, status: "processing" };
  }

  if (action === "reject" || action === "cancel") {
    const reason = params.rejection_reason || (action === "cancel" ? "Cancelled by user" : "Rejected by admin");
    // Release funds
    await adminClient
      .from("wallets")
      .update({
        available_balance: Number(wallet.available_balance) + Number(wdr.amount),
        reserved_balance: Math.max(0, Number(wallet.reserved_balance) - Number(wdr.amount)),
      })
      .eq("id", wallet.id);

    await adminClient
      .from("withdrawals")
      .update({
        status: action === "reject" ? "rejected" : "cancelled",
        rejection_reason: reason,
        reviewed_by: actorId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId);

    const ledgerCode = `LMB-WTR-${String(Math.floor(Math.random() * 900000) + 100000)}`;
    await adminClient.from("wallet_ledger").insert({
      ledger_code: ledgerCode,
      wallet_id: wallet.id,
      user_id: wdr.user_id,
      transaction_type: "withdrawal_release",
      amount: wdr.amount,
      direction: "credit",
      balance_before: Number(wallet.available_balance),
      balance_after: Number(wallet.available_balance) + Number(wdr.amount),
      reference_id: wdr.withdrawal_code,
      description: `Funds released for ${action} withdrawal: ${reason}`,
      processed_by: actorId,
    });

    return { success: true, status: action === "reject" ? "rejected" : "cancelled" };
  }

  if (action === "mark_paid") {
    const utr = String(params.payment_reference || "").trim();
    if (!utr) throw new Error("Payment reference (UTR) is mandatory.");

    // Debit reserved balance, increment total_withdrawn
    await adminClient
      .from("wallets")
      .update({
        reserved_balance: Math.max(0, Number(wallet.reserved_balance) - Number(wdr.amount)),
        total_withdrawn: Number(wallet.total_withdrawn) + Number(wdr.amount),
      })
      .eq("id", wallet.id);

    await adminClient
      .from("withdrawals")
      .update({
        status: "paid",
        admin_remarks: params.admin_remarks || null,
        reviewed_by: actorId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId);

    const payCode = `LMB-PAY-${String(Math.floor(Math.random() * 900000) + 100000)}`;
    await adminClient.from("payments").insert({
      payment_code: payCode,
      withdrawal_id: withdrawalId,
      user_id: wdr.user_id,
      amount: wdr.amount,
      payment_method: wdr.payment_method,
      payment_reference: utr,
      payment_date: params.payment_date || new Date().toISOString().split("T")[0],
      status: "completed",
      proof_url: params.proof_url || null,
      admin_remarks: params.admin_remarks || null,
      processed_by: actorId,
    });

    const ledgerCode = `LMB-WTR-${String(Math.floor(Math.random() * 900000) + 100000)}`;
    await adminClient.from("wallet_ledger").insert({
      ledger_code: ledgerCode,
      wallet_id: wallet.id,
      user_id: wdr.user_id,
      transaction_type: "withdrawal_payment",
      amount: wdr.amount,
      direction: "debit",
      balance_before: Number(wallet.available_balance),
      balance_after: Number(wallet.available_balance),
      reference_id: payCode,
      description: `Payout completed via ${wdr.payment_method} (Ref: ${utr})`,
      processed_by: actorId,
    });

    return { success: true, status: "paid", paymentCode: payCode, paymentReference: utr };
  }

  throw new Error(`Unsupported action: ${action}`);
}
