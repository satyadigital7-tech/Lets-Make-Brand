import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Privacy Policy - Lets Make Brand (LMB)",
  description: "Enterprise privacy policy, cryptographic data protections, and data subject rights.",
};

export default function PrivacyPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="space-y-3">
          <Badge variant="brand">Legal & Governance</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500">Effective Date: January 1, 2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-slate-700 space-y-6 text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              Lets Make Brand (&quot;LMB&quot;, &quot;we&quot;, &quot;us&quot;) collects essential enterprise identity information, 
              including business names, corporate email addresses, phone numbers, tax identification documents for payout compliance, 
              and authenticated user credentials processed securely via Supabase Auth.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">2. Row Level Security & Multi-Tenant Data Isolation</h2>
            <p>
              We enforce PostgreSQL Row Level Security (RLS) across all application database tables. 
              Under no circumstances can an unauthorized third party, vendor, or non-administrative user 
              access or query your proprietary lead data, promotional statistics, or customer identities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">3. Promotional Tracking & Attribution</h2>
            <p>
              When promotional tracking links are activated, we collect non-identifiable referral metadata 
              (timestamp, HTTP referer, campaign identifier, masked IP) exclusively for attribution and anti-fraud 
              verification. We never sell, rent, or monetize partner or consumer telemetry data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">4. Audit Logs & System Accountability</h2>
            <p>
              All administrative operations, permission changes, campaign approvals, and wallet balance 
              modifications are permanently recorded in immutable audit logs to guarantee compliance with 
              SOC2 and enterprise security standards.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">5. Data Subject Rights & Contact</h2>
            <p>
              You have the right to access, rectify, or request the deletion of your personal and business records, 
              subject to statutory financial recordkeeping requirements. Contact our Data Protection Officer at:{" "}
              <a href="mailto:privacy@letsmakebrand.com" className="text-blue-600 font-medium underline">
                privacy@letsmakebrand.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

