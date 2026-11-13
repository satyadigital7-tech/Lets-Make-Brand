import React from "react";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, Award, Calendar, ExternalLink } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyDocumentByReference } from "@/lib/services/document-generator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function IdVerificationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const adminClient = createAdminClient();
  const verification = await verifyDocumentByReference(reference, adminClient);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Top Branding */}
      <div className="mb-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
            L
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            LETS MAKE BRAND
          </span>
        </Link>
        <p className="text-xs text-slate-500 mt-1 uppercase font-semibold tracking-wider">
          Official Credential Verification Registry
        </p>
      </div>

      <Card className="w-full max-w-md bg-white shadow-xl border-slate-200 overflow-hidden">
        {/* Verification Status Header */}
        <div
          className={`p-6 text-center text-white ${
            verification.isValid
              ? "bg-gradient-to-br from-emerald-600 to-teal-700"
              : "bg-gradient-to-br from-rose-600 to-rose-800"
          }`}
        >
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-white/20 backdrop-blur-xs mb-3">
            {verification.isValid ? (
              <ShieldCheck className="h-10 w-10 text-white" />
            ) : (
              <ShieldAlert className="h-10 w-10 text-white" />
            )}
          </div>
          <h2 className="text-xl font-bold">
            {verification.isValid ? "Authentic Credential Verified" : "Verification Failed"}
          </h2>
          <p className="text-xs text-white/80 mt-1">
            {verification.isValid
              ? "This digital identity card is authentic and officially registered with LMB."
              : "The requested credential reference could not be verified in the platform registry."}
          </p>
        </div>

        {verification.isValid ? (
          <CardContent className="p-6 space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Verified Member / Entity
                </span>
                <span className="text-base font-bold text-slate-900 block mt-0.5">
                  {verification.cardholderName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Designation
                  </span>
                  <span className="text-xs font-semibold text-blue-700 block mt-0.5">
                    {verification.designation}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Official ID Code
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900 block mt-0.5">
                    {verification.identifierCode}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Issue Date
                  </span>
                  <span className="text-xs font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {verification.issueDate}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Current Status
                  </span>
                  <Badge variant="success" className="text-[10px] font-bold mt-0.5">
                    {verification.verificationStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Privacy Compliance Notice (Module 2 & 8) */}
            <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200/60 rounded-lg p-3 leading-relaxed">
              <span className="font-bold text-amber-900 block mb-0.5">
                Privacy Protection Active:
              </span>
              In strict adherence to LMB data protection policies, private PII (contact numbers, emails, residences, and banking credentials) is never exposed via QR verification.
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                Visit Official Platform <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-xs text-slate-600">
              The reference code <span className="font-mono font-bold">{reference}</span> is either invalid, revoked, or has expired.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center text-xs font-bold px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              Return to Home
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
