import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { VendorDocumentsView } from "./vendor-documents-view";

export const dynamic = "force-dynamic";

export default async function VendorDocumentsPage() {
  const user = await requireRole(["vendor", "super_admin"]);
  const adminClient = createAdminClient();

  const { data: idCardRow } = await adminClient
    .from("generated_documents")
    .select("doc_code, verification_reference, issue_date")
    .eq("user_id", user.id)
    .eq("document_type", "id_card")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: agreementRow } = await adminClient
    .from("generated_documents")
    .select("doc_code, issue_date")
    .eq("user_id", user.id)
    .eq("document_type", "offer_letter")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const entityName =
    user.profile?.business_name ||
    user.profile?.company_name ||
    user.profile?.full_name ||
    "Corporate Vendor Agency";
  const userCode = user.profile?.vendor_id_code || (user.profile as any)?.profile_code || `LMB-VEN-${user.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Credentials & Agreements"
        description="Download your official LMB Accredited Agency ID Card with cryptographic QR verification and Master Service Agreement."
      />
      <VendorDocumentsView
        entityName={entityName}
        userCode={userCode}
        existingIdCard={
          idCardRow
            ? {
                docCode: idCardRow.doc_code,
                verificationReference: idCardRow.verification_reference,
                issueDate: idCardRow.issue_date,
              }
            : null
        }
        existingAgreement={
          agreementRow
            ? {
                docCode: agreementRow.doc_code,
                issueDate: agreementRow.issue_date,
              }
            : null
        }
      />
    </div>
  );
}
