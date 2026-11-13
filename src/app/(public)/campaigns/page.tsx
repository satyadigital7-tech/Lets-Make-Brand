import { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Search, ArrowRight, ShieldCheck, Tag, Users } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50/60 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-xs">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Verified Brand Promotions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Campaign Directory
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            All campaigns below are retrieved directly from the live PostgreSQL database. 
            LMB enforces strict compliance validation on every vendor campaign before public listing.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 pb-4 border-b border-slate-200/80">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
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
                      ? "bg-blue-600 text-white shadow-xs shadow-blue-500/20"
                      : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/90 shadow-2xs"
                  }`}
                >
                  {cat}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Campaigns Listing */}
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100/80">
                      {campaign.category}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      Verified Active
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-blue-600 transition-colors">
                      {campaign.title}
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm mt-2 line-clamp-3 leading-relaxed">
                      {campaign.description}
                    </p>
                  </div>

                  {campaign.target_audience && (
                    <div className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100/90">
                      <Users className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        <strong className="text-slate-700">Target:</strong> {campaign.target_audience}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Commission
                    </span>
                    <span className="text-2xl font-black text-blue-600 tracking-tight">
                      {campaign.commission_type === "percentage"
                        ? `${campaign.commission_rate}%`
                        : formatCurrency(campaign.commission_rate)}
                    </span>
                  </div>

                  <Link href={`/register?role=independent_partner&campaign=${campaign.slug}`}>
                    <Button size="sm" className="gap-1.5 font-semibold text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20 hover:shadow-md transition-all">
                      <span>Promote</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Megaphone className="h-8 w-8 text-slate-400" />}
            title="No campaigns found"
            description={
              category
                ? `No campaigns match the category "${category}" in the PostgreSQL database.`
                : "No active campaigns currently in the database. Ensure migration 00003_seed_data.sql has been executed, or register as a brand vendor to publish a campaign."
            }
            actionLabel={category ? "Clear Filters" : "Register as Vendor"}
            actionHref={category ? "/campaigns" : "/register?role=vendor"}
          />
        )}
      </div>
    </div>
  );
}

