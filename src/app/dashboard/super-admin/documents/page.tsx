import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { DocumentsAdminView, TemplateItem } from "./documents-admin-view";

export const dynamic = "force-dynamic";

export default async function SuperAdminDocumentsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { data: templates } = await adminClient
    .from("document_templates")
    .select("*")
    .order("created_at", { ascending: true });

  const initialTemplates: TemplateItem[] = ((templates as any[]) || []).map((t: any) => ({
    id: t.id,
    templateType: t.template_type,
    title: t.title,
    companyName: t.company_name,
    companyAddress: t.company_address,
    companyWebsite: t.company_website,
    companyLogoUrl: t.company_logo_url,
    signatoryName: t.signatory_name,
    signatoryTitle: t.signatory_title,
    signatorySignatureUrl: t.signatory_signature_url,
    termsContent: t.terms_content,
    commissionPolicyRef: t.commission_policy_ref,
    responsibilities: t.responsibilities,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Templates & Compliance Generation"
        description="Configure official branding letterheads, authorized signatories, and legal terms for ID cards and appointment contracts."
      />
      <DocumentsAdminView initialTemplates={initialTemplates} />
    </div>
  );
}
