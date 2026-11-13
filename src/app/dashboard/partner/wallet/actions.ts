"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  withdrawalRequestSchema,
  WithdrawalRequestFormData,
  payoutMethodSchema,
  PayoutMethodFormData,
} from "@/lib/security/validation";
import {
  executeWithdrawalRequest,
  executeWithdrawalStatus,
} from "@/lib/services/wallet";
import { logAuditEvent } from "@/lib/security/audit";

/**
 * Partner requests a withdrawal from their available wallet balance (Module 4)
 */
export async function requestWithdrawalAction(data: WithdrawalRequestFormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }

  // Account status check
  if (user.profile?.status !== "active" && !user.roles.includes("super_admin")) {
    throw new Error("Your account must be in active status to request withdrawals.");
  }

  const validated = withdrawalRequestSchema.parse(data);
  const adminClient = createAdminClient();

  const result = await executeWithdrawalRequest(user.id, validated, adminClient);

  await logAuditEvent({
    userId: user.id,
    action: "WITHDRAWAL_REQUESTED",
    entityType: "withdrawals",
    entityId: result.withdrawalCode,
    details: {
      amount: validated.amount,
      paymentMethod: validated.paymentMethod,
      withdrawalCode: result.withdrawalCode,
    },
  });

  revalidatePath("/dashboard/partner/wallet");
  revalidatePath("/dashboard/super-admin/wallet");
  revalidatePath("/dashboard/admin/wallet");

  return result;
}

/**
 * Partner cancels their own pending withdrawal request (Module 6)
 */
export async function cancelWithdrawalAction(withdrawalId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }

  const adminClient = createAdminClient();

  // Verify ownership
  const { data: wdr } = await adminClient
    .from("withdrawals")
    .select("id, user_id, status")
    .eq("id", withdrawalId)
    .single();

  if (!wdr || wdr.user_id !== user.id) {
    throw new Error("Unauthorized: Withdrawal request not found or does not belong to you.");
  }

  if (wdr.status !== "pending") {
    throw new Error("Only pending withdrawal requests can be cancelled.");
  }

  const result = await executeWithdrawalStatus(
    withdrawalId,
    "cancel",
    user.id,
    { rejection_reason: "Cancelled by partner" },
    adminClient
  );

  await logAuditEvent({
    userId: user.id,
    action: "WITHDRAWAL_CANCELLED",
    entityType: "withdrawals",
    entityId: withdrawalId,
    details: { withdrawalId },
  });

  revalidatePath("/dashboard/partner/wallet");
  revalidatePath("/dashboard/super-admin/wallet");

  return result;
}

/**
 * Partner saves or updates payout credentials (Module 4)
 */
export async function savePayoutMethodAction(data: PayoutMethodFormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }

  const validated = payoutMethodSchema.parse(data);
  const adminClient = createAdminClient();

  if (validated.isDefault) {
    // Unset other defaults
    await adminClient
      .from("payout_methods")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { data: inserted, error } = await adminClient
    .from("payout_methods")
    .insert({
      user_id: user.id,
      type: validated.type,
      is_default: validated.isDefault,
      upi_id: validated.type === "upi" ? validated.upiId : null,
      account_holder_name: validated.accountHolderName,
      account_number: validated.type === "bank_transfer" ? validated.accountNumber : null,
      ifsc_code: validated.type === "bank_transfer" ? validated.ifscCode : null,
      bank_name: validated.bankName || null,
      branch_name: validated.branchName || null,
      is_verified: true,
    })
    .select()
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to save payout method: ${error?.message || "Database error"}`);
  }

  revalidatePath("/dashboard/partner/wallet");
  revalidatePath("/dashboard/vendor/wallet");

  return { success: true, id: inserted.id };
}

