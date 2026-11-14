import { Metadata } from "next";
import { ShieldCheck, Target, Award, Users, CheckCircle2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Us - Lets Make Brand (LMB)",
  description: "Learn about the mission, architecture, and governance behind Lets Make Brand (LMB).",
};

export default function AboutPage() {
  return (
    <div className="py-16 md:py-24 bg-[#F6F8FC]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="brand">Our Mission & Architecture</Badge>
          <h1 className="text-4xl font-black text-[#172033] tracking-tight sm:text-5xl">
            Empowering Transparent Brand Growth & High-Yield Partnerships
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Lets Make Brand (LMB) was engineered to solve the chronic opacity, attribution loss, 
            and compliance risks in traditional affiliate and promotional networks.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-[#E2E8F0] bg-white shadow-xs hover:border-[#092B63]/40 transition-all">
            <CardContent className="p-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#092B63] font-bold">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#172033]">Truth-First Attribution</h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                We believe trust is non-negotiable. LMB enforces absolute cryptographic ledger 
                integrity, preventing fabricated analytics and phantom traffic claims.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] bg-white shadow-xs hover:border-[#092B63]/40 transition-all">
            <CardContent className="p-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#172033]">PostgreSQL RLS Security</h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Every query, campaign view, and ledger entry is guarded at the database level by 
                PostgreSQL Row Level Security (RLS) with explicit default-deny policies.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#E2E8F0] bg-white shadow-xs hover:border-[#092B63]/40 transition-all">
            <CardContent className="p-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#172033]">Structured Team Hierarchy</h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Clear role separation between Brand Vendors, non-earning supervisory Team Leaders, 
                and high-performance Team Members eliminates cross-tenant data leaks.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Core Standards */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 md:p-12 space-y-8 shadow-xs">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-bold text-[#172033] tracking-tight">
              Enterprise Governance Standards
            </h2>
            <p className="text-xs text-[#64748B]">
              The core technical and ethical mandates governing the LMB platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#172033]">Non-Negative Wallet Balances</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Database check constraints enforce that wallet available and pending balances cannot drop below zero.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#172033]">Two-Tier Administrative RBAC</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Standard Admins possess granular operational rights but are strictly denied sensitive vendor transfers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#172033]">Supervisory Team Leader Model</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Team Leaders act strictly as managers. They cannot submit personal leads or earn individual commissions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#172033]">Append-Only Audit Logging</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  All administrative operations are permanently recorded in PostgreSQL audit logs with update and delete triggers blocked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
