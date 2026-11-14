import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminRootPage() {
  const user = await getCurrentUser();

  if (user && user.roles.includes("super_admin")) {
    redirect("/dashboard/super-admin");
  }

  redirect("/admin/login");
}
