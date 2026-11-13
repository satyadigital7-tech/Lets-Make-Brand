import React from "react";
import Link from "next/link";
import { ShieldCheck, Users, ArrowRight, Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TeamLeaderWalletPage() {
  await requireRole(["team_leader", "super_admin"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Treasury & Squad Disbursement Overview"
        description="Platform policy regarding agency treasury and squad leadership wallets."
        badge="Policy Guidelines"
      />

      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="p-8 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-800 shrink-0 mt-0.5">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-lg">
                Direct-to-Agent Wallet Architecture
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                The LMB platform utilizes a decentralized wallet model where all approved commissions are deposited directly into the respective squad member’s verified wallet, and agency overrides accrue directly to your parent Vendor's master wallet.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                Team Leaders oversee member lead progression and operational volume without handling direct cash disbursements, ensuring full cryptographic auditability and compliance with tax withholding mandates.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-blue-200/60 flex flex-wrap gap-3">
            <Link href="/dashboard/team-leader/leads">
              <Button size="sm" className="gap-2 font-semibold">
                <span>Review Squad Lead Progression</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/support">
              <Button size="sm" variant="outline" className="gap-2 font-semibold">
                <span>Contact Operations Support</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
