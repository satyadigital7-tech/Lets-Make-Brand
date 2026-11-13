import type { createAdminClient } from "@/lib/supabase/admin";
import { KycSubmissionFormData } from "@/lib/security/validation";
import { logAuditEvent } from "@/lib/security/audit";
import { createNotification } from "@/lib/services/notifications";

/**
 * Mask PAN Number for privacy and compliance (Module 1 & 8)
 * Example: ABCDE1234F -> ABCDE****F
 */
export function maskPanNumber(pan: string): string {
  const clean = (pan || "").trim().toUpperCase();
  if (clean.length === 10) {
    return `${clean.slice(0, 5)}****${clean.slice(9)}`;
  }
  return clean.length > 4 ? `${clean.slice(0, 2)}****${clean.slice(-2)}` : "PROTECTED";
}

/**
 * Mask Bank Account Number for privacy and compliance (Module 1 & 8)
 * Example: 123456789012 -> XXXXXX9012
 */
export function maskAccountNumber(acc: string): string {
  const clean = (acc || "").trim();
  if (clean.length >= 4) {
    return `XXXXXX${clean.slice(-4)}`;
  }
  return "XXXXXX";
}

/**
 * Submit or resubmit KYC application with atomic document linking (Module 1)
 */
export async function submitKycApplication(
  userId: string,
  userRole: string,
  data: KycSubmissionFormData,
  adminClient: ReturnType<typeof createAdminClient>
) {
  const maskedPan = maskPanNumber(data.panNumber);
  const maskedAcc = maskAccountNumber(data.bankAccountNumber);

  // Check if existing KYC record exists
  const { data: existing } = await adminClient
    .from("kyc_records")
    .select("id, kyc_code, status")
    .eq("user_id", userId)
    .maybeSingle();

  let kycId = existing?.id;
  let kycCode = existing?.kyc_code;

  if (existing) {
    // Resubmission update
    await adminClient
      .from("kyc_records")
      .update({
        full_name: data.fullName,
        date_of_birth: data.dateOfBirth,
        address: data.address,
        pan_number_masked: maskedPan,
        bank_account_holder: data.bankAccountHolder,
        bank_account_number_masked: maskedAcc,
        ifsc_code: data.ifscCode.toUpperCase(),
        bank_name: data.bankName || null,
        upi_id: data.upiId || null,
        status: "pending",
        rejection_reason: null,
        admin_remarks: null,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Generate code
    kycCode = `LMB-KYC-${String(Math.floor(Math.random() * 900000) + 100000)}`;

    const { data: newKyc, error } = await adminClient
      .from("kyc_records")
      .insert({
        kyc_code: kycCode,
        user_id: userId,
        user_role: userRole,
        full_name: data.fullName,
        date_of_birth: data.dateOfBirth,
        address: data.address,
        pan_number_masked: maskedPan,
        bank_account_holder: data.bankAccountHolder,
        bank_account_number_masked: maskedAcc,
        ifsc_code: data.ifscCode.toUpperCase(),
        bank_name: data.bankName || null,
        upi_id: data.upiId || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !newKyc) {
      throw new Error(error?.message || "Failed to initialize KYC record.");
    }
    kycId = newKyc.id;
  }

  // Delete previous documents on resubmission
  if (existing) {
    await adminClient.from("kyc_documents").delete().eq("kyc_id", kycId);
  }

  // Insert documents
  for (const doc of data.documents) {
    await adminClient.from("kyc_documents").insert({
      kyc_id: kycId,
      user_id: userId,
      document_type: doc.documentType,
      document_name: doc.documentName,
      file_path: doc.filePath,
      file_size: doc.fileSize || 0,
      mime_type: doc.mimeType || "application/octet-stream",
      is_verified: false,
    });
  }

  // Audit event
  await logAuditEvent({
    userId,
    action: existing ? "KYC_RESUBMITTED" : "KYC_SUBMITTED",
    entityType: "kyc_records",
    entityId: kycId,
    details: { kycCode, documentCount: data.documents.length },
  });

  // Notify user
  await createNotification({
    userId,
    title: "KYC Verification Submitted",
    message: `Your identity verification documents (${kycCode}) have been received and queued for administrative review.`,
    type: "kyc_updated",
    entityType: "kyc_records",
    entityId: kycId,
  });

  return { success: true, kycId, kycCode, status: "pending" };
}

/**
 * Super Admin or authorized Admin reviews a KYC application (Module 1)
 */
export async function reviewKycApplication(
  kycId: string,
  reviewerId: string,
  action: "approve" | "reject" | "request_correction",
  reason?: string,
  adminRemarks?: string,
  adminClient?: ReturnType<typeof createAdminClient>
) {
  if (!adminClient) {
    const { createAdminClient: getAdminClient } = await import("@/lib/supabase/admin");
    adminClient = getAdminClient();
  }

  const { data: kyc } = await adminClient
    .from("kyc_records")
    .select("*, user:user_id (id, full_name, email)")
    .eq("id", kycId)
    .single();

  if (!kyc) throw new Error("KYC application not found.");

  let newStatus: string;
  if (action === "approve") {
    newStatus = "approved";
  } else if (action === "reject") {
    newStatus = "rejected";
    if (!reason || !reason.trim()) {
      throw new Error("A clear rejection reason is mandatory when rejecting KYC.");
    }
  } else {
    newStatus = "resubmission_required";
    if (!reason || !reason.trim()) {
      throw new Error("Specific correction instructions are mandatory when requesting resubmission.");
    }
  }

  await adminClient
    .from("kyc_records")
    .update({
      status: newStatus as any,
      rejection_reason: reason || null,
      admin_remarks: adminRemarks || null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", kycId);

  // If approved, update documents as verified
  if (action === "approve") {
    await adminClient
      .from("kyc_documents")
      .update({ is_verified: true })
      .eq("kyc_id", kycId);
  }

  // Audit event
  await logAuditEvent({
    userId: reviewerId,
    action: `KYC_${action.toUpperCase()}`,
    entityType: "kyc_records",
    entityId: kycId,
    details: { targetUserId: kyc.user_id, status: newStatus, reason: reason || null },
  });

  // Notify user
  const statusTitles: Record<string, string> = {
    approved: "KYC Verified Successfully",
    rejected: "KYC Verification Rejected",
    resubmission_required: "KYC Correction Required",
  };

  const statusMsgs: Record<string, string> = {
    approved: "Congratulations! Your identity and bank details have been verified. Your account is fully active for payouts.",
    rejected: `Your KYC verification has been rejected. Reason: ${reason || "Document discrepancy"}`,
    resubmission_required: `Corrections are required on your KYC documents: ${reason}`,
  };

  await createNotification({
    userId: kyc.user_id,
    title: statusTitles[newStatus] || "KYC Status Updated",
    message: statusMsgs[newStatus] || "Your KYC status has been reviewed.",
    type: "kyc_updated",
    entityType: "kyc_records",
    entityId: kycId,
  });

  return { success: true, status: newStatus };
}

/**
 * Generate short-lived signed URL for private KYC document download (Module 1 & 8)
 */
export async function getSignedKycDocumentUrl(
  filePath: string,
  adminClient: ReturnType<typeof createAdminClient>,
  expiresInSeconds = 900 // 15 mins
): Promise<string> {
  if (!filePath) return "";

  // If already an absolute public or data URL, return as-is
  if (filePath.startsWith("http://") || filePath.startsWith("https://") || filePath.startsWith("data:")) {
    return filePath;
  }

  try {
    const { data, error } = await adminClient.storage
      .from("kyc-documents")
      .createSignedUrl(filePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      // Fallback for mock/local storage paths
      return `/api/storage/kyc-documents/${encodeURIComponent(filePath)}`;
    }
    return data.signedUrl;
  } catch (err: any) {
    console.warn("Storage signed URL fallback:", err?.message);
    return `/api/storage/kyc-documents/${encodeURIComponent(filePath)}`;
  }
}
