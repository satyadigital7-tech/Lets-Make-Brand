import { Metadata } from "next";
import Link from "next/link";
import {
  UserCheck,
  Megaphone,
  Share2,
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "How It Works - Lets Make Brand (LMB)",
  description: "Step-by-step guide to promoting brands, publishing campaigns, and earning commissions with LMB.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      title: "Register & Choose Your Track",
      description:
        "Sign up as an Independent Partner or register your company as a Brand Vendor. Complete identity verification to access the platform.",
      icon: UserCheck,
      color: "bg-[#092B63] text-white",
    },
    {
      step: "02",
      title: "Discover or Launch Campaigns",
      description:
        "Vendors configure campaigns with transparent budgets and commission terms. Partners browse verified active brand promotions across SaaS, FinTech, and E-commerce.",
      icon: Megaphone,
      color: "bg-[#2563EB] text-white",
    },
    {
      step: "03",
      title: "Deploy Promotional Channels",
      description:
        "Independent Partners and Team Leader squads distribute tracking links across compliant creator, social, and direct enterprise channels.",
      icon: Share2,
      color: "bg-indigo-600 text-white",
    },
    {
      step: "04",
      title: "Verified Attribution & Fast Payouts",
      description:
        "Lead completions and conversions are validated against campaign criteria and credited instantly to your partner wallet for scheduled disbursement.",
      icon: Wallet,
      color: "bg-emerald-600 text-white",
    },
  ];

  return (
    <div className="py-16 md:py-24 bg-[#F6F8FC]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="brand">Operational Model</Badge>
          <h1 className="text-4xl font-black text-[#172033] tracking-tight sm:text-5xl">
            How Lets Make Brand Works
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            A high-integrity multi-tenant execution model designed to connect verified brands with performance affiliate squads.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.step}
                className="border-[#E2E8F0] bg-white shadow-xs hover:border-[#092B63]/40 transition-all flex flex-col justify-between"
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black font-mono text-[#092B63] bg-[#EAF2FF] px-2.5 py-1 rounded-md">
                      STEP {item.step}
                    </span>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color} shadow-xs`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-base font-bold text-[#172033]">
                      {item.title}
                    </h2>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dual Workflow Deep Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
          {/* Partner Track */}
          <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#092B63] font-bold">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#172033]">The Partner Experience</h3>
                <span className="text-xs text-[#64748B]">For affiliates, agencies, and performance creators</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              As an LMB Partner, you receive a full-featured dashboard with personalized tracking links, real-time conversion monitoring, and vector PDF verification ID cards.
            </p>

            <ul className="space-y-2.5 text-xs text-[#172033]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Zero phantom lead rejections — strict audited review criteria</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Automatic double-entry escrow reserves for pending conversions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Option to operate solo or join a structured sales squad</span>
              </li>
            </ul>

            <Link href="/become-partner" className="inline-block pt-2">
              <Button size="sm" className="gap-1.5 text-xs font-semibold bg-[#092B63] hover:bg-[#123D82] text-white">
                <span>Join as a Partner</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Vendor Track */}
          <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#092B63] font-bold">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#172033]">The Brand Vendor Experience</h3>
                <span className="text-xs text-[#64748B]">For enterprise advertisers and product owners</span>
              </div>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Brand Vendors maintain total governance over their campaigns. Define exact commission ceilings, review incoming leads with two-factor validation, and invite team leaders.
            </p>

            <ul className="space-y-2.5 text-xs text-[#172033]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Automated anti-duplicate engine across phone, email & IP</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Custom team hierarchies with separate Team Leader and member splits</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Full compliance audit trail with CSV/PDF reporting exports</span>
              </li>
            </ul>

            <Link href="/become-vendor" className="inline-block pt-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold border-[#E2E8F0] hover:bg-[#EAF2FF] hover:text-[#092B63]">
                <span>Register as a Vendor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Security Callout */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center space-y-4 shadow-xs">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Guaranteed PostgreSQL Data Integrity</span>
          </div>
          <h2 className="text-2xl font-bold text-[#172033]">
            Mathematical Ledger Reconciliation on Every Withdrawal
          </h2>
          <p className="text-xs text-[#64748B] max-w-xl mx-auto leading-relaxed">
            All partner wallet transactions are checked against double-entry ledger invariants. Available balances cannot be modified without authorized cryptographic ledger entries.
          </p>
        </div>
      </div>
    </div>
  );
}
