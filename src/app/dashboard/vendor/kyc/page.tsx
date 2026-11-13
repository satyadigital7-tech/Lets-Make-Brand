import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { VendorKycView, VendorKycData } from "./vendor-kyc-view";

export const dynamic = "force-dynamic";

export default async function VendorKycPage() {
  const user = await requireRole(["vendor", "super_admin"]);
  const adminClient = createAdminClient();

  const { data: kycRow } = await adminClient
    .from("kyc_records")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  let initialKyc: VendorKycData | null = null;
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
      status: kycRow.status,
      rejectionReason: kycRow.rejection_reason,
      adminRemarks: kycRow.admin_remarks,
      submittedAt: kycRow.submitted_at,
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Commercial KYC"
        description="Verify your promotional agency entity credentials and corporate bank accounts for enterprise overrides."
        badge={initialKyc?.status === "approved" ? "Accredited" : "Verification Required"}
      />
      <VendorKycView
        initialKyc={initialKyc}
        businessName={user.profile?.business_name || user.profile?.company_name || user.profile?.full_name || ""}
      />
    </div>
  );
}
