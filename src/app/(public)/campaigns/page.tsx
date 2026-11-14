import { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Search, ArrowRight, ShieldCheck, Tag, Users, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Campaign Directory - Lets Make Brand (LMB)",
  description: "Browse verified brand promotion campaigns directly from the LMB database.",
};

export const dynamic = "force-dynamic";

interface CampaignsPageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
}

export default async function CampaignsPage({ searchParams }: CampaignsPageProps) {
  const { category, q } = await searchParams;
  const supabase = await createClient();

  // Query actual active campaigns from PostgreSQL
  let campaignsQuery = supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (category && category !== "all") {
    campaignsQuery = campaignsQuery.eq("category", category);
  }

  if (q && q.trim()) {
    campaignsQuery = campaignsQuery.ilike("title", `%${q.trim()}%`);
  }

  let campaigns: any[] = [];
  try {
    const { data, error } = await campaignsQuery;
    if (!error && data) {
      campaigns = data;
    }
  } catch (err) {
    console.error("Failed to query campaigns from PostgreSQL:", err);
    campaigns = [];
  }

  // Retrieve distinct categories from database
  const categories = ["all", "SaaS & Cloud", "FinTech & Payments", "E-Commerce & Fashion", "Cyber Security", "HealthTech"];

  return (
    <div className="min-h-screen bg-[#F6F8FC] py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-[#EAF2FF] px-3.5 py-1 text-xs font-semibold text-[#092B63] shadow-xs">
            <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
            <span>Verified Brand Promotions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#172033] tracking-tight">
            Campaign Directory
          </h1>
          <p className="text-[#64748B] text-sm sm:text-base leading-relaxed">
            All campaigns below are retrieved directly from the live PostgreSQL database. 
            LMB enforces strict compliance validation on every vendor campaign before public listing.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 pb-4 border-b border-[#E2E8F0]">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider mr-2">
            Categories:
          </span>
          {categories.map((cat) => {
            const isSelected = (!category && cat === "all") || category === cat;
            return (
              <Link
                key={cat}
                href={cat === "all" ? "/campaigns" : `/campaigns?category=${encodeURIComponent(cat)}`}
              >
                <span
                  className={`inline-flex items-center cursor-pointer py-1.5 px-3.5 rounded-full text-xs font-semibold capitalize transition-all ${
                    isSelected
                      ? "bg-[#092B63] text-white shadow-xs"
                      : "bg-white text-[#64748B] hover:text-[#172033] hover:bg-[#F6F8FC] border border-[#E2E8F0]"
                  }`}
                >
                  {cat}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Campaign Cards Grid */}
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="border-[#E2E8F0] bg-white hover:border-[#092B63]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="font-semibold text-xs bg-[#EAF2FF] text-[#092B63] border-none">
                      {campaign.category}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Verified Active</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-lg font-bold text-[#172033] leading-snug">
                      {campaign.title}
                    </h2>
                    <p className="text-xs text-[#64748B] line-clamp-3 leading-relaxed">
                      {campaign.description}
                    </p>
                  </div>

                  {campaign.target_audience && (
                    <div className="p-3 rounded-lg bg-[#F6F8FC] border border-[#E2E8F0] text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider block">
                        Target Audience
                      </span>
                      <p className="text-xs text-[#172033] line-clamp-2">
                        {campaign.target_audience}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                        Commission
                      </span>
                      <span className="text-xl font-black text-[#2563EB]">
                        {campaign.commission_type === "percentage"
                          ? `${campaign.commission_rate}%`
                          : formatCurrency(campaign.commission_rate)}
                      </span>
                    </div>

                    <Link href={`/login`}>
                      <Button size="sm" className="gap-1.5 text-xs font-semibold bg-[#092B63] hover:bg-[#123D82] text-white">
                        <span>Promote</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No campaigns found"
            description={
              category
                ? `No active campaigns found in category "${category}".`
                : "No active campaigns currently match your filter criteria."
            }
            actionLabel="Reset Filters"
            actionHref="/campaigns"
          />
        )}
      </div>
    </div>
  );
}
