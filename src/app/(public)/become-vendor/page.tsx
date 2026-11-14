import { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sliders,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Become a Brand Vendor - Lets Make Brand (LMB)",
  description: "Scale your customer acquisition with verified partner networks and transparent attribution on LMB.",
};

export default function BecomeVendorPage() {
  const vendorPillars = [
    {
      title: "Cost-Per-Acquisition Control",
      description: "Pay strictly for verified leads and qualified transactions. No upfront speculative ad spend or opaque CPM wastage.",
      icon: DollarSign,
    },
    {
      title: "Audited Brand Safety",
      description: "Partners and promotional creatives are monitored. You retain full control to approve or decline partner squad applications.",
      icon: ShieldCheck,
    },
    {
      title: "Custom Commission Logic",
      description: "Deploy percentage splits or fixed bounty payouts with tiered incentives for high-volume enterprise affiliates.",
      icon: Sliders,
    },
    {
      title: "Real-Time Pipeline Analytics",
      description: "Monitor impression-to-lead funnels and conversion velocity across independent partners and agency squads.",
      icon: BarChart3,
    },
  ];

  return (
    <div className="py-16 md:py-24 bg-[#F6F8FC]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="brand">For Brands & Product Merchants</Badge>
          <h1 className="text-4xl font-extrabold text-[#172033] tracking-tight sm:text-5xl">
            Scale Customer Acquisition Through Verified Partner Squads
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Eliminate speculative ad budgets. Launch performance campaigns on LMB 
            and tap into thousands of vetted promotional partners and agency networks.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register/vendor">
              <Button size="lg" className="w-full sm:w-auto font-semibold shadow-sm">
                <span>Register as Brand Vendor</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact?inquiryType=vendor">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <span>Book Enterprise Demo</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {vendorPillars.map((p) => {
            const Icon = p.icon;
            return (
              <Card key={p.title} className="border-[#E2E8F0] bg-white rounded-xl shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#092B63]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#172033]">{p.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {p.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Compliance Guarantee */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 md:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <Badge variant="success">Merchant Governance</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033]">
                PostgreSQL Security & Explicit Permissions
              </h2>
              <p className="text-[#64748B] text-sm leading-relaxed">
                Your business confidentialities, client leads, and pricing rules are isolated using 
                PostgreSQL Row Level Security. Administrative actions are logged immutably, and 
                vendor ownership transfers cannot occur without explicit Super Admin authorization.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-[#172033]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                  <span>Isolated multi-tenant vendor workspace</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                  <span>Granular permission checks on all campaign controls</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
                  <span>Vendor transfer controls default to DENY for standard admins</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#092B63] text-white rounded-xl p-6 sm:p-8 space-y-4 shadow-md">
              <h4 className="text-sm uppercase tracking-wider font-bold text-[#EAF2FF]">
                Onboarding Requirements
              </h4>
              <p className="text-xs text-white/80 leading-relaxed">
                To maintain ecosystem trust, all brand vendors complete a straightforward compliance review:
              </p>
              <div className="space-y-2 text-xs text-white/90">
                <div className="p-3 rounded-lg bg-white/10 border border-white/15">
                  1. Registered Business Identity & Tax validation
                </div>
                <div className="p-3 rounded-lg bg-white/10 border border-white/15">
                  2. Clear product/service landing page with functional checkout or demo
                </div>
                <div className="p-3 rounded-lg bg-white/10 border border-white/15">
                  3. Dedicated budget deposit into escrow wallet before campaign activation
                </div>
              </div>
              <div className="pt-2">
                <Link href="/register/vendor" className="block">
                  <Button className="w-full bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold text-xs shadow-sm">
                    Start Vendor Onboarding
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
