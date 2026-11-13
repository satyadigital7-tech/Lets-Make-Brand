"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { reportFilterSchema, ReportFilterFormData } from "@/lib/security/validation";
import { generateCsvReport, generatePdfReport } from "@/lib/services/reports";

/**
 * Super Admin or authorized Admin triggers a real database report export (Module 6 & 8)
 */
export async function exportReportAction(data: ReportFilterFormData) {
  const user = await requireRole(["super_admin", "admin", "vendor"]);
  const validated = reportFilterSchema.parse(data);
  const adminClient = createAdminClient();

  if (validated.format === "pdf") {
    const result = await generatePdfReport(user.id, validated, adminClient);
    revalidatePath("/dashboard/super-admin/reports");
    revalidatePath("/dashboard/admin/reports");
    return {
      success: true,
      format: "pdf",
      exportCode: result.exportCode,
      base64: result.base64,
    };
  } else {
    const result = await generateCsvReport(user.id, validated, adminClient);
    revalidatePath("/dashboard/super-admin/reports");
    revalidatePath("/dashboard/admin/reports");
    return {
      success: true,
      format: "csv",
      exportCode: result.exportCode,
      csvContent: result.csvContent,
      rowCount: result.rowCount,
    };
  }
}
