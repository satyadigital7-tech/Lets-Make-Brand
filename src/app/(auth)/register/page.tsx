"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Store, Users, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function RegisterChoice() {
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const ref = searchParams.get("ref");

  return (
    <Card className="border-[#E2E8F0] shadow-sm max-w-xl mx-auto bg-white rounded-xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold tracking-tight text-[#172033]">
          Join Lets Make Brand (LMB)
        </CardTitle>
        <CardDescription className="text-xs text-[#64748B]">
          Select your registration track to begin the verified onboarding workflow
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Vendor Track */}
          <Link
            href="/register/vendor"
            className="group p-5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#092B63] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-[#EAF2FF] text-[#092B63] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Store className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#172033]">Brand Vendor</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Publish high-converting brand campaigns, manage promotional squads, and expand your customer acquisition.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-[#092B63] group-hover:underline">
              <span>Continue as Vendor</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </Link>

          {/* Partner Track */}
          <Link
            href={invite ? `/register/partner?invite=${encodeURIComponent(invite)}` : ref ? `/register/partner?ref=${encodeURIComponent(ref)}` : "/register/partner"}
            className="group p-5 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#2563EB] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-[#EAF2FF] text-[#2563EB] flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-base text-[#172033]">Promotional Partner</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Join as an Independent Partner or Vendor-invited Team Member to promote verified campaigns and earn commissions.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-semibold text-[#2563EB] group-hover:underline">
              <span>Continue as Partner</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </div>
          </Link>
        </div>

        <div className="pt-4 border-t border-[#E2E8F0] text-center text-xs text-[#64748B]">
          Already registered?{" "}
          <Link href="/login" className="text-[#092B63] font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#64748B]">Loading...</div>}>
      <RegisterChoice />
    </Suspense>
  );
}
