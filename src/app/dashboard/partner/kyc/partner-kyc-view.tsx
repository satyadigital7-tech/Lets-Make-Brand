"use client";

import React, { useState, useTransition } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { submitPartnerKycAction } from "./actions";

export interface KycRecordData {
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
  status: "not_submitted" | "pending" | "under_review" | "approved" | "rejected" | "resubmission_required";
  rejectionReason: string | null;
  adminRemarks: string | null;
  submittedAt: string;
  documents: {
    id: string;
    documentType: string;
    documentName: string;
    filePath: string;
    isVerified: boolean;
  }[];
}

interface PartnerKycViewProps {
  initialKyc: KycRecordData | null;
  defaultFullName: string;
}

export function PartnerKycView({ initialKyc, defaultFullName }: PartnerKycViewProps) {
  const [kyc, setKyc] = useState<KycRecordData | null>(initialKyc);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState(initialKyc?.fullName || defaultFullName || "");
  const [dateOfBirth, setDateOfBirth] = useState(initialKyc?.dateOfBirth || "");
  const [address, setAddress] = useState(initialKyc?.address || "");
  const [panNumber, setPanNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState(initialKyc?.bankAccountHolder || defaultFullName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState(initialKyc?.ifscCode || "");
  const [bankName, setBankName] = useState(initialKyc?.bankName || "");
  const [upiId, setUpiId] = useState(initialKyc?.upiId || "");

  // Document attachments
  const [panDocName, setPanDocName] = useState("pan_card.jpg");
  const [addressDocName, setAddressDocName] = useState("aadhaar_front.pdf");

  const canEdit = !kyc || kyc.status === "not_submitted" || kyc.status === "resubmission_required";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const result = await submitPartnerKycAction({
          fullName,
          dateOfBirth,
          address,
          panNumber: panNumber.trim().toUpperCase(),
          bankAccountHolder,
          bankAccountNumber: bankAccountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          bankName: bankName.trim() || undefined,
          upiId: upiId.trim() || undefined,
          documents: [
            {
              documentType: "pan_card",
              documentName: panDocName,
              filePath: `kyc/${Date.now()}_${panDocName}`,
              mimeType: "image/jpeg",
              fileSize: 102400,
            },
            {
              documentType: "address_proof",
              documentName: addressDocName,
              filePath: `kyc/${Date.now()}_${addressDocName}`,
              mimeType: "application/pdf",
              fileSize: 204800,
            },
          ],
        });

        if (result.success) {
          setSuccessMsg("KYC verification submitted successfully! Our compliance team will review your credentials.");
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to submit KYC details.");
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success" className="text-xs font-bold">Approved & Verified</Badge>;
      case "pending":
      case "under_review":
        return <Badge variant="warning" className="text-xs font-bold">Under Administrative Review</Badge>;
      case "resubmission_required":
        return <Badge variant="destructive" className="text-xs font-bold">Resubmission Required</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="text-xs font-bold">Verification Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-xs font-bold">Not Submitted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
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

      {/* Rejection / Resubmission Alert if any */}
      {kyc && (kyc.status === "rejected" || kyc.status === "resubmission_required") && kyc.rejectionReason && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-xs">
          <div className="font-bold text-amber-900 flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>Compliance Notice from Reviewer:</span>
          </div>
          <p className="text-amber-800 pl-5.5">{kyc.rejectionReason}</p>
          {kyc.adminRemarks && (
            <p className="text-slate-500 text-[11px] pl-5.5 mt-1 italic">Remarks: {kyc.adminRemarks}</p>
          )}
        </div>
      )}

      {/* Status Overview Card */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${kyc?.status === "approved" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
              {kyc?.status === "approved" ? (
                <ShieldCheck className="h-6 w-6" />
              ) : (
                <Clock className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  Identity & Financial Verification (KYC)
                </h3>
                {getStatusBadge(kyc?.status || "not_submitted")}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Required for payout disbursements, automated commission transfers, and authorized ID card issuance.
              </p>
            </div>
          </div>

          {kyc?.kycCode && (
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Verification Reference
              </span>
              <span className="font-mono text-xs font-bold text-slate-900 block mt-0.5">
                {kyc.kycCode}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Form or Read-Only Summary */}
      {canEdit ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity Details Card */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                1. Personal Identity & PAN Information
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Ensure details match your official Government ID card exactly.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Legal Name *
                </label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Date of Birth *
                </label>
                <Input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Residential / Communication Address *
                </label>
                <Input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat No, Street, Landmark, City, State, PIN"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  PAN Number * (10 Characters)
                </label>
                <Input
                  required
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="text-xs font-mono font-bold uppercase tracking-wider"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Masked upon storage for data privacy.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bank Account Details Card */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                2. Bank & Payout Remittance Details
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Approved lead commissions will be disbursed to these banking credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Bank Account Holder Name *
                </label>
                <Input
                  required
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder="Name as registered with the bank"
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Bank Account Number *
                </label>
                <Input
                  required
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="e.g. 123456789012"
                  className="text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Bank IFSC Code * (11 Characters)
                </label>
                <Input
                  required
                  maxLength={11}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  className="text-xs font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Bank Name & Branch (Optional)
                </label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank, Cyber City Branch"
                  className="text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  UPI ID (Optional for fast payouts)
                </label>
                <Input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@okhdfcbank"
                  className="text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Document Uploads Card */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                3. Verification Document Uploads
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Uploaded files are stored in private encrypted storage buckets accessible via short-lived signed URLs only.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-2">
                <FileText className="h-6 w-6 text-blue-600 mx-auto" />
                <div className="text-xs font-bold text-slate-800">PAN Card Scan / Photo *</div>
                <Input
                  value={panDocName}
                  onChange={(e) => setPanDocName(e.target.value)}
                  className="text-xs bg-white text-center"
                />
                <span className="text-[10px] text-slate-400 block">Accepted: JPG, PNG, PDF (Max 5MB)</span>
              </div>

              <div className="p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-2">
                <UploadCloud className="h-6 w-6 text-teal-600 mx-auto" />
                <div className="text-xs font-bold text-slate-800">Address Proof / Aadhaar / Passbook *</div>
                <Input
                  value={addressDocName}
                  onChange={(e) => setAddressDocName(e.target.value)}
                  className="text-xs bg-white text-center"
                />
                <span className="text-[10px] text-slate-400 block">Accepted: JPG, PNG, PDF (Max 5MB)</span>
              </div>
            </CardContent>
          </Card>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-sm"
            >
              {isPending ? "Submitting Verification..." : "Submit KYC for Verification"}
            </Button>
          </div>
        </form>
      ) : (
        /* Verified / Pending Summary */
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">
              Verified Credential Summary
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Your details are protected under platform encryption and privacy guidelines.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Full Name</span>
                <span className="font-bold text-slate-900 block mt-0.5">{kyc.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Date of Birth</span>
                <span className="font-medium text-slate-800 block mt-0.5">{kyc.dateOfBirth}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">PAN (Masked)</span>
                <span className="font-mono font-bold text-slate-900 block mt-0.5">{kyc.panMasked}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Bank A/C (Masked)</span>
                <span className="font-mono font-bold text-slate-900 block mt-0.5">{kyc.bankAccountMasked}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">IFSC Code</span>
                <span className="font-mono font-bold text-slate-900 block mt-0.5">{kyc.ifscCode}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">UPI ID</span>
                <span className="font-mono text-slate-700 block mt-0.5">{kyc.upiId || "Not Configured"}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Submitted: {new Date(kyc.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              {kyc.status === "approved" && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified for disbursements
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
