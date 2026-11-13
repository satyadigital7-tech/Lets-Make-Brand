import { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users2,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Become a Partner - Lets Make Brand (LMB)",
  description: "Join the LMB Partner Network as an Independent Partner or Team Leader. Earn verified commissions on leading brand campaigns.",
};

export default function BecomePartnerPage() {
  const tiers = [
    {
      role: "Independent Partner",
      badge: "Self-Serve & Solo Affiliates",
      description: "For content creators, solo affiliates, and marketing professionals who promote campaigns directly.",
      features: [
        "Instant access to verified brand campaigns",
        "Unique promotional tracking links",
        "Real-time lead conversion analytics",
        "Automated wallet accruals & fast withdrawals",
        "Zero registration fees or hidden costs",
      ],
      ctaText: "Join as Independent Partner",
      ctaHref: "/register?role=independent_partner",
      isPrimary: true,
    },
    {
      role: "Team Leader / Agency",
      badge: "Agencies & Squad Leaders",
      description: "For agency directors, influencer managers, and community leaders orchestrating partner teams.",
      features: [
        "Manage multiple team members and sub-agents",
        "Group commission splits and tier overrides",
        "Consolidated agency analytics & reports",
        "Direct campaign allocations from top vendors",
        "Dedicated enterprise partner support manager",
      ],
      ctaText: "Apply as Team Leader",
      ctaHref: "/contact?inquiryType=partner",
      isPrimary: false,
    },
  ];

  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="brand">High-Performance Partner Network</Badge>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Promote Premier Brands & Maximize Your Commission Yield
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Stop losing commissions to ambiguous tracking and delayed payouts. 
            LMB delivers real-time ledger accounting, verified vendor escrow, and enterprise brand deals.
          </p>
          <div className="pt-2">
            <Link href="/register?role=independent_partner">
              <Button size="lg" className="font-semibold shadow-sm">
                <span>Start Promoting Today</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-slate-200">
            <CardContent className="p-8 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Guaranteed Escrow Funding</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All campaigns on LMB must maintain pre-funded budgets, guaranteeing you are paid promptly upon verified lead delivery.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-8 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cryptographic Attribution</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every click, lead submission, and conversion is registered in PostgreSQL with zero intermediary attribution skimming.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-8 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tiered Commission Bonuses</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Scale your earnings with performance milestone bonuses, VIP brand access, and higher rev-share tiers.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tracks Comparison */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Select Your Partner Track
            </h2>
            <p className="text-slate-500 text-xs">
              Whether you are an independent promoter or run a 50-person agency squad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <Card
                key={tier.role}
                className={`border-2 p-2 flex flex-col justify-between ${
                  tier.isPrimary
                    ? "border-blue-600 shadow-md ring-1 ring-blue-600/20"
                    : "border-slate-200"
                }`}
              >
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Badge variant={tier.isPrimary ? "brand" : "secondary"}>
                      {tier.badge}
                    </Badge>
                    <h3 className="text-2xl font-bold text-slate-900">{tier.role}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  <ul className="space-y-2.5 pt-2 border-t border-slate-100">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    <Link href={tier.ctaHref} className="block">
                      <Button
                        className="w-full font-semibold"
                        variant={tier.isPrimary ? "default" : "outline"}
                      >
                        {tier.ctaText}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

