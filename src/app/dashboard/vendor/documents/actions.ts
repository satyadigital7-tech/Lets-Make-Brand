"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateIdCardPdf, generateOfferLetterPdf } from "@/lib/services/document-generator";

/**
 * Generate official Vendor Agency Credential ID Card PDF (Module 2)
 */
export async function generateVendorIdCardAction() {
  const user = await requireRole(["vendor", "super_admin"]);
  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, full_name, business_name, profile_code")
    .eq("id", user.id)
    .single();

  const entityName = profile?.business_name || profile?.full_name || "Agency Vendor";
  const userCode = profile?.profile_code || `LMB-VEN-${user.id.slice(0, 6).toUpperCase()}`;

  const result = await generateIdCardPdf(
    {
      userId: user.id,
      fullName: entityName,
      userCode,
      roleTitle: "Accredited Agency Vendor",
      userRole: "vendor",
      officialWebsite: "www.letsmakebrand.com",
    },
    adminClient
  );

  revalidatePath("/dashboard/vendor/documents");
  return { success: true, ...result };
}

/**
 * Generate official Corporate Vendor Appointment Agreement PDF (Module 3)
 */
export async function generateVendorAgreementAction() {
  const user = await requireRole(["vendor", "super_admin"]);
  const adminClient = createAdminClient();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, full_name, business_name, profile_code, address")
    .eq("id", user.id)
    .single();

  const entityName = profile?.business_name || profile?.full_name || "Agency Vendor";
  const userCode = profile?.profile_code || `LMB-VEN-${user.id.slice(0, 6).toUpperCase()}`;

  const result = await generateOfferLetterPdf(
    {
      userId: user.id,
      fullName: entityName,
      userCode,
      userRole: "vendor",
      address: profile?.address || undefined,
    },
    adminClient
  );

  revalidatePath("/dashboard/vendor/documents");
  return { success: true, ...result };
}
