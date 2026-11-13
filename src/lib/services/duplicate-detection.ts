import type { createAdminClient } from "@/lib/supabase/admin";

/**
 * Normalizes a phone/mobile string into a canonical 10-digit format for India/international comparison.
 * e.g., "+91 98765-43210" -> "9876543210", "09876543210" -> "9876543210"
 */
export function normalizeMobile(rawMobile: string): string {
  const digits = rawMobile.replace(/\D/g, "");
  // If starts with 91 and has 12 digits, strip country code
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  // If starts with 0 and has 11 digits, strip leading zero
  if (digits.length === 11 && digits.startsWith("0")) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Normalizes email address (lowercase and trimmed)
 */
export function normalizeEmail(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType?: "mobile_match" | "email_match" | "both_match" | "campaign_identifier_match";
  matchedLeadId?: string;
}

/**
 * Checks if a customer lead for a given campaign already exists.
 * Normalized checks on mobile and email.
 */
export async function checkLeadDuplicate(
  campaignId: string,
  customerMobile: string,
  customerEmail: string,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<DuplicateCheckResult> {
  const normMobile = normalizeMobile(customerMobile);
  const normEmail = normalizeEmail(customerEmail);

  // Query existing leads for this campaign (excluding rejected/archived if needed, but checking all submissions)
  const { data: existingLeads } = await adminClient
    .from("leads")
    .select("id, customer_mobile, customer_email, is_duplicate, status")
    .eq("campaign_id", campaignId)
    .neq("status", "rejected");

  if (!existingLeads || existingLeads.length === 0) {
    return { isDuplicate: false };
  }

  for (const lead of existingLeads) {
    const existingNormMobile = normalizeMobile(lead.customer_mobile);
    const existingNormEmail = normalizeEmail(lead.customer_email);

    const mobileMatches = existingNormMobile === normMobile;
    const emailMatches = existingNormEmail === normEmail;

    if (mobileMatches && emailMatches) {
      return {
        isDuplicate: true,
        matchType: "both_match",
        matchedLeadId: lead.id,
      };
    } else if (mobileMatches) {
      return {
        isDuplicate: true,
        matchType: "mobile_match",
        matchedLeadId: lead.id,
      };
    } else if (emailMatches) {
      return {
        isDuplicate: true,
        matchType: "email_match",
        matchedLeadId: lead.id,
      };
    }
  }

  return { isDuplicate: false };
}
