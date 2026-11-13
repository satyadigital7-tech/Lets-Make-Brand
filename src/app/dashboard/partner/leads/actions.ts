"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";
import { leadSubmissionSchema, LeadSubmissionFormData } from "@/lib/security/validation";
import { checkLeadDuplicate, normalizeMobile, normalizeEmail } from "@/lib/services/duplicate-detection";
import { createNotification } from "@/lib/services/notifications";

/**
 * Generate unique server-side Lead ID (e.g. LMB-LED-000001)
 */
async function getNextLeadCode(adminClient: ReturnType<typeof createAdminClient>): Promise<string> {
  try {
    const { data, error } = await adminClient.rpc("generate_lead_code");
    if (!error && data && typeof data === "string") {
      return data;
    }
  } catch {
    // Fallback
  }

  const { data: latestLead } = await adminClient
    .from("leads")
    .select("lead_code")
    .order("lead_code", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (latestLead?.lead_code) {
    const match = latestLead.lead_code.match(/LMB-LED-(\d+)/);
    if (match && match[1]) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  return `LMB-LED-${String(nextNum).padStart(6, "0")}`;
}

export async function submitLeadAction(data: LeadSubmissionFormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You must be logged in to submit leads.");
  }

  // CRITICAL MANDATE (Module 7 & 13):
  // Team Leaders are strictly forbidden from submitting personal earning leads
  if (user.primaryRole === "team_leader" || (user.roles.includes("team_leader") && !user.roles.includes("super_admin"))) {
    throw new Error(
      "Compliance Violation: Team Leaders are strictly prohibited from submitting personal earning leads per platform governance rules."
    );
  }

  // Account status check
  if (user.profile?.status !== "active" && !user.roles.includes("super_admin")) {
    throw new Error("Your partner account is pending approval or inactive. Only approved partners can submit leads.");
  }

  const validated = leadSubmissionSchema.parse(data);
  const adminClient = createAdminClient();

  // 1. Fetch Campaign Details
  const { data: campaign, error: campErr } = await adminClient
    .from("campaigns")
    .select("id, title, status, commission_amount, commission_rate, max_payout")
    .eq("id", validated.campaignId)
    .single();

  if (campErr || !campaign) {
    throw new Error("Target campaign does not exist.");
  }

  if (campaign.status !== "active") {
    throw new Error("This campaign is not currently active for lead submissions.");
  }

  // 2. Identify Vendor and Team association if user is in a squad
  let vendorId: string | null = null;
  let teamId: string | null = null;

  const { data: userProfile } = await adminClient
    .from("profiles")
    .select("associated_vendor_id")
    .eq("id", user.id)
    .single();

  if (userProfile?.associated_vendor_id) {
    vendorId = userProfile.associated_vendor_id;
  }

  const { data: teamMembership } = await adminClient
    .from("team_members")
    .select("team_id, teams(vendor_id)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (teamMembership?.team_id) {
    teamId = teamMembership.team_id;
    const teamObj = Array.isArray(teamMembership.teams) ? teamMembership.teams[0] : teamMembership.teams;
    if (teamObj?.vendor_id) {
      vendorId = teamObj.vendor_id;
    }
  }

  // 3. Duplicate Detection Check (Module 7)
  const dupResult = await checkLeadDuplicate(
    validated.campaignId,
    validated.customerMobile,
    validated.customerEmail,
    adminClient
  );

  const leadCode = await getNextLeadCode(adminClient);
  const isDuplicate = dupResult.isDuplicate;

  // Commission is 0 if duplicate to prevent double payouts
  const commissionEarned = isDuplicate ? 0 : Number(campaign.commission_amount || campaign.commission_rate || 0);

  const { data: newLead, error: insertErr } = await adminClient
    .from("leads")
    .insert({
      lead_code: leadCode,
      campaign_id: validated.campaignId,
      submitted_by: user.id,
      vendor_id: vendorId,
      team_id: teamId,
      customer_name: validated.customerName,
      customer_mobile: validated.customerMobile,
      customer_email: validated.customerEmail,
      customer_location: validated.customerLocation || null,
      address: validated.address || null,
      additional_fields: validated.additionalFields,
      status: isDuplicate ? "duplicate" : "pending",
      rejection_reason: isDuplicate ? "Duplicate submission detected for this campaign" : null,
      commission_amount: commissionEarned,
      is_duplicate: isDuplicate,
      duplicate_of_lead_id: dupResult.matchedLeadId || null,
      consent_confirmed: true,
    })
    .select()
    .single();

  if (insertErr || !newLead) {
    throw new Error(`Failed to submit lead: ${insertErr?.message || "Database error"}`);
  }

  // 4. Record Duplicate Check in lead_duplicate_checks (Module 7)
  await adminClient.from("lead_duplicate_checks").insert({
    lead_id: newLead.id,
    campaign_id: validated.campaignId,
    normalized_mobile: normalizeMobile(validated.customerMobile),
    normalized_email: normalizeEmail(validated.customerEmail),
    match_type: dupResult.matchType || "mobile_match",
    matched_existing_lead_id: dupResult.matchedLeadId || null,
    is_duplicate: isDuplicate,
  });

  // 5. Record Initial History Entry in lead_status_history (Module 10)
  await adminClient.from("lead_status_history").insert({
    lead_id: newLead.id,
    actor_id: user.id,
    action: isDuplicate ? "MARKED_DUPLICATE" : "SUBMITTED",
    previous_status: null,
    new_status: isDuplicate ? "duplicate" : "pending",
    comments: isDuplicate
      ? `Lead flagged as duplicate of previous submission ID: ${dupResult.matchedLeadId}`
      : "Initial promotional lead submission",
  });

  // 6. Insert Supporting Documents (Module 4)
  if (validated.documents && validated.documents.length > 0) {
    const docPayloads = validated.documents.map((doc) => ({
      lead_id: newLead.id,
      document_name: doc.name,
      document_type: doc.type || "identification",
      file_url: doc.url,
      file_size: doc.size || null,
    }));

    await adminClient.from("lead_documents").insert(docPayloads);
  }

  // 7. Trigger Notification Events (Module 11)
  if (isDuplicate) {
    await createNotification({
      userId: user.id,
      title: "Duplicate Lead Flagged",
      message: `Your submission for "${validated.customerName}" was flagged as a duplicate of an existing record for ${campaign.title}.`,
      type: "duplicate_detected",
      entityType: "lead",
      entityId: newLead.id,
    });
  } else {
    await createNotification({
      userId: user.id,
      title: "Lead Submitted Successfully",
      message: `Lead ${leadCode} for "${validated.customerName}" submitted and awaiting verification.`,
      type: "lead_submitted",
      entityType: "lead",
      entityId: newLead.id,
    });

    // Notify Super Admin
    const { data: superAdmins } = await adminClient
      .from("user_roles")
      .select("user_id, roles!inner(code)")
      .eq("roles.code", "super_admin");

    if (superAdmins) {
      for (const sa of superAdmins as any[]) {
        await createNotification({
          userId: sa.user_id,
          title: "New Lead for Verification",
          message: `New lead ${leadCode} submitted for ${campaign.title} by ${user.profile?.full_name || user.email}.`,
          type: "lead_submitted",
          entityType: "lead",
          entityId: newLead.id,
        });
      }
    }
  }

  // Audit Log
  await logAuditEvent({
    userId: user.id,
    action: isDuplicate ? "LEAD_DUPLICATE_FLAGGED" : "LEAD_SUBMITTED",
    entityType: "leads",
    entityId: newLead.id,
    details: {
      leadCode,
      campaignId: validated.campaignId,
      customerEmail: validated.customerEmail,
      isDuplicate,
    },
  });

  revalidatePath("/dashboard/partner/leads");
  revalidatePath("/dashboard/partner/campaigns");
  revalidatePath("/dashboard/super-admin/leads");
  if (vendorId) revalidatePath("/dashboard/vendor/leads");
  if (teamId) revalidatePath("/dashboard/team-leader/leads");

  return {
    success: true,
    leadCode,
    isDuplicate,
    leadId: newLead.id,
  };
}


