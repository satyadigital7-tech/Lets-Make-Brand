"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { kycSubmissionSchema, KycSubmissionFormData } from "@/lib/security/validation";
import { submitKycApplication } from "@/lib/services/kyc";

/**
 * Vendor submits corporate entity KYC credentials (Module 1)
 */
export async function submitVendorKycAction(data: KycSubmissionFormData) {
  const user = await requireRole(["vendor", "super_admin"]);
  const validated = kycSubmissionSchema.parse(data);
  const adminClient = createAdminClient();

  const result = await submitKycApplication(
    user.id,
    "vendor",
    validated,
    adminClient
  );

  revalidatePath("/dashboard/vendor/kyc");
  revalidatePath("/dashboard/super-admin/kyc");
  revalidatePath("/dashboard/admin/kyc");

  return result;
}
