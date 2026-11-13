"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  supportTicketCreateSchema,
  SupportTicketCreateFormData,
  supportMessageSchema,
  SupportMessageFormData,
  supportTicketUpdateSchema,
  SupportTicketUpdateFormData,
} from "@/lib/security/validation";
import {
  createSupportTicket,
  addSupportMessage,
  updateSupportTicket,
} from "@/lib/services/support";

/**
 * User submits a new support ticket (Module 5)
 */
export async function createTicketAction(data: SupportTicketCreateFormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");

  const validated = supportTicketCreateSchema.parse(data);
  const adminClient = createAdminClient();

  const result = await createSupportTicket(
    user.id,
    user.primaryRole || "independent_partner",
    validated,
    adminClient
  );

  revalidatePath("/dashboard/support");
  revalidatePath("/dashboard/super-admin/support");
  revalidatePath("/dashboard/admin/support");

  return result;
}

/**
 * User or staff responds in a support ticket thread (Module 5)
 */
export async function postTicketMessageAction(data: SupportMessageFormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required.");

  const validated = supportMessageSchema.parse(data);
  const adminClient = createAdminClient();
  const isStaff = user.roles.includes("super_admin") || user.roles.includes("admin");

  const result = await addSupportMessage(
    user.id,
    user.primaryRole || "user",
    isStaff,
    validated,
    adminClient
  );

  revalidatePath("/dashboard/support");
  revalidatePath("/dashboard/super-admin/support");
  revalidatePath("/dashboard/admin/support");

  return result;
}

/**
 * Super Admin or authorized Admin updates ticket metadata (Module 5)
 */
export async function updateTicketStatusAction(data: SupportTicketUpdateFormData) {
  const user = await getCurrentUser();
  if (!user || (!user.roles.includes("super_admin") && !user.roles.includes("admin"))) {
    throw new Error("Unauthorized: Administrative privileges required.");
  }

  const validated = supportTicketUpdateSchema.parse(data);
  const adminClient = createAdminClient();

  const result = await updateSupportTicket(user.id, validated, adminClient);

  revalidatePath("/dashboard/support");
  revalidatePath("/dashboard/super-admin/support");
  revalidatePath("/dashboard/admin/support");

  return result;
}
