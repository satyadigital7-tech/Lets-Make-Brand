import React from "react";
import Link from "next/link";
import { ShieldCheck, Users, ArrowRight, AlertCircle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function TeamLeaderCommissionPage() {
  await requireRole(["team_leader", "super_admin"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Governance & Revenue Oversight"
        description="Review squad conversion performance and organizational commission rules."
        badge="Governance Notice"
      />

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-8 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-lg">
                Team Leader Role Boundary: Zero Personal Lead Accruals
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                Under the LMB Platform Governance Charter, Team Leaders function strictly as organizational supervisors and squad mentors. To eliminate conflicts of interest and attribution cannibalization, Team Leaders do not submit personal earning leads or hold individual direct commission ledgers.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
                All campaign commission earnings are distributed directly to your assigned squad members and your registered vendor agency. You can monitor squad performance and member conversion analytics below.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-amber-200/60 flex flex-wrap gap-3">
            <Link href="/dashboard/team-leader/team">
              <Button size="sm" className="gap-2 font-semibold">
                <Users className="h-4 w-4" />
                <span>View Assigned Squad Members</span>
              </Button>
            </Link>
            <Link href="/dashboard/team-leader/reports">
              <Button size="sm" variant="outline" className="gap-2 font-semibold">
                <span>View Squad Performance Reports</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
