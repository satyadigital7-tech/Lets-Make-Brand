"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateIdCardPdf, generateOfferLetterPdf } from "@/lib/services/document-generator";

/**
 * Generate official Partner ID Card PDF on demand (Module 2)
 */
export async function generateMyIdCardAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, full_name, partner_id_code, role_code:user_roles(role_code)")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name || user.profile?.full_name || "Partner Affiliate";
  const userCode = profile?.partner_id_code || (user.profile as any)?.partner_id_code || `LMB-PRT-${user.id.slice(0, 6).toUpperCase()}`;

  const result = await generateIdCardPdf(
    {
      userId: user.id,
      fullName,
      userCode,
      roleTitle: "Brand Promotion Partner",
      userRole: "independent_partner",
      officialWebsite: "www.letsmakebrand.com",
    },
    adminClient
  );

  revalidatePath("/dashboard/partner/documents");
  return { success: true, ...result };
}

/**
 * Generate official Partner Appointment Offer Letter PDF on demand (Module 3)
 */
export async function generateMyOfferLetterAction() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, full_name, partner_id_code, address")
    .eq("id", user.id)
    .single();

  const fullName = profile?.full_name || user.profile?.full_name || "Partner Affiliate";
  const userCode = profile?.partner_id_code || (user.profile as any)?.partner_id_code || `LMB-PRT-${user.id.slice(0, 6).toUpperCase()}`;

  const result = await generateOfferLetterPdf(
    {
      userId: user.id,
      fullName,
      userCode,
      userRole: "independent_partner",
      address: profile?.address || undefined,
    },
    adminClient
  );

  revalidatePath("/dashboard/partner/documents");
  return { success: true, ...result };
}
