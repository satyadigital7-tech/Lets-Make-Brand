import React from "react";
import Link from "next/link";
import { Users2, ShieldCheck, Mail, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InvitationAcceptButton } from "./accept-button";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitationPage({ params }: InvitePageProps) {
  const { token } = await params;
  const user = await getCurrentUser();
  const adminClient = createAdminClient();

  // Fetch invitation with vendor & team details
  const { data: invitation } = await adminClient
    .from("invitations")
    .select(`
      id,
      vendor_id,
      team_id,
      email,
      role,
      token,
      status,
      expires_at,
      profiles:vendor_id (
        business_name,
        company_name,
        full_name
      ),
      teams:team_id (
        name,
        team_code
      )
    `)
    .eq("token", token)
    .single();

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full border-slate-200">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Invalid Invitation Link</h2>
            <p className="text-xs text-slate-500">
              The invitation token is invalid, revoked, or does not exist. Please request a new invitation from your Brand Vendor.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button size="sm">Return Home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isPending = invitation.status === "pending" && !isExpired;

  const vendorObj = Array.isArray(invitation.profiles) ? invitation.profiles[0] : invitation.profiles;
  const teamObj = Array.isArray(invitation.teams) ? invitation.teams[0] : invitation.teams;
  const vendorName = vendorObj?.business_name || vendorObj?.company_name || vendorObj?.full_name || "Enterprise Brand Vendor";
  const teamName = teamObj?.name || "General Brand Squad";

  const isEmailMatching = user && user.email.toLowerCase() === invitation.email.toLowerCase();

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-950 via-blue-900 to-blue-600 text-white font-extrabold text-xl shadow-md">
            LMB
          </div>
        </Link>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="text-center pb-4 space-y-1.5">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1">
              <Users2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
              Brand Squad Invitation
            </CardTitle>
            <CardDescription className="text-xs">
              You have been invited by <strong>{vendorName}</strong> to join their performance network
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!isPending ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Invitation Unavailable</AlertTitle>
                <AlertDescription>
                  This invitation has either expired or was already processed ({invitation.status}).
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Invited By:</span>
                    <span className="font-bold text-slate-900">{vendorName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Target Team:</span>
                    <span className="font-semibold text-blue-600">{teamName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Assigned Role:</span>
                    <Badge variant="brand" className="text-[10px] capitalize">
                      {invitation.role === "team_leader" ? "Team Leader" : "Team Member"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Designated Email:</span>
                    <span className="font-mono text-slate-800">{invitation.email}</span>
                  </div>
                </div>

                {/* Authentication Validation Gate */}
                {!user ? (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-slate-600 text-center">
                      Please sign in or register with <strong>{invitation.email}</strong> to accept this squad invitation.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Link href={`/login?redirectTo=/invite/${token}`}>
                        <Button variant="outline" className="w-full text-xs font-semibold">
                          Sign In with Invited Email
                        </Button>
                      </Link>
                      <Link href={`/register/partner?invite=${token}`}>
                        <Button className="w-full text-xs font-semibold">
                          Create Partner Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : !isEmailMatching ? (
                  <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Account Email Mismatch</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>
                        You are currently signed in as <strong>{user.email}</strong>, but this invitation was issued exclusively for <strong>{invitation.email}</strong>.
                      </p>
                      <p className="text-[11px] opacity-80">
                        Please sign out and log in with the verified invited address to accept.
                      </p>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Verified identity matches invitation email: {user.email}</span>
                    </div>

                    <InvitationAcceptButton token={token} role={invitation.role} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

