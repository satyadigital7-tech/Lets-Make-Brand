import React from "react";
import Link from "next/link";
import { Clock, ShieldCheck, Mail, LogOut, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function PendingApprovalPage() {
  const user = await getCurrentUser();

  return (
    <Card className="border-slate-200 shadow-md">
      <CardHeader className="text-center pb-4">
        <div className="h-14 w-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
          <Clock className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Application Under Review
        </CardTitle>
        <CardDescription className="text-xs max-w-sm mx-auto">
          Your account registration has been submitted and is currently queued for Super Admin compliance verification.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Applicant:</span>
            <span className="font-semibold text-slate-900">
              {user?.profile?.full_name || "Applicant"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Registered Email:</span>
            <span className="font-mono text-slate-800">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Requested Account Type:</span>
            <Badge variant="brand" className="text-[10px] capitalize">
              {user?.primaryRole.replace("_", " ") || "Partner / Vendor"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Current Status:</span>
            <Badge variant="warning" className="text-[10px]">
              Pending Approval
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Next Steps in Verification:</span>
          </h4>
          <ul className="space-y-1.5 pl-5 list-disc text-slate-600 text-[11px] leading-relaxed">
            <li>Our compliance team will review your business identity within 24 business hours.</li>
            <li>Upon approval, a unique identification code (e.g. <code>LMB-VEN-xxxxxx</code> or <code>LMB-PAR-xxxxxx</code>) will be generated.</li>
            <li>Your dashboard access will be activated automatically.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <Link href="/contact" className="text-xs text-blue-600 hover:underline">
            Contact Support Team
          </Link>

          <form action="/api/auth/logout" method="POST">
            <Button variant="outline" size="sm" type="submit" className="text-xs gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
