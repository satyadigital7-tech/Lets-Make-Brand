import React from "react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { PartnerLinksView } from "./partner-links-view";

export const dynamic = "force-dynamic";

export default async function PartnerLinksPage() {
  const user = await requireRole(["independent_partner", "team_leader", "team_member", "super_admin"]);
  const supabase = await createClient();

  // Fetch all active campaigns
  const { data: campaignsData } = await supabase
    .from("campaigns")
    .select("id, title, slug, category, commission_rate, commission_type, brand_name, target_audience")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const campaigns = campaignsData || [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://letsmakebrand.co.in";
  const partnerCode = user.profile?.referral_code || user.id.slice(0, 8).toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotional Links & Channel Tracking"
        description="Generate trackable referral URLs, custom Sub-IDs, and print-ready QR codes for all verified brand campaigns."
        badge="Real-Time Attribution"
      />

      <PartnerLinksView
        partnerId={user.id}
        partnerCode={partnerCode}
        campaigns={campaigns}
        siteUrl={siteUrl}
      />
    </div>
  );
}
