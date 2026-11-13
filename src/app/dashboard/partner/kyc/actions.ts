"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { kycSubmissionSchema, KycSubmissionFormData } from "@/lib/security/validation";
import { submitKycApplication } from "@/lib/services/kyc";

/**
 * Partner submits or resubmits KYC verification details (Module 1)
 */
export async function submitPartnerKycAction(data: KycSubmissionFormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }

  const validated = kycSubmissionSchema.parse(data);
  const adminClient = createAdminClient();

  const result = await submitKycApplication(
    user.id,
    user.primaryRole || "independent_partner",
    validated,
    adminClient
  );

  revalidatePath("/dashboard/partner/kyc");
  revalidatePath("/dashboard/super-admin/kyc");
  revalidatePath("/dashboard/admin/kyc");

  return result;
}
