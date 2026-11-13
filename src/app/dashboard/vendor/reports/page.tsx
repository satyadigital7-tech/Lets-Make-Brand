import React from "react";
import { requireRole } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/dashboard/module-placeholder";

export const dynamic = "force-dynamic";

export default async function VendorReportsPage() {
  await requireRole(["vendor", "super_admin"]);

  return (
    <ModulePlaceholder
      moduleName="Brand Acquisition Analytics"
      phase="Phase 5"
      description="Analyze customer acquisition cost (CAC), partner conversion efficiency, and channel attribution funnels."
      features={[
        "Interactive conversion funnel analysis (Click → Lead → Conversion)",
        "Top-performing partner squads and affiliate ranking benchmarks",
        "Geographic and demographic customer breakdown charts",
        "Scheduled analytical performance reports exported to CSV and PDF",
      ]}
      backHref="/dashboard/vendor"
    />
  );
}

