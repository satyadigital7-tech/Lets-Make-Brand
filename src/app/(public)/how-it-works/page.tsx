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
      color: "bg-blue-600 text-white",
    },
    {
      step: "02",
      title: "Discover or Launch Campaigns",
      description:
        "Vendors configure campaigns with transparent budgets and commission terms. Partners browse verified active brand promotions across SaaS, FinTech, and E-commerce.",
      icon: Megaphone,
      color: "bg-indigo-600 text-white",
    },
    {
      step: "03",
      title: "Deploy Promotional Channels",
      description:
        "Independent Partners and Team Leader squads distribute tracking links across compliant creator, social, and direct enterprise channels.",
      icon: Share2,
      color: "bg-violet-600 text-white",
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
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="brand">Operational Blueprint</Badge>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            How Lets Make Brand Works
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            A battle-tested promotion engine designed to eliminate affiliate friction, 
            guarantee payout transparency, and safeguard brand equity.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.step} className="border-slate-200 relative overflow-hidden flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-slate-300 font-mono">
                      {s.step}
                    </span>
                    <div className={`p-2.5 rounded-xl ${s.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {s.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dual Roles Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          {/* Vendor Track */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold">
                V
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">For Brand Vendors</h3>
                <p className="text-xs text-slate-500">Acquire customers at predictable acquisition cost</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Publish fixed or percentage-based commission models.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Specify exact target audiences and compliance guidelines.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Review qualified leads before approving payout disbursements.</span>
              </li>
            </ul>

            <Link href="/become-vendor" className="block pt-2">
              <Button className="w-full">Get Started as a Vendor</Button>
            </Link>
          </div>

          {/* Partner Track */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold">
                P
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">For Promotional Partners</h3>
                <p className="text-xs text-slate-500">Monetize your audience with verified brand contracts</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Select from pre-screened campaigns with funded escrow balances.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Operate independently or join agency squads with a Team Leader.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Request automated wallet withdrawals with clear audit history.</span>
              </li>
            </ul>

            <Link href="/become-partner" className="block pt-2">
              <Button variant="brand" className="w-full">
                Join Partner Network
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

