import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Award,
  CheckCircle2,
  Users2,
  Store,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();

  // Query actual live campaigns from PostgreSQL database
  let featuredCampaigns: any[] = [];
  try {
    const { data } = await supabase
      .from("campaigns")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(3);

    featuredCampaigns = data || [];
  } catch {
    featuredCampaigns = [];
  }

  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))]" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span>Phase 1 Enterprise Architecture Live</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise Partner &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300">
                Brand Promotion
              </span>{" "}
              Platform
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              Connect verified enterprise brands with high-performance partner networks. 
              Built on transparent attribution, real-time PostgreSQL ledger security, and role-based operational governance.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register?role=independent_partner" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 font-semibold shadow-lg shadow-blue-600/30">
                  <span>Become a Partner</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/become-vendor" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700"
                >
                  <span>Register as Brand Vendor</span>
                </Button>
              </Link>
            </div>

            <div className="pt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero Fabricated Metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>PostgreSQL Row Level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Granular RBAC Authorization</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PILLARS */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="brand">The LMB Ecosystem</Badge>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Built for Scale, Brand Safety & Mutual Growth
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Engineered with enterprise security standards to eliminate attribution leakage and empower promotional channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-slate-200 hover:border-blue-300 transition-all shadow-sm">
              <CardContent className="p-8 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <Store className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">For Brand Vendors</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Publish high-converting promotional campaigns with verified budgets, custom commission tiers, and transparent attribution reporting.
                </p>
                <Link
                  href="/become-vendor"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline pt-2"
                >
                  <span>Vendor Solutions</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:border-blue-300 transition-all shadow-sm">
              <CardContent className="p-8 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                  <Users2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">For Partners & Agencies</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Join as an Independent Partner or organize squads under Team Leaders. Access verified campaigns with guaranteed payout terms.
                </p>
                <Link
                  href="/become-partner"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:underline pt-2"
                >
                  <span>Partner Benefits</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-slate-200 hover:border-blue-300 transition-all shadow-sm">
              <CardContent className="p-8 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Enterprise Security</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Every transaction is secured by PostgreSQL Row Level Security, default-deny authorization rules, and immutable audit logging.
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline pt-2"
                >
                  <span>Architecture & Security</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* LIVE VERIFIED CAMPAIGNS (ACTUAL POSTGRESQL RECORDS ONLY) */}
      <section className="py-20 bg-slate-50/70 border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-2">
              <Badge variant="brand">Live Database Records</Badge>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Verified Active Campaigns
              </h2>
              <p className="text-slate-500 text-sm max-w-xl">
                Queried directly from PostgreSQL. LMB strictly presents real brand campaigns verified by our compliance team.
              </p>
            </div>
            <Link href="/campaigns">
              <Button variant="outline" className="gap-2">
                <span>View All Campaigns</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCampaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="border-slate-200 bg-white hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="font-semibold text-xs">
                        {campaign.category}
                      </Badge>
                      <Badge variant="success" className="text-xs">
                        Verified Active
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-snug">
                        {campaign.title}
                      </h3>
                      <p className="text-slate-500 text-xs mt-2 line-clamp-3 leading-relaxed">
                        {campaign.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                          Commission Rate
                        </span>
                        <span className="text-lg font-extrabold text-blue-600">
                          {campaign.commission_type === "percentage"
                            ? `${campaign.commission_rate}%`
                            : formatCurrency(campaign.commission_rate)}
                        </span>
                      </div>
                      <Link href={`/campaigns`}>
                        <Button size="sm" variant="ghost" className="text-xs font-semibold">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 bg-white">
              <Layers className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                No active campaigns in database yet
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Execute the PostgreSQL seed migration (00003_seed_data.sql) to populate live campaigns.
              </p>
              <Link href="/register?role=vendor">
                <Button size="sm">Register as First Vendor</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS HIGHLIGHT */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="brand">Operational Workflow</Badge>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              How the LMB Platform Works
            </h2>
            <p className="text-slate-500 text-sm">
              Transparent 4-step execution model connecting brands with promotional partners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white font-extrabold text-sm">
                01
              </div>
              <h4 className="text-base font-bold text-slate-900">Identity & Verification</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Vendors and partners create verified enterprise profiles. Privileged access is strictly governed.
              </p>
            </div>

            <div className="space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-sm">
                02
              </div>
              <h4 className="text-base font-bold text-slate-900">Campaign Publication</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Brands publish campaigns with predefined commission rates, target criteria, and verified budgets.
              </p>
            </div>

            <div className="space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-extrabold text-sm">
                03
              </div>
              <h4 className="text-base font-bold text-slate-900">Promotion & Squads</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Independent partners and structured team leader squads promote campaigns across approved channels.
              </p>
            </div>

            <div className="space-y-3 relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white font-extrabold text-sm">
                04
              </div>
              <h4 className="text-base font-bold text-slate-900">Attribution & Payouts</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Leads and conversions are validated with audit tracking and transparent wallet settlement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="bg-slate-950 py-16 text-white border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to Accelerate Your Brand or Promotional Network?
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Join the Lets Make Brand partner ecosystem today. Registration is fast, verified, and free of fabricated claims.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto font-semibold bg-blue-600 hover:bg-blue-700">
                Create Your Account
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-700 bg-slate-900 text-white hover:bg-slate-800">
                Contact Enterprise Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

