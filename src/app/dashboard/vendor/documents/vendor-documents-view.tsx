"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  Download,
  QrCode,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateVendorIdCardAction, generateVendorAgreementAction } from "./actions";

interface VendorDocumentsViewProps {
  entityName: string;
  userCode: string;
  existingIdCard: {
    docCode: string;
    verificationReference: string;
    issueDate: string;
  } | null;
  existingAgreement: {
    docCode: string;
    issueDate: string;
  } | null;
}

export function VendorDocumentsView({
  entityName,
  userCode,
  existingIdCard,
  existingAgreement,
}: VendorDocumentsViewProps) {
  const [isPending, startTransition] = useTransition();
  const [idCardData, setIdCardData] = useState(existingIdCard);
  const [agreementData, setAgreementData] = useState(existingAgreement);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDownloadIdCard = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setActiveType("id_card");

    startTransition(async () => {
      try {
        const result = await generateVendorIdCardAction();
        if (result.success && result.base64) {
          setIdCardData({
            docCode: result.docCode,
            verificationReference: result.verificationReference,
            issueDate: new Date().toISOString().split("T")[0],
          });
          setSuccessMsg(`Official Vendor Agency ID Card (${result.docCode}) generated!`);

          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${result.base64}`;
          link.download = `LMB_Vendor_ID_${userCode}.pdf`;
          link.click();
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to generate Vendor ID Card.");
      } finally {
        setActiveType(null);
      }
    });
  };

  const handleDownloadAgreement = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setActiveType("agreement");

    startTransition(async () => {
      try {
        const result = await generateVendorAgreementAction();
        if (result.success && result.base64) {
          setAgreementData({
            docCode: result.docCode,
            issueDate: new Date().toISOString().split("T")[0],
          });
          setSuccessMsg(`Agency Vendor Appointment Agreement (${result.docCode}) generated!`);

          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${result.base64}`;
          link.download = `LMB_Vendor_Agreement_${userCode}.pdf`;
          link.click();
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to generate Vendor Agreement.");
      } finally {
        setActiveType(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vendor Agency ID Card */}
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span>Agency Credential Card</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Accredited agency identity badge for enterprise brand representations.
                </CardDescription>
              </div>
              <Badge variant="brand" className="text-[10px] font-bold">
                Accredited Agency
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Graphic Mockup */}
              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 p-4 text-white shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                  <div>
                    <span className="text-[11px] font-extrabold tracking-wider block">LETS MAKE BRAND</span>
                    <span className="text-[8px] text-blue-300 font-bold uppercase tracking-widest block">
                      Accredited Agency Vendor
                    </span>
                  </div>
                  <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center font-black text-xs text-blue-300">
                    L
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-sm font-bold block">{entityName}</span>
                    <div className="text-[10px] font-mono text-blue-200">
                      ID: <span className="font-bold text-white">{userCode}</span>
                    </div>
                    <div className="text-[9px] text-emerald-400 font-bold">Verified Enterprise Agency</div>
                  </div>

                  <div className="h-16 w-16 bg-white rounded-lg p-1.5 flex flex-col items-center justify-center shrink-0">
                    <QrCode className="h-12 w-12 text-slate-900" />
                    <span className="text-[6px] text-slate-500 font-bold">VERIFY</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-400">
                  <span>www.letsmakebrand.com</span>
                  <span>Enterprise Vendor Accreditation</span>
                </div>
              </div>

              {idCardData && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Document Code:</span>
                    <span className="font-mono font-bold text-slate-900">{idCardData.docCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Verification URL:</span>
                    <Link
                      href={`/verify/id/${idCardData.verificationReference}`}
                      target="_blank"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      {idCardData.verificationReference.slice(0, 16)}...
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Vector PDF layout</span>
            <Button
              onClick={handleDownloadIdCard}
              disabled={isPending && activeType === "id_card"}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              {isPending && activeType === "id_card" ? "Generating..." : "Download Agency ID (PDF)"}
            </Button>
          </div>
        </Card>

        {/* Vendor Agency Agreement */}
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <span>Agency Appointment Agreement</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Master Enterprise Vendor appointment contract with split rights and compliance terms.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">
                Master Contract
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
                <p>
                  &bull; <span className="font-semibold text-slate-900">Contractual Authority:</span> Authorized to deploy promotional squads and register team members.
                </p>
                <p>
                  &bull; <span className="font-semibold text-slate-900">Commission Splits:</span> Authorized to configure squad commission distributions up to Super Admin platform caps.
                </p>
                <p>
                  &bull; <span className="font-semibold text-slate-900">Signatory:</span> Managing Director, Lets Make Brand Platforms Pvt. Ltd.
                </p>
              </div>

              {agreementData && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Agreement Reference:</span>
                    <span className="font-mono font-bold text-slate-900">{agreementData.docCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Date of Execution:</span>
                    <span className="text-slate-700">{agreementData.issueDate}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Formal legal letterhead PDF</span>
            <Button
              onClick={handleDownloadAgreement}
              disabled={isPending && activeType === "agreement"}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              {isPending && activeType === "agreement" ? "Generating..." : "Download Agreement (PDF)"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
