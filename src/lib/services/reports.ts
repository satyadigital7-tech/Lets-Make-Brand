import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { createAdminClient } from "@/lib/supabase/admin";
import { ReportFilterFormData } from "@/lib/security/validation";
import { logAuditEvent } from "@/lib/security/audit";

export interface PlatformReportMetrics {
  users: {
    totalVendors: number;
    totalPartners: number;
    activeAccounts: number;
    pendingAccounts: number;
    suspendedAccounts: number;
  };
  campaigns: {
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    draftCampaigns: number;
  };
  leads: {
    totalLeads: number;
    approvedLeads: number;
    pendingLeads: number;
    rejectedLeads: number;
    duplicateLeads: number;
  };
  financial: {
    totalCommission: number;
    vendorEarnings: number;
    partnerEarnings: number;
    availableWalletLiabilities: number;
    reservedQueue: number;
    totalPaidWithdrawals: number;
  };
  kyc: {
    totalSubmitted: number;
    approvedKyc: number;
    pendingKyc: number;
    rejectedKyc: number;
  };
  support: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
  };
}

/**
 * Aggregate real database statistics for platform reporting (Module 6)
 * Never returns fabricated figures.
 */
export async function fetchPlatformReportMetrics(
  adminClient: ReturnType<typeof createAdminClient>,
  filters?: { startDate?: string; endDate?: string }
): Promise<PlatformReportMetrics> {
  // 1. Users
  const { data: userRoles } = await adminClient
    .from("user_roles")
    .select("role_code, user:user_id (id, status)");

  let totalVendors = 0;
  let totalPartners = 0;
  let activeAccounts = 0;
  let pendingAccounts = 0;
  let suspendedAccounts = 0;

  for (const ur of (userRoles as any[]) || []) {
    const role = ur.role_code;
    const st = ur.user?.status;
    if (role === "vendor") totalVendors++;
    if (role === "independent_partner" || role === "team_member") totalPartners++;
    if (st === "active") activeAccounts++;
    else if (st === "pending_approval" || st === "pending_verification") pendingAccounts++;
    else if (st === "suspended" || st === "rejected") suspendedAccounts++;
  }

  // 2. Campaigns
  const { data: campaigns } = await adminClient.from("campaigns").select("status");
  let totalCampaigns = 0;
  let activeCampaigns = 0;
  let completedCampaigns = 0;
  let draftCampaigns = 0;

  for (const c of (campaigns as any[]) || []) {
    totalCampaigns++;
    if (c.status === "active") activeCampaigns++;
    else if (c.status === "completed") completedCampaigns++;
    else if (c.status === "draft") draftCampaigns++;
  }

  // 3. Leads
  let leadsQuery = adminClient.from("leads").select("status, is_duplicate, created_at");
  if (filters?.startDate) leadsQuery = leadsQuery.gte("created_at", filters.startDate);
  if (filters?.endDate) leadsQuery = leadsQuery.lte("created_at", filters.endDate);

  const { data: leads } = await leadsQuery;
  let totalLeads = 0;
  let approvedLeads = 0;
  let pendingLeads = 0;
  let rejectedLeads = 0;
  let duplicateLeads = 0;

  for (const l of (leads as any[]) || []) {
    totalLeads++;
    if (l.is_duplicate) duplicateLeads++;
    if (l.status === "approved") approvedLeads++;
    else if (l.status === "pending" || l.status === "under_verification") pendingLeads++;
    else if (l.status === "rejected") rejectedLeads++;
  }

  // 4. Financials (commission_transactions & wallets & payments)
  let commQuery = adminClient
    .from("commission_transactions")
    .select("commission_amount, beneficiary_role, transaction_type, commission_status, created_at");
  if (filters?.startDate) commQuery = commQuery.gte("created_at", filters.startDate);
  if (filters?.endDate) commQuery = commQuery.lte("created_at", filters.endDate);

  const { data: comms } = await commQuery;
  let totalCommission = 0;
  let vendorEarnings = 0;
  let partnerEarnings = 0;

  for (const t of (comms as any[]) || []) {
    const amt = Number(t.commission_amount || 0);
    if (t.transaction_type === "credit" && t.commission_status === "approved") {
      totalCommission += amt;
      if (t.beneficiary_role === "vendor") vendorEarnings += amt;
      else partnerEarnings += amt;
    } else if (t.transaction_type === "reversal") {
      totalCommission -= amt;
      if (t.beneficiary_role === "vendor") vendorEarnings -= amt;
      else partnerEarnings -= amt;
    }
  }

  const { data: wallets } = await adminClient
    .from("wallets")
    .select("available_balance, reserved_balance, total_withdrawn");

  let availableWalletLiabilities = 0;
  let reservedQueue = 0;
  let totalPaidWithdrawals = 0;

  for (const w of (wallets as any[]) || []) {
    availableWalletLiabilities += Number(w.available_balance || 0);
    reservedQueue += Number(w.reserved_balance || 0);
    totalPaidWithdrawals += Number(w.total_withdrawn || 0);
  }

  // 5. KYC
  const { data: kyc } = await adminClient.from("kyc_records").select("status");
  let totalSubmitted = 0;
  let approvedKyc = 0;
  let pendingKyc = 0;
  let rejectedKyc = 0;

  for (const k of (kyc as any[]) || []) {
    totalSubmitted++;
    if (k.status === "approved") approvedKyc++;
    else if (k.status === "pending" || k.status === "under_review") pendingKyc++;
    else if (k.status === "rejected") rejectedKyc++;
  }

  // 6. Support Tickets
  const { data: tickets } = await adminClient.from("support_tickets").select("status");
  let totalTickets = 0;
  let openTickets = 0;
  let resolvedTickets = 0;

  for (const s of (tickets as any[]) || []) {
    totalTickets++;
    if (s.status === "open" || s.status === "in_progress") openTickets++;
    else if (s.status === "resolved" || s.status === "closed") resolvedTickets++;
  }

  return {
    users: {
      totalVendors,
      totalPartners,
      activeAccounts,
      pendingAccounts,
      suspendedAccounts,
    },
    campaigns: {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      draftCampaigns,
    },
    leads: {
      totalLeads,
      approvedLeads,
      pendingLeads,
      rejectedLeads,
      duplicateLeads,
    },
    financial: {
      totalCommission,
      vendorEarnings,
      partnerEarnings,
      availableWalletLiabilities,
      reservedQueue,
      totalPaidWithdrawals,
    },
    kyc: {
      totalSubmitted,
      approvedKyc,
      pendingKyc,
      rejectedKyc,
    },
    support: {
      totalTickets,
      openTickets,
      resolvedTickets,
    },
  };
}

/**
 * Generate real CSV export from PostgreSQL records (Module 6 & 8)
 */
export async function generateCsvReport(
  userId: string,
  filter: ReportFilterFormData,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<{ csvContent: string; rowCount: number; exportCode: string }> {
  let rows: any[] = [];
  let header = "";

  if (filter.reportType === "leads") {
    let q = adminClient.from("leads").select("lead_code, customer_name, customer_mobile, customer_email, status, commission_amount, is_duplicate, created_at");
    if (filter.startDate) q = q.gte("created_at", filter.startDate);
    if (filter.endDate) q = q.lte("created_at", filter.endDate);
    const { data } = await q;
    rows = data || [];
    header = "Lead Code,Customer Name,Mobile,Email,Status,Commission Amount,Is Duplicate,Created At\n";
    const body = rows.map((r) =>
      `"${r.lead_code}","${r.customer_name}","${r.customer_mobile}","${r.customer_email}","${r.status}","${r.commission_amount || 0}","${r.is_duplicate}","${r.created_at}"`
    ).join("\n");
    const csvContent = header + body;
    const exportCode = `LMB-EXP-${String(Math.floor(Math.random() * 900000) + 100000)}`;

    await adminClient.from("report_exports").insert({
      export_code: exportCode,
      user_id: userId,
      report_type: filter.reportType,
      export_format: "csv",
      filters: filter as any,
      row_count: rows.length,
      status: "completed",
    });

    return { csvContent, rowCount: rows.length, exportCode };
  }

  if (filter.reportType === "financial") {
    let q = adminClient.from("commission_transactions").select("transaction_code, lead_id, beneficiary_role, commission_amount, transaction_type, commission_status, created_at");
    if (filter.startDate) q = q.gte("created_at", filter.startDate);
    if (filter.endDate) q = q.lte("created_at", filter.endDate);
    const { data } = await q;
    rows = data || [];
    header = "Transaction Code,Beneficiary Role,Amount,Type,Status,Created At\n";
    const body = rows.map((r) =>
      `"${r.transaction_code}","${r.beneficiary_role}","${r.commission_amount}","${r.transaction_type}","${r.commission_status}","${r.created_at}"`
    ).join("\n");
    const csvContent = header + body;
    const exportCode = `LMB-EXP-${String(Math.floor(Math.random() * 900000) + 100000)}`;

    await adminClient.from("report_exports").insert({
      export_code: exportCode,
      user_id: userId,
      report_type: filter.reportType,
      export_format: "csv",
      filters: filter as any,
      row_count: rows.length,
      status: "completed",
    });

    return { csvContent, rowCount: rows.length, exportCode };
  }

  // Default Users Export
  let uq = adminClient.from("profiles").select("profile_code, full_name, email, phone, status, created_at");
  const { data: usersData } = await uq;
  rows = usersData || [];
  header = "Profile Code,Name,Email,Mobile,Status,Created At\n";
  const body = rows.map((r) =>
    `"${r.profile_code || "N/A"}","${r.full_name || ""}","${r.email}","${r.phone || ""}","${r.status}","${r.created_at}"`
  ).join("\n");
  const csvContent = header + body;
  const exportCode = `LMB-EXP-${String(Math.floor(Math.random() * 900000) + 100000)}`;

  await adminClient.from("report_exports").insert({
    export_code: exportCode,
    user_id: userId,
    report_type: filter.reportType,
    export_format: "csv",
    filters: filter as any,
    row_count: rows.length,
    status: "completed",
  });

  return { csvContent, rowCount: rows.length, exportCode };
}

/**
 * Generate real PDF Executive Report using pdf-lib (Module 6 & 8)
 */
export async function generatePdfReport(
  userId: string,
  filter: ReportFilterFormData,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<{ pdfBytes: Uint8Array; exportCode: string; base64: string }> {
  const metrics = await fetchPlatformReportMetrics(adminClient, {
    startDate: filter.startDate,
    endDate: filter.endDate,
  });

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const exportCode = `LMB-EXP-${String(Math.floor(Math.random() * 900000) + 100000)}`;
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: 770,
    width: 595,
    height: 72,
    color: rgb(0.06, 0.16, 0.35),
  });

  page.drawText("LETS MAKE BRAND PLATFORMS", {
    x: 40,
    y: 808,
    size: 15,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`OFFICIAL EXECUTIVE INTELLIGENCE REPORT &bull; ${filter.reportType.toUpperCase()}`, {
    x: 40,
    y: 792,
    size: 8.5,
    font: fontBold,
    color: rgb(0.8, 0.88, 1),
  });

  page.drawText(`Generated on: ${dateStr} | Reference ID: ${exportCode}`, {
    x: 40,
    y: 778,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.7, 0.8, 0.95),
  });

  let curY = 730;

  // Section 1: Executive KPI Summary Box
  page.drawRectangle({
    x: 40,
    y: curY - 90,
    width: 515,
    height: 90,
    color: rgb(0.97, 0.98, 1),
    borderColor: rgb(0.8, 0.86, 0.95),
    borderWidth: 1,
  });

  page.drawText("EXECUTIVE PERFORMANCE SUMMARY", {
    x: 55,
    y: curY - 20,
    size: 10,
    font: fontBold,
    color: rgb(0.06, 0.16, 0.35),
  });

  page.drawText(`Total Brand Campaigns: ${metrics.campaigns.totalCampaigns} (${metrics.campaigns.activeCampaigns} Active)`, {
    x: 55,
    y: curY - 40,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText(`Audited Leads: ${metrics.leads.totalLeads} | Approved: ${metrics.leads.approvedLeads} | Rejections: ${metrics.leads.rejectedLeads}`, {
    x: 55,
    y: curY - 55,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText(`Total Platform Commissions Generated: ₹${metrics.financial.totalCommission.toLocaleString("en-IN")}`, {
    x: 55,
    y: curY - 70,
    size: 9,
    font: fontBold,
    color: rgb(0.08, 0.58, 0.53),
  });

  curY -= 120;

  // Section 2: Detailed KPI Table Breakdown
  const drawRow = (label: string, value: string, yPos: number, isHeader = false) => {
    page.drawText(label, {
      x: 45,
      y: yPos,
      size: isHeader ? 9 : 8.5,
      font: isHeader ? fontBold : fontRegular,
      color: isHeader ? rgb(0.06, 0.16, 0.35) : rgb(0.15, 0.2, 0.3),
    });
    page.drawText(value, {
      x: 450,
      y: yPos,
      size: isHeader ? 9 : 8.5,
      font: isHeader ? fontBold : fontRegular,
      color: isHeader ? rgb(0.06, 0.16, 0.35) : rgb(0.1, 0.1, 0.1),
    });
    page.drawLine({
      start: { x: 40, y: yPos - 6 },
      end: { x: 555, y: yPos - 6 },
      color: rgb(0.9, 0.92, 0.96),
      thickness: 0.8,
    });
    return yPos - 22;
  };

  curY = drawRow("METRIC CLASSIFICATION", "AUDITED QUANTITY / VALUE", curY, true);
  curY = drawRow("Registered Enterprise Vendors", `${metrics.users.totalVendors}`, curY);
  curY = drawRow("Registered Brand Promotion Partners", `${metrics.users.totalPartners}`, curY);
  curY = drawRow("Active Verified User Accounts", `${metrics.users.activeAccounts}`, curY);
  curY = drawRow("Pending Approval Pipeline", `${metrics.users.pendingAccounts}`, curY);
  curY = drawRow("Completed Brand Campaigns", `${metrics.campaigns.completedCampaigns}`, curY);
  curY = drawRow("Duplicate Leads Identified & Blocked", `${metrics.leads.duplicateLeads}`, curY);
  curY = drawRow("Total Partner Payout Accruals", `₹${metrics.financial.partnerEarnings.toLocaleString("en-IN")}`, curY);
  curY = drawRow("Total Vendor Agency Overrides", `₹${metrics.financial.vendorEarnings.toLocaleString("en-IN")}`, curY);
  curY = drawRow("Available Wallet Liabilities (Spendable)", `₹${metrics.financial.availableWalletLiabilities.toLocaleString("en-IN")}`, curY);
  curY = drawRow("Withdrawal In-Queue Reserved Funds", `₹${metrics.financial.reservedQueue.toLocaleString("en-IN")}`, curY);
  curY = drawRow("Completed Manual Payout Remittances", `₹${metrics.financial.totalPaidWithdrawals.toLocaleString("en-IN")}`, curY);
  curY = drawRow("Verified KYC Applications", `${metrics.kyc.approvedKyc}`, curY);
  curY = drawRow("Resolved Support Inquiries", `${metrics.support.resolvedTickets}`, curY);

  // Footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 595,
    height: 30,
    color: rgb(0.06, 0.16, 0.35),
  });

  page.drawText("LMB Official Database Intelligence &bull; Strictly Confidential &bull; Generated from Live PostgreSQL Records", {
    x: 40,
    y: 11,
    size: 7,
    font: fontRegular,
    color: rgb(0.85, 0.9, 0.98),
  });

  const pdfBytes = await pdfDoc.save();

  await adminClient.from("report_exports").insert({
    export_code: exportCode,
    user_id: userId,
    report_type: filter.reportType,
    export_format: "pdf",
    filters: filter as any,
    row_count: 14,
    status: "completed",
  });

  await logAuditEvent({
    userId,
    action: "REPORT_EXPORTED",
    entityType: "report_exports",
    entityId: exportCode,
    details: { reportType: filter.reportType, format: "pdf" },
  });

  return {
    pdfBytes,
    exportCode,
    base64: Buffer.from(pdfBytes).toString("base64"),
  };
}
