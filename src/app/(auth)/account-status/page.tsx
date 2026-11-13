import React from "react";
import Link from "next/link";
import { AlertCircle, ShieldAlert, LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AccountStatusPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AccountStatusPage({ searchParams }: AccountStatusPageProps) {
  const { status } = await searchParams;
  const user = await getCurrentUser();

  const isSuspended = status === "suspended" || user?.profile?.status === "suspended";
  const isRejected = status === "rejected" || user?.profile?.status === "rejected";

  return (
    <Card className="border-slate-200 shadow-md">
      <CardHeader className="text-center pb-4">
        <div className="h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          {isSuspended ? "Account Suspended" : isRejected ? "Application Declined" : "Account Inactive"}
        </CardTitle>
        <CardDescription className="text-xs max-w-sm mx-auto">
          {isSuspended
            ? "Your account access has been suspended due to compliance review or terms policy enforcement."
            : isRejected
            ? "Your registration application was reviewed and could not be approved at this time."
            : "Your account is currently inactive."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2 text-xs text-rose-900">
          <div className="flex items-center justify-between">
            <span className="font-semibold">User:</span>
            <span>{user?.profile?.full_name || user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Account Status:</span>
            <Badge variant="destructive" className="text-[10px] uppercase">
              {user?.profile?.status || status || "inactive"}
            </Badge>
          </div>
          {isRejected && user?.profile?.rejection_reason && (
            <div className="pt-2 border-t border-rose-200">
              <span className="font-bold block">Rejection Reason:</span>
              <p className="mt-1 text-rose-800">{user.profile.rejection_reason}</p>
            </div>
          )}
          {isSuspended && user?.profile?.suspension_reason && (
            <div className="pt-2 border-t border-rose-200">
              <span className="font-bold block">Suspension Reason:</span>
              <p className="mt-1 text-rose-800">{user.profile.suspension_reason}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Link href="/contact" className="text-xs text-blue-600 hover:underline">
            Contact Support & Appeals
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

