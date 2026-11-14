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
  Sparkles,
  BarChart3,
  Clock,
  Briefcase,
  ChevronRight,
  Check,
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
    <div className="flex flex-col bg-[#F6F8FC] text-[#172033]">
      {/* 1. HERO SECTION - Modern Navy & White SaaS */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#092B63] via-[#0D387A] to-[#092B63] text-white pt-20 pb-28 lg:pt-28 lg:pb-36">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
        
        {/* Ambient radial glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-white/10 px-4 py-1.5 text-xs font-semibold text-blue-200 backdrop-blur-md">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Enterprise Partner & Brand Promotion Architecture</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.15]">
              Accelerate Brand Growth with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-indigo-100 to-teal-200">
                Verified Partner Networks
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto font-normal">
              Connect verified brand advertisers with high-performance partner squads. Powered by transparent attribution, double-entry financial ledger security, and role-based operational governance.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link href="/register?role=independent_partner" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gap-2 bg-[#2563EB] hover:bg-blue-600 font-bold text-white shadow-lg shadow-blue-900/40 border border-blue-400/30">
                  <span>Join as Partner</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/become-vendor" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm font-semibold"
                >
                  <span>Become a Vendor</span>
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-blue-100/90 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Zero Fabricated Data</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Supabase PostgreSQL Security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Guaranteed Transparent Payouts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PLATFORM INTRODUCTION */}
      <section className="py-20 bg-white border-b border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="brand">The LMB Ecosystem</Badge>
            <h2 className="text-3xl font-black text-[#172033] tracking-tight">
              Engineered for Enterprise Scale, Integrity & High ROI
            </h2>
            <p className="text-[#64748B] text-sm leading-relaxed">
              Eliminate attribution leakage, prevent duplicate leads, and ensure every commission transaction is verified against mathematical ledger invariants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-[#E2E8F0] hover:border-[#092B63]/40 transition-all shadow-xs hover:shadow-md bg-white">
              <CardContent className="p-8 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#092B63] font-bold">
                  <Store className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#172033]">For Brand Merchants</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Publish high-converting promotional campaigns with verified budgets, custom commission tiers, and fraud-resistant lead qualification desks.
                </p>
                <Link
                  href="/become-vendor"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#092B63] pt-2"
                >
                  <span>Explore Vendor Solutions</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0] hover:border-[#092B63]/40 transition-all shadow-xs hover:shadow-md bg-white">
              <CardContent className="p-8 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold">
                  <Users2 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#172033]">For Partner Networks</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Promote verified brand offers as an Independent Partner or organize squads under Team Leaders with real-time Sub-ID attribution links.
                </p>
                <Link
                  href="/become-partner"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#092B63] pt-2"
                >
                  <span>Discover Partner Benefits</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0] hover:border-[#092B63]/40 transition-all shadow-xs hover:shadow-md bg-white">
              <CardContent className="p-8 space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-[#172033]">Enterprise Governance</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  Every financial event is secured by PostgreSQL Row Level Security, double-entry escrow reserves, and an append-only cryptographic audit trail.
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:text-[#092B63] pt-2"
                >
                  <span>Security & Compliance</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. HOW LMB WORKS (PARTNER & VENDOR WORKFLOWS) */}
      <section className="py-20 bg-[#F6F8FC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="brand">Operational Workflows</Badge>
            <h2 className="text-3xl font-black text-[#172033] tracking-tight">
              Simple, Transparent Execution Pathways
            </h2>
            <p className="text-[#64748B] text-sm">
              Structured multi-step progression designed for clarity, compliance, and guaranteed earnings.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Partner Workflow Card */}
            <Card className="border-[#E2E8F0] bg-white shadow-xs">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2E8F0]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#092B63] font-bold">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#172033]">Partner Workflow</h3>
                    <p className="text-xs text-[#64748B]">For affiliates, squads & individual promoters</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { step: "01", title: "Registration", desc: "Register online and select independent partner or agency squad path." },
                    { step: "02", title: "Compliance Approval", desc: "Administrative team verifies identity and KYC credentials." },
                    { step: "03", title: "Campaign Access", desc: "Browse verified brand directory and generate unique QR/Sub-ID tracking links." },
                    { step: "04", title: "Lead Submission & Review", desc: "Submit qualified customer inquiries into the anti-duplicate validation engine." },
                    { step: "05", title: "Eligible Commission Credit", desc: "Approved leads automatically credit wallet balance for manual bank withdrawal." },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#092B63] text-white font-mono text-xs font-bold shrink-0">
                        {item.step}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#172033]">{item.title}</div>
                        <div className="text-xs text-[#64748B] leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Vendor Workflow Card */}
            <Card className="border-[#E2E8F0] bg-white shadow-xs">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-[#E2E8F0]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#092B63] font-bold">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#172033]">Brand Vendor Workflow</h3>
                    <p className="text-xs text-[#64748B]">For advertisers, product companies & merchants</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { step: "01", title: "Agency Registration", desc: "Submit business verification, GST/Tax information, and brand profile." },
                    { step: "02", title: "Super Admin Approval", desc: "Enterprise compliance validates company standing and generates Vendor ID." },
                    { step: "03", title: "Team Creation & Member Invites", desc: "Appoint Team Leaders and invite structured member squads via secure tokens." },
                    { step: "04", title: "Campaign Launch", desc: "Set commission ceilings, eligibility rules, and allocate to partner networks." },
                    { step: "05", title: "Performance & Growth", desc: "Review customer leads in real time and track conversion analytics." },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2563EB] text-white font-mono text-xs font-bold shrink-0">
                        {item.step}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#172033]">{item.title}</div>
                        <div className="text-xs text-[#64748B] leading-relaxed">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. FEATURED REAL CAMPAIGNS (POSTGRESQL RECORDS ONLY) */}
      <section className="py-20 bg-white border-y border-[#E2E8F0]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-2">
              <Badge variant="brand">Verified Brand Listings</Badge>
              <h2 className="text-3xl font-black text-[#172033] tracking-tight">
                Featured Active Campaigns
              </h2>
              <p className="text-[#64748B] text-sm max-w-xl">
                Real campaigns retrieved live from PostgreSQL. LMB strictly verifies budgets and criteria before listing.
              </p>
            </div>
            <Link href="/campaigns">
              <Button variant="outline" className="gap-2 text-xs font-semibold border-[#E2E8F0]">
                <span>View Full Directory</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCampaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="border-[#E2E8F0] bg-white hover:border-[#092B63]/40 hover:shadow-md transition-all flex flex-col justify-between"
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
                      <h3 className="font-bold text-[#172033] text-lg leading-snug">
                        {campaign.title}
                      </h3>
                      <p className="text-[#64748B] text-xs mt-2 line-clamp-3 leading-relaxed">
                        {campaign.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold block">
                          Commission Rate
                        </span>
                        <span className="text-lg font-black text-[#2563EB]">
                          {campaign.commission_type === "percentage"
                            ? `${campaign.commission_rate}%`
                            : formatCurrency(campaign.commission_rate)}
                        </span>
                      </div>
                      <Link href="/campaigns">
                        <Button size="sm" variant="outline" className="text-xs font-semibold border-[#E2E8F0] hover:bg-[#EAF2FF] hover:text-[#092B63]">
                          Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-xl border border-dashed border-[#E2E8F0] bg-white">
              <Layers className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#172033]">
                Campaign catalog is being synchronized
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 mb-4">
                Explore the campaign directory to browse active brand opportunities.
              </p>
              <Link href="/campaigns">
                <Button size="sm">Browse Directory</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 5. BENEFITS BREAKDOWN (PARTNER & VENDOR BENEFITS) */}
      <section className="py-20 bg-[#F6F8FC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge variant="brand">Value Proposition</Badge>
            <h2 className="text-3xl font-black text-[#172033] tracking-tight">
              Why High-Growth Teams Choose LMB
            </h2>
            <p className="text-[#64748B] text-sm">
              Purpose-built tools for promotional scale, fraud prevention, and compliant financial settlement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                  <Briefcase className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[#172033]">Partner Benefits</h3>
              </div>
              <ul className="space-y-3.5 text-xs text-[#64748B]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-[#172033]">Guaranteed Transparent Payouts:</strong> Double-entry escrow ledger ensures funds are reserved upon submission.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-[#172033]">Automated Sub-ID Tracking:</strong> Instant affiliate link & QR code generator with zero attribution loss.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-[#172033]">Vector PDF ID Cards:</strong> Digitally signed and verifiable partner credentials for offline activations.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-[#172033]">Flexible Squad Structures:</strong> Work independently or join agency teams directed by experienced leaders.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Store className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[#172033]">Vendor Benefits</h3>
              </div>
              <ul className="space-y-3.5 text-xs text-[#64748B]">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-[#172033]">Performance-Only Payouts:</strong> Pay only for reviewed, verified, and qualified customer conversions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-[#172033]">Anti-Fraud Lead Engine:</strong> Real-time deduplication protects against duplicate phone, email, and IP submissions.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-[#172033]">Custom Team Splits:</strong> Define granular commission shares for Team Leaders and individual members.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong className="text-[#172033]">Comprehensive Analytics:</strong> Export CSV and PDF reports with zero third-party tracking cookies.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA BANNER */}
      <section className="bg-[#092B63] py-16 text-white border-t border-blue-900/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Ready to Scale Your Brand or Promotional Network?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto font-normal">
            Join the Lets Make Brand ecosystem today. Registration is streamlined, compliance-verified, and backed by transparent settlement.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3.5 pt-2">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto font-bold bg-[#2563EB] hover:bg-blue-600 text-white shadow-lg border border-blue-400/30">
                Create Your Account
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm font-semibold">
                Contact Enterprise Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
