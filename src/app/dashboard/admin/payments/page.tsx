import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import {
  PaymentManagerView,
  PaymentRecordItem,
} from "@/app/dashboard/super-admin/payments/payment-manager-view";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireRole(["admin", "super_admin"]);
  const adminClient = createAdminClient();

  const { data: paymentsData } = await adminClient
    .from("payments")
    .select(`
      id,
      payment_code,
      withdrawal_id,
      user_id,
      amount,
      payment_method,
      payment_reference,
      payment_date,
      status,
      proof_url,
      admin_remarks,
      created_at,
      user:user_id (full_name, business_name, email),
      withdrawal:withdrawal_id (withdrawal_code),
      processor:processed_by (full_name, email)
    `)
    .order("created_at", { ascending: false });

  let totalDisbursed = 0;

  const payments: PaymentRecordItem[] = ((paymentsData as any[]) || []).map((p: any) => {
    const u = Array.isArray(p.user) ? p.user[0] : p.user;
    const w = Array.isArray(p.withdrawal) ? p.withdrawal[0] : p.withdrawal;
    const proc = Array.isArray(p.processor) ? p.processor[0] : p.processor;
    const amt = Number(p.amount || 0);
    totalDisbursed += amt;

    return {
      id: p.id,
      paymentCode: p.payment_code,
      withdrawalId: p.withdrawal_id,
      withdrawalCode: w?.withdrawal_code || "LMB-WDR-000000",
      userId: p.user_id,
      userName: u?.business_name || u?.full_name || "Beneficiary",
      userEmail: u?.email || "",
      amount: amt,
      paymentMethod: p.payment_method,
      paymentReference: p.payment_reference,
      paymentDate: p.payment_date,
      status: p.status,
      proofUrl: p.proof_url,
      adminRemarks: p.admin_remarks,
      processedByName: proc?.full_name || proc?.email || "Admin",
      createdAt: p.created_at,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Payment Remittances"
        description="Audit banking disbursements, verify UTR settlement numbers, and track platform remittance volume."
        badge="Platform Operations"
      />

      <PaymentManagerView payments={payments} totalDisbursed={totalDisbursed} />
    </div>
  );
}
