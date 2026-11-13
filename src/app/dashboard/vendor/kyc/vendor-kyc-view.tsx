"use client";

import React, { useState, useTransition } from "react";
import {
  Building2,
  ShieldCheck,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { submitVendorKycAction } from "./actions";

export interface VendorKycData {
  id: string;
  kycCode: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  panMasked: string;
  bankAccountHolder: string;
  bankAccountMasked: string;
  ifscCode: string;
  bankName: string | null;
  upiId: string | null;
  status: string;
  rejectionReason: string | null;
  adminRemarks: string | null;
  submittedAt: string;
}

interface VendorKycViewProps {
  initialKyc: VendorKycData | null;
  businessName: string;
}

export function VendorKycView({ initialKyc, businessName }: VendorKycViewProps) {
  const [kyc, setKyc] = useState<VendorKycData | null>(initialKyc);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [entityName, setEntityName] = useState(initialKyc?.fullName || businessName || "");
  const [incorpDate, setIncorpDate] = useState(initialKyc?.dateOfBirth || "2020-01-01");
  const [bizAddress, setBizAddress] = useState(initialKyc?.address || "");
  const [panNumber, setPanNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState(initialKyc?.bankAccountHolder || businessName || "");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState(initialKyc?.ifscCode || "");
  const [bankName, setBankName] = useState(initialKyc?.bankName || "");
  const [docName, setDocName] = useState("business_pan_and_gst.pdf");

  const canEdit = !kyc || kyc.status === "not_submitted" || kyc.status === "resubmission_required";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const result = await submitVendorKycAction({
          fullName: entityName,
          dateOfBirth: incorpDate,
          address: bizAddress,
          panNumber: panNumber.trim().toUpperCase(),
          bankAccountHolder: accountHolder,
          bankAccountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          bankName: bankName.trim() || undefined,
          documents: [
            {
              documentType: "business_reg",
              documentName: docName,
              filePath: `kyc/vendor_${Date.now()}_${docName}`,
              mimeType: "application/pdf",
              fileSize: 300000,
            },
          ],
        });

        if (result.success) {
          setSuccessMsg("Corporate Agency KYC submitted successfully! Our enterprise team will audit your credentials.");
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to submit agency KYC.");
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

      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${kyc?.status === "approved" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
              {kyc?.status === "approved" ? <ShieldCheck className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  Agency Commercial Verification (KYC)
                </h3>
                <Badge variant={kyc?.status === "approved" ? "success" : "warning"} className="text-xs font-bold">
                  {kyc?.status === "approved" ? "Accredited & Verified" : kyc?.status === "pending" ? "Pending Review" : "Not Verified"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Required for enterprise override payouts, contract offer letters, and agency credential verification.
              </p>
            </div>
          </div>
          {kyc?.kycCode && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Reference</span>
              <span className="font-mono text-xs font-bold text-slate-900">{kyc.kycCode}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Commercial Entity & Banking Registration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Registered Business / Trade Name *
                </label>
                <Input
                  required
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Incorporation / Registration Date *
                </label>
                <Input
                  type="date"
                  required
                  value={incorpDate}
                  onChange={(e) => setIncorpDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Registered Commercial Address *
                </label>
                <Input
                  required
                  value={bizAddress}
                  onChange={(e) => setBizAddress(e.target.value)}
                  placeholder="Complete registered commercial office address"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Commercial Entity PAN * (10 Chars)
                </label>
                <Input
                  required
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. AAACB1234F"
                  className="text-xs font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Corporate Bank Account Holder *
                </label>
                <Input
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Corporate Bank Account Number *
                </label>
                <Input
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  IFSC Code *
                </label>
                <Input
                  required
                  maxLength={11}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ICIC0000001"
                  className="text-xs font-mono font-bold uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  GSTIN / Incorporation Certificate File *
                </label>
                <Input
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6"
            >
              {isPending ? "Submitting Agency KYC..." : "Submit Commercial KYC"}
            </Button>
          </div>
        </form>
      ) : (
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Verified Agency Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Business Name</span>
              <span className="font-bold text-slate-900">{kyc.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">PAN (Masked)</span>
              <span className="font-mono font-bold text-slate-900">{kyc.panMasked}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">A/C Number (Masked)</span>
              <span className="font-mono font-bold text-slate-900">{kyc.bankAccountMasked}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">IFSC Code</span>
              <span className="font-mono font-bold text-slate-900">{kyc.ifscCode}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
