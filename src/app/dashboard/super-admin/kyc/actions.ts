"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { kycReviewSchema, KycReviewFormData } from "@/lib/security/validation";
import { reviewKycApplication } from "@/lib/services/kyc";

/**
 * Super Admin or authorized Admin approves, rejects, or requests resubmission for KYC (Module 1)
 */
export async function reviewKycAction(data: KycReviewFormData) {
  const user = await requireRole(["super_admin", "admin"]);
  const validated = kycReviewSchema.parse(data);
  const adminClient = createAdminClient();

  const result = await reviewKycApplication(
    validated.kycId,
    user.id,
    validated.action,
    validated.reason,
    validated.adminRemarks,
    adminClient
  );

  revalidatePath("/dashboard/super-admin/kyc");
  revalidatePath("/dashboard/admin/kyc");
  revalidatePath("/dashboard/partner/kyc");
  revalidatePath("/dashboard/vendor/kyc");

  return result;
}
