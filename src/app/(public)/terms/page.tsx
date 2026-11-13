import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Terms & Conditions - Lets Make Brand (LMB)",
  description: "Terms of service, vendor compliance rules, partner obligations, and platform usage terms.",
};

export default function TermsPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3">
          <Badge variant="brand">Legal & Governance</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Terms & Conditions of Service
          </h1>
          <p className="text-xs text-slate-500">Effective Date: January 1, 2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-slate-700 space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p>
              By accessing, registering with, or utilizing the Lets Make Brand (&quot;LMB&quot;) Partner & Brand Promotion 
              Platform, you enter into a legally binding agreement with LMB Inc. If you do not accept these terms, you are 
              expressly prohibited from accessing the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">2. Centralized User Identity & Role Boundaries</h2>
            <p>
              Each user is provisioned a unique cryptographic identity linked to Supabase Auth. Users must register truthfully. 
              Users are strictly forbidden from attempting to elevate privileges or assign themselves privileged administrative 
              roles (Super Admin, Admin). Any attempt to bypass role boundaries or manipulate permission tables will trigger immediate 
              account termination and cryptographic logging.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">3. Vendor Obligations & Escrow Solvency</h2>
            <p>
              Brand Vendors publishing promotional campaigns warrant that all campaign information, landing pages, and commission 
              schedules are authentic, lawful, and backed by sufficient escrow wallet deposits. Fabricating promotional terms or 
              refusing legitimate lead conversions is a material breach.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">4. Partner Conduct & Anti-Fraud Standards</h2>
            <p>
              Partners (Independent Partners, Team Leaders, and Team Members) must employ legitimate promotional channels. 
              Bot traffic, synthetic lead stuffing, spam, cookie manipulation, and unauthorized brand keyword bidding are 
              strictly prohibited and monitored via automated verification heuristics.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">5. Limitation of Liability & Termination</h2>
            <p>
              LMB provides the platform &quot;as is&quot; without warranties beyond statutory requirements. We reserve the right 
              to suspend or revoke access to any user who violates platform security, Row Level Security integrity, or fair trade guidelines.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

