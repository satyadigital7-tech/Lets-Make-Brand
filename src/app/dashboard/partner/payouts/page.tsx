import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PartnerPayoutsPage() {
  await requireRole(["independent_partner", "team_leader", "team_member", "super_admin"]);
  redirect("/dashboard/partner/wallet");
}

