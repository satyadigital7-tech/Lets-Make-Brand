import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import {
  WalletAdminView,
  AdminWithdrawalItem,
  TreasurySummary,
} from "@/app/dashboard/super-admin/wallet/wallet-admin-view";
import { maskPayoutDetails } from "@/lib/services/wallet";

export const dynamic = "force-dynamic";

export default async function AdminWalletPage() {
  await requireRole(["admin", "super_admin"]);
  const adminClient = createAdminClient();

  const { data: wdrData } = await adminClient
    .from("withdrawals")
    .select(`
      id,
      withdrawal_code,
      wallet_id,
      user_id,
      amount,
      payment_method,
      payout_details,
      status,
      rejection_reason,
      admin_remarks,
      created_at,
      user:user_id (id, full_name, business_name, email, registration_type, associated_vendor_id),
      wallet:wallet_id (user_role)
    `)
    .order("created_at", { ascending: false });

  const { data: vendorsData } = await adminClient
    .from("profiles")
    .select("id, business_name, full_name");

  const vendorMap = new Map<string, string>();
  for (const v of (vendorsData as any[]) || []) {
    vendorMap.set(v.id, v.business_name || v.full_name || "Vendor");
  }

  const withdrawals: AdminWithdrawalItem[] = ((wdrData as any[]) || []).map((w: any) => {
    const u = Array.isArray(w.user) ? w.user[0] : w.user;
    const wal = Array.isArray(w.wallet) ? w.wallet[0] : w.wallet;
    const vendorId = u?.associated_vendor_id || null;

    return {
      id: w.id,
      withdrawalCode: w.withdrawal_code,
      walletId: w.wallet_id,
      userId: w.user_id,
      userName: u?.business_name || u?.full_name || "User",
      userEmail: u?.email || "",
      userRole: wal?.user_role || "partner",
      vendorId,
      vendorName: vendorId ? vendorMap.get(vendorId) || null : null,
      amount: Number(w.amount),
      paymentMethod: w.payment_method,
      maskedDetails: maskPayoutDetails(w.payout_details),
      payoutDetails: w.payout_details,
      status: w.status,
      rejectionReason: w.rejection_reason,
      adminRemarks: w.admin_remarks,
      createdAt: w.created_at,
    };
  });

  const { data: allWallets } = await adminClient
    .from("wallets")
    .select("available_balance, reserved_balance, total_withdrawn");

  let totalAvailable = 0;
  let totalReserved = 0;
  let totalWithdrawn = 0;

  for (const wal of (allWallets as any[]) || []) {
    totalAvailable += Number(wal.available_balance || 0);
    totalReserved += Number(wal.reserved_balance || 0);
    totalWithdrawn += Number(wal.total_withdrawn || 0);
  }

  let pendingCount = 0;
  let pendingAmount = 0;
  let approvedCount = 0;
  let approvedAmount = 0;
  let paidCount = 0;
  let paidAmount = 0;
  let rejectedCount = 0;

  for (const w of withdrawals) {
    if (w.status === "pending") {
      pendingCount++;
      pendingAmount += w.amount;
    } else if (w.status === "approved" || w.status === "processing") {
      approvedCount++;
      approvedAmount += w.amount;
    } else if (w.status === "paid") {
      paidCount++;
      paidAmount += w.amount;
    } else if (w.status === "rejected") {
      rejectedCount++;
    }
  }

  const summary: TreasurySummary = {
    totalAvailable,
    totalReserved,
    totalWithdrawn,
    pendingCount,
    pendingAmount,
    approvedCount,
    approvedAmount,
    paidCount,
    paidAmount,
    rejectedCount,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Treasury & Withdrawal Operations"
        description="Monitor user wallet balances, audit reserved funds, and verify payout queues."
        badge="Platform Operations"
      />

      <WalletAdminView withdrawals={withdrawals} summary={summary} />
    </div>
  );
}
