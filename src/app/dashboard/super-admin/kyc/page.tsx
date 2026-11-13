import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { KycAdminView, AdminKycItem } from "./kyc-admin-view";

export const dynamic = "force-dynamic";

export default async function SuperAdminKycPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { data: records } = await adminClient
    .from("kyc_records")
    .select("*, user:user_id(id, email, full_name, profile_code), documents:kyc_documents(*)")
    .order("submitted_at", { ascending: false });

  const initialItems: AdminKycItem[] = ((records as any[]) || []).map((r: any) => {
    const user = Array.isArray(r.user) ? r.user[0] : r.user;
    return {
      id: r.id,
      kycCode: r.kyc_code,
      userId: r.user_id,
      userRole: r.user_role,
      fullName: r.full_name,
      email: user?.email || "N/A",
      profileCode: user?.profile_code || "N/A",
      dateOfBirth: r.date_of_birth,
      address: r.address,
      panMasked: r.pan_number_masked,
      bankAccountHolder: r.bank_account_holder,
      bankAccountMasked: r.bank_account_number_masked,
      ifscCode: r.ifsc_code,
      bankName: r.bank_name,
      upiId: r.upi_id,
      status: r.status,
      rejectionReason: r.rejection_reason,
      adminRemarks: r.admin_remarks,
      submittedAt: r.submitted_at,
      documents: ((r.documents as any[]) || []).map((d: any) => ({
        id: d.id,
        documentType: d.document_type,
        documentName: d.document_name,
        filePath: d.file_path,
        isVerified: d.is_verified,
      })),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC & Identity Management"
        description="Comprehensive compliance queue to review, verify, approve, and audit partner & vendor identity documents."
        badge={`${initialItems.filter((i) => i.status === "pending").length} Pending`}
      />
      <KycAdminView initialItems={initialItems} />
    </div>
  );
}
