import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import type { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/security/audit";

export interface IdCardData {
  userId: string;
  fullName: string;
  userCode: string; // LMB-PRT-000001 or LMB-VEN-000001
  roleTitle: string; // "Authorized Brand Vendor" or "Brand Promotion Partner"
  userRole: "vendor" | "independent_partner" | "team_member" | "team_leader";
  issueDate?: string;
  photoUrl?: string | null;
  officialWebsite?: string;
}

export interface OfferLetterData {
  userId: string;
  fullName: string;
  userCode: string;
  userRole: "vendor" | "independent_partner" | "team_member" | "team_leader";
  address?: string;
  issueDate?: string;
  templateType?: string;
}

/**
 * Automatically generate a secure, high-resolution ID Card PDF (Module 2)
 */
export async function generateIdCardPdf(
  data: IdCardData,
  adminClient: ReturnType<typeof createAdminClient>,
  origin = "https://letsmakebrand.com"
) {
  const verifyRef = `LMB-VER-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const verifyUrl = `${origin}/verify/id/${verifyRef}`;

  // Generate QR Code PNG data url
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 200,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  // Extract base64 bytes for pdf-lib
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  const qrImageBytes = Buffer.from(qrBase64, "base64");

  // Create PDF Document (Standard ID Card size: 320 x 200 points, landscape)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([320, 200]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  const isVendor = data.userRole === "vendor";
  const primaryColor = isVendor ? rgb(0.09, 0.38, 0.82) : rgb(0.08, 0.58, 0.53); // Blue or Teal

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 320,
    height: 200,
    color: rgb(0.98, 0.99, 1.0),
  });

  // Top Header Banner
  page.drawRectangle({
    x: 0,
    y: 155,
    width: 320,
    height: 45,
    color: primaryColor,
  });

  // Header Title
  page.drawText("LETS MAKE BRAND", {
    x: 14,
    y: 174,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(isVendor ? "OFFICIAL VENDOR AGENCY CREDENTIAL" : "AUTHORIZED PROMOTION PARTNER", {
    x: 14,
    y: 162,
    size: 7.5,
    font: fontBold,
    color: rgb(0.85, 0.92, 1),
  });

  // User Photo / Silhouette Placeholder Box
  page.drawRectangle({
    x: 14,
    y: 65,
    width: 75,
    height: 80,
    color: rgb(0.92, 0.94, 0.98),
    borderColor: rgb(0.8, 0.85, 0.92),
    borderWidth: 1,
  });

  page.drawText(data.fullName.slice(0, 2).toUpperCase(), {
    x: 37,
    y: 100,
    size: 20,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText("VERIFIED", {
    x: 28,
    y: 72,
    size: 7,
    font: fontBold,
    color: rgb(0.1, 0.6, 0.2),
  });

  // User Details Column
  const textX = 100;
  page.drawText(data.fullName.toUpperCase(), {
    x: textX,
    y: 132,
    size: 11,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });

  page.drawText(data.roleTitle, {
    x: textX,
    y: 120,
    size: 8,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });

  // Details Grid
  page.drawText("ID NUMBER:", {
    x: textX,
    y: 100,
    size: 7,
    font: fontBold,
    color: rgb(0.4, 0.45, 0.55),
  });
  page.drawText(data.userCode, {
    x: textX + 50,
    y: 100,
    size: 8,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });

  page.drawText("ISSUED ON:", {
    x: textX,
    y: 86,
    size: 7,
    font: fontBold,
    color: rgb(0.4, 0.45, 0.55),
  });
  page.drawText(data.issueDate || new Date().toISOString().split("T")[0], {
    x: textX + 50,
    y: 86,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText("VALIDITY:", {
    x: textX,
    y: 72,
    size: 7,
    font: fontBold,
    color: rgb(0.4, 0.45, 0.55),
  });
  page.drawText("ACTIVE & VERIFIED", {
    x: textX + 50,
    y: 72,
    size: 7.5,
    font: fontBold,
    color: rgb(0.05, 0.6, 0.2),
  });

  // Embed QR Code on Right
  page.drawImage(qrImage, {
    x: 235,
    y: 65,
    width: 70,
    height: 70,
  });

  page.drawText("SCAN TO VERIFY", {
    x: 242,
    y: 55,
    size: 6,
    font: fontBold,
    color: rgb(0.4, 0.45, 0.55),
  });

  // Bottom Footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 320,
    height: 24,
    color: rgb(0.1, 0.13, 0.18),
  });

  page.drawText(data.officialWebsite || "www.letsmakebrand.com", {
    x: 14,
    y: 8,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.9, 0.92, 0.96),
  });

  page.drawText(`REF: ${verifyRef.slice(0, 16)}`, {
    x: 220,
    y: 8,
    size: 6.5,
    font: fontRegular,
    color: rgb(0.6, 0.65, 0.75),
  });

  const pdfBytes = await pdfDoc.save();
  const docCode = `LMB-DOC-${String(Math.floor(Math.random() * 900000) + 100000)}`;

  // Save in generated_documents
  await adminClient.from("generated_documents").insert({
    doc_code: docCode,
    user_id: data.userId,
    document_type: "id_card",
    title: `${data.fullName} - Official ID Card`,
    verification_reference: verifyRef,
    metadata: {
      userCode: data.userCode,
      roleTitle: data.roleTitle,
      userRole: data.userRole,
      issueDate: data.issueDate || new Date().toISOString().split("T")[0],
    },
    issue_date: data.issueDate || new Date().toISOString().split("T")[0],
    is_valid: true,
  });

  await logAuditEvent({
    userId: data.userId,
    action: "ID_CARD_GENERATED",
    entityType: "generated_documents",
    entityId: docCode,
    details: { docCode, verifyRef },
  });

  return {
    pdfBytes,
    docCode,
    verificationReference: verifyRef,
    base64: Buffer.from(pdfBytes).toString("base64"),
  };
}

/**
 * Generate official corporate Offer Letter / Appointment Agreement PDF (Module 3)
 */
export async function generateOfferLetterPdf(
  data: OfferLetterData,
  adminClient: ReturnType<typeof createAdminClient>
) {
  // Fetch template from database
  const templateType = data.userRole === "vendor" ? "offer_letter_vendor" : "offer_letter_partner";
  const { data: template } = await adminClient
    .from("document_templates")
    .select("*")
    .eq("template_type", templateType)
    .maybeSingle();

  const companyName = template?.company_name || "Lets Make Brand Platforms Pvt. Ltd.";
  const companyAddress = template?.company_address || "123 Business Boulevard, Financial District, Cyber City, Bangalore, KA 560001";
  const signatoryName = template?.signatory_name || "Executive Director";
  const signatoryTitle = template?.signatory_title || "Head of Compliance & Partner Relations";

  // Create A4 PDF (595 x 842 points)
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const docCode = `LMB-DOC-${String(Math.floor(Math.random() * 900000) + 100000)}`;
  const verifyRef = `LMB-VER-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const issueDate = data.issueDate || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  // Header Letterhead
  page.drawRectangle({
    x: 0,
    y: 770,
    width: 595,
    height: 72,
    color: rgb(0.06, 0.16, 0.35),
  });

  page.drawText(companyName.toUpperCase(), {
    x: 40,
    y: 805,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText("CORPORATE PROMOTION & BRAND ENGAGEMENT NETWORK", {
    x: 40,
    y: 790,
    size: 8,
    font: fontRegular,
    color: rgb(0.8, 0.88, 1),
  });

  page.drawText(companyAddress, {
    x: 40,
    y: 778,
    size: 7,
    font: fontRegular,
    color: rgb(0.7, 0.8, 0.95),
  });

  // Reference & Date
  page.drawText(`Ref: ${docCode}`, {
    x: 40,
    y: 740,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText(`Date: ${issueDate}`, {
    x: 450,
    y: 740,
    size: 9,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  // Recipient Block
  page.drawText("CONFIDENTIAL & PRIVILEGED", {
    x: 40,
    y: 710,
    size: 8,
    font: fontBold,
    color: rgb(0.7, 0.2, 0.2),
  });

  page.drawText(`To,\n${data.fullName.toUpperCase()}`, {
    x: 40,
    y: 690,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.12, 0.18),
  });

  page.drawText(`Account ID: ${data.userCode}`, {
    x: 40,
    y: 665,
    size: 9,
    font: fontBold,
    color: rgb(0.09, 0.38, 0.82),
  });

  // Subject
  const roleName = data.userRole === "vendor" ? "Accredited Agency Vendor" : "Independent Brand Promotion Partner";
  page.drawText(`Subject: Appointment Letter for ${roleName}`, {
    x: 40,
    y: 635,
    size: 11,
    font: fontBold,
    color: rgb(0.06, 0.16, 0.35),
  });

  // Body Content Paragraphs
  const p1 = `Dear ${data.fullName},`;
  const p2 = `We are pleased to formally appoint you as an ${roleName} with ${companyName}. Based on your credential review and platform onboarding, you are authorized to promote verified campaigns hosted on our corporate platform.`;
  const p3 = data.userRole === "vendor"
    ? "As an Accredited Vendor, you are empowered to mobilize promotional teams, manage squad operations, and configure commission allocations in accordance with platform maximum limits."
    : "As an Independent Partner, you will receive commission accruals directly into your secure wallet for every approved, genuine customer lead verified by our automated audit engine.";
  const p4 = "Engagement Terms & Compliance Obligations:";
  const p5 = "1. Ethical Promotion: You agree to uphold all platform advertising guidelines and refrain from deceptive practices.\n2. Remuneration: All commissions are disbursed according to verified milestones and wallet withdrawal thresholds.\n3. Confidentiality: Campaign specifications and client details remain proprietary and protected by confidentiality mandates.";

  let curY = 605;
  page.drawText(p1, { x: 40, y: curY, size: 9.5, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
  curY -= 20;

  // Render wrapped paragraphs
  const renderParagraph = (text: string, yPos: number, size = 8.5) => {
    const lines = text.split("\n");
    let y = yPos;
    for (const line of lines) {
      page.drawText(line, { x: 40, y, size, font: fontRegular, color: rgb(0.2, 0.22, 0.26) });
      y -= 14;
    }
    return y;
  };

  curY = renderParagraph(p2, curY);
  curY -= 8;
  curY = renderParagraph(p3, curY);
  curY -= 12;

  page.drawText(p4, { x: 40, y: curY, size: 9, font: fontBold, color: rgb(0.1, 0.12, 0.18) });
  curY -= 16;
  curY = renderParagraph(p5, curY);
  curY -= 25;

  page.drawText("We warmly welcome you to the LMB network and anticipate a mutually rewarding partnership.", {
    x: 40,
    y: curY,
    size: 8.5,
    font: fontItalic,
    color: rgb(0.2, 0.25, 0.35),
  });

  // Signatory Box
  const sigY = 160;
  page.drawText("Sincerely,", { x: 40, y: sigY + 40, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
  page.drawText(`For ${companyName}`, { x: 40, y: sigY + 25, size: 9, font: fontBold, color: rgb(0.06, 0.16, 0.35) });

  page.drawText("[Digitally Signed by Authorized Officer]", {
    x: 40,
    y: sigY - 10,
    size: 7.5,
    font: fontItalic,
    color: rgb(0.4, 0.45, 0.55),
  });

  page.drawText(signatoryName, { x: 40, y: sigY - 26, size: 9.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(signatoryTitle, { x: 40, y: sigY - 38, size: 8, font: fontRegular, color: rgb(0.3, 0.35, 0.45) });

  // Verification Seal
  page.drawRectangle({
    x: 400,
    y: sigY - 45,
    width: 155,
    height: 70,
    borderColor: rgb(0.09, 0.38, 0.82),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 1),
  });

  page.drawText("OFFICIAL SEAL OF AUTHENTICITY", {
    x: 410,
    y: sigY + 10,
    size: 6.5,
    font: fontBold,
    color: rgb(0.09, 0.38, 0.82),
  });

  page.drawText("VERIFIED BY LMB REGISTRY", {
    x: 410,
    y: sigY - 5,
    size: 7,
    font: fontBold,
    color: rgb(0.1, 0.55, 0.2),
  });

  page.drawText(`Doc ID: ${docCode}`, {
    x: 410,
    y: sigY - 20,
    size: 6.5,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });

  page.drawText(`Security Ref: ${verifyRef.slice(0, 14)}`, {
    x: 410,
    y: sigY - 32,
    size: 6.5,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  // Footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595,
    height: 30,
    color: rgb(0.06, 0.16, 0.35),
  });

  page.drawText("Lets Make Brand Platforms &bull; Corporate Appointment Document &bull; Strictly Confidential", {
    x: 40,
    y: 11,
    size: 7,
    font: fontRegular,
    color: rgb(0.85, 0.9, 0.98),
  });

  const pdfBytes = await pdfDoc.save();

  // Save in generated_documents
  await adminClient.from("generated_documents").insert({
    doc_code: docCode,
    user_id: data.userId,
    document_type: "offer_letter",
    title: `${data.fullName} - Appointment Offer Letter`,
    verification_reference: verifyRef,
    metadata: {
      userCode: data.userCode,
      userRole: data.userRole,
      roleName,
      companyName,
      signatoryName,
    },
    issue_date: new Date().toISOString().split("T")[0],
    is_valid: true,
  });

  await logAuditEvent({
    userId: data.userId,
    action: "OFFER_LETTER_GENERATED",
    entityType: "generated_documents",
    entityId: docCode,
    details: { docCode, verifyRef },
  });

  return {
    pdfBytes,
    docCode,
    verificationReference: verifyRef,
    base64: Buffer.from(pdfBytes).toString("base64"),
  };
}

/**
 * Public ID Verification check by verification reference (Module 2)
 * Security rule: Zero private PII leaked (no phone, email, address, or banking).
 */
export async function verifyDocumentByReference(
  ref: string,
  adminClient: ReturnType<typeof createAdminClient>
) {
  const { data: doc } = await adminClient
    .from("generated_documents")
    .select("*, user:user_id (id, full_name, profile_code, business_name)")
    .eq("verification_reference", ref)
    .maybeSingle();

  if (!doc) {
    return { isValid: false, error: "Invalid or unrecognized document verification reference." };
  }

  const user = Array.isArray(doc.user) ? doc.user[0] : doc.user;
  const meta = (doc.metadata as any) || {};

  return {
    isValid: doc.is_valid,
    docCode: doc.doc_code,
    documentType: doc.document_type,
    title: doc.title,
    issueDate: doc.issue_date,
    cardholderName: user?.full_name || "Authorized Affiliate",
    identifierCode: meta.userCode || user?.profile_code || "LMB-ID",
    designation: meta.roleTitle || meta.roleName || "Accredited Member",
    organization: "Lets Make Brand Platforms",
    verificationStatus: doc.is_valid ? "Valid & Verified" : "Revoked / Expired",
  };
}
