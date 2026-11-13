"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Store, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function RegisterChoice() {
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const ref = searchParams.get("ref");

  return (
    <Card className="border-slate-200 shadow-md max-w-xl mx-auto">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Join Lets Make Brand (LMB)
        </CardTitle>
        <CardDescription className="text-xs">
          Select your registration track to begin the verified onboarding workflow
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Vendor Track */}
          <Link
            href="/register/vendor"
            className="group p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Store className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Brand Vendor</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Publish high-converting brand campaigns, manage promotional squads, and expand your customer acquisition.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-blue-600 group-hover:underline">
              <span>Continue as Vendor</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </Link>

          {/* Partner Track */}
          <Link
            href={invite ? `/register/partner?invite=${encodeURIComponent(invite)}` : ref ? `/register/partner?ref=${encodeURIComponent(ref)}` : "/register/partner"}
            className="group p-5 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Promotional Partner</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Join as an Independent Partner or Vendor-invited Team Member to promote verified campaigns and earn commissions.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-emerald-600 group-hover:underline">
              <span>Continue as Partner</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading...</div>}>
      <RegisterChoice />
    </Suspense>
  );
}
