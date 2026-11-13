"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { documentTemplateSchema, DocumentTemplateFormData } from "@/lib/security/validation";
import { logAuditEvent } from "@/lib/security/audit";

/**
 * Super Admin saves or updates official document template (Module 3)
 */
export async function saveDocumentTemplateAction(data: DocumentTemplateFormData) {
  const user = await requireRole(["super_admin"]);
  const validated = documentTemplateSchema.parse(data);
  const adminClient = createAdminClient();

  const { data: updated, error } = await adminClient
    .from("document_templates")
    .upsert(
      {
        template_type: validated.templateType,
        title: validated.title,
        company_name: validated.companyName,
        company_address: validated.companyAddress,
        company_website: validated.companyWebsite,
        company_logo_url: validated.companyLogoUrl || null,
        signatory_name: validated.signatoryName,
        signatory_title: validated.signatoryTitle,
        signatory_signature_url: validated.signatorySignatureUrl || null,
        terms_content: validated.termsContent || null,
        commission_policy_ref: validated.commissionPolicyRef || null,
        responsibilities: validated.responsibilities || null,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "template_type" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to update document template.");
  }

  await logAuditEvent({
    userId: user.id,
    action: "DOCUMENT_TEMPLATE_UPDATED",
    entityType: "document_templates",
    entityId: validated.templateType,
    details: { templateType: validated.templateType, title: validated.title },
  });

  revalidatePath("/dashboard/super-admin/documents");
  return { success: true, template: updated };
}
