import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { PartnerKycView, KycRecordData } from "./partner-kyc-view";

export const dynamic = "force-dynamic";

export default async function PartnerKycPage() {
  const user = await requireRole(["independent_partner", "team_member", "team_leader", "super_admin"]);
  const adminClient = createAdminClient();

  // Fetch existing KYC record
  const { data: kycRow } = await adminClient
    .from("kyc_records")
    .select("*, documents:kyc_documents(*)")
    .eq("user_id", user.id)
    .maybeSingle();

  let initialKyc: KycRecordData | null = null;
  if (kycRow) {
    initialKyc = {
      id: kycRow.id,
      kycCode: kycRow.kyc_code,
      fullName: kycRow.full_name,
      dateOfBirth: kycRow.date_of_birth,
      address: kycRow.address,
      panMasked: kycRow.pan_number_masked,
      bankAccountHolder: kycRow.bank_account_holder,
      bankAccountMasked: kycRow.bank_account_number_masked,
      ifscCode: kycRow.ifsc_code,
      bankName: kycRow.bank_name,
      upiId: kycRow.upi_id,
      status: kycRow.status as any,
      rejectionReason: kycRow.rejection_reason,
      adminRemarks: kycRow.admin_remarks,
      submittedAt: kycRow.submitted_at,
      documents: ((kycRow.documents as any[]) || []).map((d: any) => ({
        id: d.id,
        documentType: d.document_type,
        documentName: d.document_name,
        filePath: d.file_path,
        isVerified: d.is_verified,
      })),
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner KYC & Banking Verification"
        description="Submit official identity and bank account credentials for compliance and commission disbursements."
        badge={
          initialKyc?.status === "approved"
            ? "Verified"
            : initialKyc?.status === "pending"
            ? "Under Review"
            : "Action Required"
        }
      />
      <PartnerKycView
        initialKyc={initialKyc}
        defaultFullName={user.profile?.full_name || ""}
      />
    </div>
  );
}
