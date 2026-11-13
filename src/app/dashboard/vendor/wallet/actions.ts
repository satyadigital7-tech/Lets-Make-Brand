"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  withdrawalRequestSchema,
  WithdrawalRequestFormData,
} from "@/lib/security/validation";
import {
  executeWithdrawalRequest,
  executeWithdrawalStatus,
} from "@/lib/services/wallet";
import { logAuditEvent } from "@/lib/security/audit";

/**
 * Vendor requests a withdrawal from their agency override balance (Module 4)
 */
export async function requestVendorWithdrawalAction(data: WithdrawalRequestFormData) {
  const user = await requireRole(["vendor", "super_admin"]);
  const validated = withdrawalRequestSchema.parse(data);
  const adminClient = createAdminClient();

  const result = await executeWithdrawalRequest(user.id, validated, adminClient);

  await logAuditEvent({
    userId: user.id,
    action: "VENDOR_WITHDRAWAL_REQUESTED",
    entityType: "withdrawals",
    entityId: result.withdrawalCode,
    details: {
      amount: validated.amount,
      paymentMethod: validated.paymentMethod,
      withdrawalCode: result.withdrawalCode,
    },
  });

  revalidatePath("/dashboard/vendor/wallet");
  revalidatePath("/dashboard/super-admin/wallet");
  revalidatePath("/dashboard/admin/wallet");

  return result;
}

/**
 * Vendor cancels their own pending withdrawal request (Module 6)
 */
export async function cancelVendorWithdrawalAction(withdrawalId: string) {
  const user = await requireRole(["vendor", "super_admin"]);
  const adminClient = createAdminClient();

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
    { rejection_reason: "Cancelled by vendor" },
    adminClient
  );

  revalidatePath("/dashboard/vendor/wallet");
  revalidatePath("/dashboard/super-admin/wallet");

  return result;
}

