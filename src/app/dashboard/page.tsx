import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { ROLE_CONFIGS } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const targetPath = ROLE_CONFIGS[user.primaryRole]?.defaultPath || "/dashboard/partner";
  redirect(targetPath);
}

