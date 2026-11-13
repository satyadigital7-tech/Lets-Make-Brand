import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { PartnerDocumentsView } from "./partner-documents-view";

export const dynamic = "force-dynamic";

export default async function PartnerDocumentsPage() {
  const user = await requireRole(["independent_partner", "team_member", "team_leader", "super_admin"]);
  const adminClient = createAdminClient();

  // Fetch existing ID Card
  const { data: idCardRow } = await adminClient
    .from("generated_documents")
    .select("doc_code, verification_reference, issue_date")
    .eq("user_id", user.id)
    .eq("document_type", "id_card")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch existing Offer Letter
  const { data: offerRow } = await adminClient
    .from("generated_documents")
    .select("doc_code, issue_date")
    .eq("user_id", user.id)
    .eq("document_type", "offer_letter")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fullName = user.profile?.full_name || "Partner Affiliate";
  const userCode = user.profile?.partner_id_code || (user.profile as any)?.profile_code || `LMB-PRT-${user.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Official Credentials & Documents"
        description="Access and download your verified Partner ID Card with QR authenticity and official Appointment Agreement."
      />
      <PartnerDocumentsView
        fullName={fullName}
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
        existingOfferLetter={
          offerRow
            ? {
                docCode: offerRow.doc_code,
                issueDate: offerRow.issue_date,
              }
            : null
        }
      />
    </div>
  );
}
