import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function PartnerLinksPage() {
  await requireRole(["independent_partner", "team_leader", "team_member", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Promotional Links & Channel Tracking"
      phase="Phase 2"
      description="Create custom promotional sub-ID tracking links, QR codes, and smart deep links for social media, YouTube, and email campaigns."
      features={[
        "Custom UTM and sub-ID parameter generator for multi-channel tracking",
        "Dynamic QR code generator for offline and print promotional materials",
        "Deep linking to specific brand vendor product variants",
        "Real-time click counter and traffic referral telemetry",
      ]}
      backHref="/dashboard/partner"
    />
  );
}

