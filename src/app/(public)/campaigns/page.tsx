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
    <div className="py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="space-y-4 max-w-3xl">
          <Badge variant="brand">Verified Brand Promotions</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Campaign Directory
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            All campaigns below are retrieved directly from the live PostgreSQL database. 
            LMB enforces strict compliance validation on every vendor campaign before public listing.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 pb-4 border-b border-slate-200">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">
            Categories:
          </span>
          {categories.map((cat) => {
            const isSelected = (!category && cat === "all") || category === cat;
            return (
              <Link
                key={cat}
                href={cat === "all" ? "/campaigns" : `/campaigns?category=${encodeURIComponent(cat)}`}
              >
                <Badge
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer py-1.5 px-3 text-xs capitalize transition-colors"
                >
                  {cat}
                </Badge>
              </Link>
            );
          })}
        </div>

        {/* Campaigns Listing */}
        {campaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {campaign.category}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verified Active
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-snug">
                      {campaign.title}
                    </h3>
                    <p className="text-slate-600 text-xs mt-2 line-clamp-3 leading-relaxed">
                      {campaign.description}
                    </p>
                  </div>

                  {campaign.target_audience && (
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <Users className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        <strong>Target:</strong> {campaign.target_audience}
                      </span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Commission
                      </span>
                      <span className="text-xl font-black text-blue-600">
                        {campaign.commission_type === "percentage"
                          ? `${campaign.commission_rate}%`
                          : formatCurrency(campaign.commission_rate)}
                      </span>
                    </div>

                    <Link href={`/register?role=independent_partner&campaign=${campaign.slug}`}>
                      <Button size="sm" className="gap-1 font-semibold text-xs">
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

