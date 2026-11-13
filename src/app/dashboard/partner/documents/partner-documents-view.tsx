"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  Award,
  FileText,
  Download,
  QrCode,
  ShieldCheck,
  Calendar,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Printer,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateMyIdCardAction, generateMyOfferLetterAction } from "./actions";

interface PartnerDocumentsViewProps {
  fullName: string;
  userCode: string;
  existingIdCard: {
    docCode: string;
    verificationReference: string;
    issueDate: string;
  } | null;
  existingOfferLetter: {
    docCode: string;
    issueDate: string;
  } | null;
}

export function PartnerDocumentsView({
  fullName,
  userCode,
  existingIdCard,
  existingOfferLetter,
}: PartnerDocumentsViewProps) {
  const [isPending, startTransition] = useTransition();
  const [idCardData, setIdCardData] = useState(existingIdCard);
  const [offerLetterData, setOfferLetterData] = useState(existingOfferLetter);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [activeDownloadType, setActiveDownloadType] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGenerateIdCard = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setActiveDownloadType("id_card");

    startTransition(async () => {
      try {
        const result = await generateMyIdCardAction();
        if (result.success && result.base64) {
          setIdCardData({
            docCode: result.docCode,
            verificationReference: result.verificationReference,
            issueDate: new Date().toISOString().split("T")[0],
          });
          setSuccessMsg(`Official ID Card (${result.docCode}) generated successfully!`);
          
          // Trigger browser download
          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${result.base64}`;
          link.download = `LMB_ID_Card_${userCode}.pdf`;
          link.click();
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to generate ID Card.");
      } finally {
        setActiveDownloadType(null);
      }
    });
  };

  const handleGenerateOfferLetter = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setActiveDownloadType("offer_letter");

    startTransition(async () => {
      try {
        const result = await generateMyOfferLetterAction();
        if (result.success && result.base64) {
          setOfferLetterData({
            docCode: result.docCode,
            issueDate: new Date().toISOString().split("T")[0],
          });
          setSuccessMsg(`Official Appointment Offer Letter (${result.docCode}) generated successfully!`);

          // Trigger browser download
          const link = document.createElement("a");
          link.href = `data:application/pdf;base64,${result.base64}`;
          link.download = `LMB_Offer_Letter_${userCode}.pdf`;
          link.click();
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to generate Offer Letter.");
      } finally {
        setActiveDownloadType(null);
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

      {/* Grid: ID Card & Offer Letter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Official Partner ID Card (Module 2) */}
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-600" />
                  <span>Digital Identity Card</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  CR80-specification credential with cryptographic QR verification.
                </CardDescription>
              </div>
              <Badge variant="success" className="text-[10px] font-bold">
                Active & Verified
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Card Graphical Mockup */}
              <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-900 via-slate-900 to-blue-950 p-4 text-white shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                  <div>
                    <span className="text-[11px] font-extrabold tracking-wider block">LETS MAKE BRAND</span>
                    <span className="text-[8px] text-teal-300 font-bold uppercase tracking-widest block">
                      Brand Promotion Partner
                    </span>
                  </div>
                  <div className="h-6 w-6 rounded-md bg-white/10 flex items-center justify-center font-black text-xs text-teal-300">
                    L
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-sm font-bold block">{fullName}</span>
                    <div className="text-[10px] font-mono text-teal-200">
                      ID: <span className="font-bold text-white">{userCode}</span>
                    </div>
                    <div className="text-[9px] text-slate-300">
                      Status: <span className="text-emerald-400 font-bold">Active & Certified</span>
                    </div>
                  </div>

                  <div className="h-16 w-16 bg-white rounded-lg p-1.5 flex flex-col items-center justify-center shrink-0">
                    <QrCode className="h-12 w-12 text-slate-900" />
                    <span className="text-[6px] text-slate-500 font-bold">VERIFY</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[8px] text-slate-400">
                  <span>www.letsmakebrand.com</span>
                  <span>Authentic LMB Credential</span>
                </div>
              </div>

              {idCardData && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Document ID:</span>
                    <span className="font-mono font-bold text-slate-900">{idCardData.docCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Verification Ref:</span>
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
            <span className="text-[11px] text-slate-400">Standard printable PDF format</span>
            <Button
              onClick={handleGenerateIdCard}
              disabled={isPending && activeDownloadType === "id_card"}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-9 gap-1.5 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              {isPending && activeDownloadType === "id_card" ? "Generating PDF..." : "Download ID Card (PDF)"}
            </Button>
          </div>
        </Card>

        {/* 2. Official Appointment Offer Letter (Module 3) */}
        <Card className="border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <CardHeader className="p-5 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span>Official Appointment Letter</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Formal engagement agreement with terms, responsibilities, and commission policy.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold">
                A4 Corporate
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Engagement Specification
                  </span>
                  <span className="text-[10px] text-slate-400">Independent Affiliate</span>
                </div>

                <div className="space-y-1 text-slate-600 leading-relaxed text-[11px]">
                  <p>
                    &bull; <span className="font-semibold text-slate-900">Legal Classification:</span> Independent Promotional Partner (Performance-based contractor).
                  </p>
                  <p>
                    &bull; <span className="font-semibold text-slate-900">Commission Policy:</span> Weekly disbursements on verified approved conversions.
                  </p>
                  <p>
                    &bull; <span className="font-semibold text-slate-900">Authorized Signatory:</span> Head of Partner Compliance, Lets Make Brand.
                  </p>
                </div>
              </div>

              {offerLetterData && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Agreement ID:</span>
                    <span className="font-mono font-bold text-slate-900">{offerLetterData.docCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Issued Date:</span>
                    <span className="text-slate-700">{offerLetterData.issueDate}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">High-resolution PDF document</span>
            <Button
              onClick={handleGenerateOfferLetter}
              disabled={isPending && activeDownloadType === "offer_letter"}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 gap-1.5 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              {isPending && activeDownloadType === "offer_letter" ? "Generating Document..." : "Download Offer Letter (PDF)"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
