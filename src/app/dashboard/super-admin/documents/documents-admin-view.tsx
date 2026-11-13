"use client";

import React, { useState, useTransition } from "react";
import {
  FileText,
  Award,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  UserCheck,
  Shield,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { saveDocumentTemplateAction } from "./actions";

export interface TemplateItem {
  id: string;
  templateType: "id_card_partner" | "id_card_vendor" | "offer_letter_partner" | "offer_letter_vendor";
  title: string;
  companyName: string;
  companyAddress: string;
  companyWebsite: string;
  companyLogoUrl: string | null;
  signatoryName: string;
  signatoryTitle: string;
  signatorySignatureUrl: string | null;
  termsContent: string | null;
  commissionPolicyRef: string | null;
  responsibilities: string | null;
}

interface DocumentsAdminViewProps {
  initialTemplates: TemplateItem[];
}

export function DocumentsAdminView({ initialTemplates }: DocumentsAdminViewProps) {
  const [templates, setTemplates] = useState<TemplateItem[]>(initialTemplates);
  const [selectedType, setSelectedType] = useState<TemplateItem["templateType"]>("offer_letter_partner");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeTemplate = templates.find((t) => t.templateType === selectedType) || templates[0];

  const [title, setTitle] = useState(activeTemplate?.title || "");
  const [companyName, setCompanyName] = useState(activeTemplate?.companyName || "Lets Make Brand Platforms Pvt. Ltd.");
  const [companyAddress, setCompanyAddress] = useState(activeTemplate?.companyAddress || "");
  const [companyWebsite, setCompanyWebsite] = useState(activeTemplate?.companyWebsite || "https://letsmakebrand.com");
  const [signatoryName, setSignatoryName] = useState(activeTemplate?.signatoryName || "Super Administrator");
  const [signatoryTitle, setSignatoryTitle] = useState(activeTemplate?.signatoryTitle || "Head of Compliance");
  const [termsContent, setTermsContent] = useState(activeTemplate?.termsContent || "");
  const [commissionPolicyRef, setCommissionPolicyRef] = useState(activeTemplate?.commissionPolicyRef || "");
  const [responsibilities, setResponsibilities] = useState(activeTemplate?.responsibilities || "");

  const handleSelectType = (type: TemplateItem["templateType"]) => {
    setSelectedType(type);
    const tmpl = templates.find((t) => t.templateType === type);
    if (tmpl) {
      setTitle(tmpl.title);
      setCompanyName(tmpl.companyName);
      setCompanyAddress(tmpl.companyAddress);
      setCompanyWebsite(tmpl.companyWebsite);
      setSignatoryName(tmpl.signatoryName);
      setSignatoryTitle(tmpl.signatoryTitle);
      setTermsContent(tmpl.termsContent || "");
      setCommissionPolicyRef(tmpl.commissionPolicyRef || "");
      setResponsibilities(tmpl.responsibilities || "");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const result = await saveDocumentTemplateAction({
          templateType: selectedType,
          title,
          companyName,
          companyAddress,
          companyWebsite,
          signatoryName,
          signatoryTitle,
          termsContent: termsContent || undefined,
          commissionPolicyRef: commissionPolicyRef || undefined,
          responsibilities: responsibilities || undefined,
        });

        if (result.success) {
          setSuccessMsg(`Document template for ${selectedType.replace(/_/g, " ").toUpperCase()} saved successfully!`);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to save template.");
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

      {/* Template Type Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { type: "offer_letter_partner" as const, label: "Partner Offer Letter", icon: FileText },
          { type: "offer_letter_vendor" as const, label: "Vendor Appointment Agreement", icon: FileText },
          { type: "id_card_partner" as const, label: "Partner ID Card Template", icon: Award },
          { type: "id_card_vendor" as const, label: "Vendor ID Card Template", icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedType === tab.type;
          return (
            <button
              key={tab.type}
              type="button"
              onClick={() => handleSelectType(tab.type)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company & Signatory Settings */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              <span>Company Information & Authorized Signatory</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Configures official letterhead branding, header text, and digital signature details.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Document Template Title *
              </label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Official Company Legal Name *
              </label>
              <Input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Registered Corporate Address *
              </label>
              <Input
                required
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Official Website URL *
              </label>
              <Input
                required
                type="url"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Signatory Name *
                </label>
                <Input
                  required
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Signatory Designation *
                </label>
                <Input
                  required
                  value={signatoryTitle}
                  onChange={(e) => setSignatoryTitle(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Terms & Responsibilities */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>Contractual Terms, Scope & Policies</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Legally binding role terms rendered in generated PDFs.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Core Engagement Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={termsContent}
                onChange={(e) => setTermsContent(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Commission Policy Reference
              </label>
              <textarea
                rows={2}
                value={commissionPolicyRef}
                onChange={(e) => setCommissionPolicyRef(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Key Responsibilities & Compliance Mandates
              </label>
              <textarea
                rows={2}
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 px-6 gap-1.5 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {isPending ? "Saving Template..." : "Save Template Configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
}
