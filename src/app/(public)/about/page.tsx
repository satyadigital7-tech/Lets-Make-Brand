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
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Badge variant="brand">Our Mission & Architecture</Badge>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Empowering Transparent Brand Growth & High-Yield Partnerships
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Lets Make Brand (LMB) was engineered to solve the chronic opacity, attribution loss, 
            and compliance risks in traditional affiliate and promotional networks.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="border-slate-200">
            <CardContent className="p-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Truth-First Attribution</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                We believe trust is non-negotiable. LMB enforces absolute cryptographic ledger 
                integrity, preventing fabricated analytics and phantom traffic claims.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">PostgreSQL RLS Security</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every query, campaign view, and ledger entry is guarded at the database level by 
                PostgreSQL Row Level Security (RLS) with explicit default-deny policies.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-8 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Structured Team Hierarchy</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                From solo Independent Partners to enterprise Team Leaders with multi-tiered squads, 
                LMB offers role-based workspaces tailored for peak operational efficiency.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Principles */}
        <div className="rounded-2xl bg-slate-900 text-white p-8 md:p-12 lg:p-16">
          <div className="max-w-3xl space-y-6">
            <Badge variant="brand" className="bg-blue-600/20 text-blue-300 border-blue-500/30">
              Governance Framework
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight">
              Enterprise Compliance & Security by Design
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              In modern enterprise software, client-side permission checks are merely UX enhancements. 
              LMB treats database security and server-side authorization as the single source of truth.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Non-Privileged Self-Registration</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Public signups cannot assign administrative roles. Privileged roles are strictly provisioned by Super Admins.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Explicit Permission Grants</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Critical operations like vendor transfers default to false for Admins and require explicit Super Admin approval.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Immutable Audit Logging</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    All administrative operations, permission changes, and campaign approvals are logged with IP addresses and user agents.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Zero Fabricated Campaigns</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    The platform solely presents actual PostgreSQL database records verified by brand merchants.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

