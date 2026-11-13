"use client";

import React, { useState, useTransition } from "react";
import {
  Plus,
  X,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { submitLeadAction } from "./actions";
import { DynamicFieldDef } from "@/lib/types/database.types";
import { formatCurrency } from "@/lib/utils";

export interface CampaignForSubmission {
  id: string;
  campaignCode: string;
  title: string;
  brandName: string;
  commissionAmount: number;
  requiredDocuments: string[];
  dynamicFields: DynamicFieldDef[];
}

interface SubmitLeadDialogProps {
  campaign: CampaignForSubmission;
  triggerButton?: React.ReactNode;
  onSuccess?: () => void;
}

export function SubmitLeadDialog({
  campaign,
  triggerButton,
  onSuccess,
}: SubmitLeadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    leadCode: string;
    isDuplicate: boolean;
  } | null>(null);

  // Common fields state
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [address, setAddress] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  // Dynamic fields state: field.id -> value
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});

  // Documents state: list of { name, url, type }
  const [documents, setDocuments] = useState<
    { name: string; url: string; type?: string }[]
  >([]);
  const [newDocName, setNewDocName] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");

  const handleAddDoc = () => {
    if (!newDocName.trim() || !newDocUrl.trim()) return;
    setDocuments([...documents, { name: newDocName.trim(), url: newDocUrl.trim() }]);
    setNewDocName("");
    setNewDocUrl("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    // Validate required dynamic fields
    for (const df of campaign.dynamicFields) {
      if (df.required && (!dynamicValues[df.id] || dynamicValues[df.id] === "")) {
        setError(`Required field missing: "${df.label}"`);
        return;
      }
    }

    if (!consentConfirmed) {
      setError("Customer consent confirmation is mandatory.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await submitLeadAction({
          campaignId: campaign.id,
          customerName,
          customerMobile,
          customerEmail,
          customerLocation: customerLocation || undefined,
          address: address || undefined,
          additionalFields: dynamicValues,
          documents,
          consentConfirmed: true,
        });

        setResult({
          leadCode: res.leadCode,
          isDuplicate: res.isDuplicate,
        });

        if (onSuccess) onSuccess();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to submit lead");
      }
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setResult(null);
    setCustomerName("");
    setCustomerMobile("");
    setCustomerEmail("");
    setCustomerLocation("");
    setAddress("");
    setDynamicValues({});
    setDocuments([]);
    setConsentConfirmed(false);
  };

  return (
    <div>
      {triggerButton ? (
        <div onClick={() => setIsOpen(true)}>{triggerButton}</div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-8 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Submit Lead</span>
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Submit Promotional Lead</span>
                  <Badge variant="outline" className="font-mono text-xs text-blue-700">
                    {campaign.campaignCode}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  {campaign.title} ({campaign.brandName}) • Potential Commission:{" "}
                  <strong className="text-emerald-700">
                    {formatCurrency(campaign.commissionAmount)}
                  </strong>
                </CardDescription>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {/* SUCCESS / RESULT SCREEN */}
              {result ? (
                <div className="p-6 text-center space-y-4">
                  {result.isDuplicate ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                      <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto" />
                      <h3 className="text-base font-bold text-amber-900">
                        Duplicate Lead Detected
                      </h3>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        A submission for this customer mobile/email already exists for this campaign. 
                        Assigned Reference: <strong className="font-mono">{result.leadCode}</strong>.
                      </p>
                      <p className="text-[11px] text-amber-700">
                        In accordance with platform anti-fraud compliance (Module 7), duplicate records do not accrue duplicate commissions.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                      <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                      <h3 className="text-base font-bold text-emerald-900">
                        Lead Ingested Successfully!
                      </h3>
                      <p className="text-xs text-emerald-800">
                        Your referral has been ingested into PostgreSQL. Assigned Tracking Code:
                      </p>
                      <div className="inline-block px-4 py-1.5 rounded-lg bg-white border border-emerald-300 font-mono text-sm font-bold text-emerald-700">
                        {result.leadCode}
                      </div>
                      <p className="text-[11px] text-emerald-700">
                        The lead has entered verification queue. Track its real-time approval status in your Leads dashboard.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleClose}
                    className="h-9 px-6 bg-slate-900 text-white font-semibold text-xs"
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      {error}
                    </div>
                  )}

                  {/* 1. Core Customer Information */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                      1. Customer Contact Details
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="cust-name" className="text-xs font-semibold">
                          Customer Full Legal Name *
                        </Label>
                        <Input
                          id="cust-name"
                          required
                          placeholder="e.g. Vikram Malhotra"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="cust-mobile" className="text-xs font-semibold">
                          Customer Mobile Number *
                        </Label>
                        <Input
                          id="cust-mobile"
                          required
                          placeholder="10-digit mobile number"
                          value={customerMobile}
                          onChange={(e) => setCustomerMobile(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="cust-email" className="text-xs font-semibold">
                          Customer Email Address *
                        </Label>
                        <Input
                          id="cust-email"
                          type="email"
                          required
                          placeholder="customer@example.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="cust-loc" className="text-xs font-semibold">
                          City / Location
                        </Label>
                        <Input
                          id="cust-loc"
                          placeholder="e.g. Mumbai, Bengaluru"
                          value={customerLocation}
                          onChange={(e) => setCustomerLocation(e.target.value)}
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cust-address" className="text-xs font-semibold">
                        Customer Address (Optional)
                      </Label>
                      <Input
                        id="cust-address"
                        placeholder="Street, area, postal code"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  {/* 2. Campaign-Specific Dynamic Fields (Module 4) */}
                  {campaign.dynamicFields.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
                        2. Campaign Qualification Questions
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {campaign.dynamicFields.map((field) => (
                          <div key={field.id} className="space-y-1.5">
                            <Label className="text-xs font-semibold">
                              {field.label} {field.required && "*"}
                            </Label>
                            {field.type === "select" && field.options ? (
                              <select
                                required={field.required}
                                value={dynamicValues[field.id] || ""}
                                onChange={(e) =>
                                  setDynamicValues({
                                    ...dynamicValues,
                                    [field.id]: e.target.value,
                                  })
                                }
                                className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
                              >
                                <option value="">Select option...</option>
                                {field.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === "number" ? (
                              <Input
                                type="number"
                                required={field.required}
                                placeholder={field.placeholder || `Enter ${field.label}`}
                                value={dynamicValues[field.id] || ""}
                                onChange={(e) =>
                                  setDynamicValues({
                                    ...dynamicValues,
                                    [field.id]: e.target.value,
                                  })
                                }
                                className="h-9 text-xs"
                              />
                            ) : (
                              <Input
                                type="text"
                                required={field.required}
                                placeholder={field.placeholder || `Enter ${field.label}`}
                                value={dynamicValues[field.id] || ""}
                                onChange={(e) =>
                                  setDynamicValues({
                                    ...dynamicValues,
                                    [field.id]: e.target.value,
                                  })
                                }
                                className="h-9 text-xs"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Supporting Documents (Module 4) */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        3. Supporting Documents
                      </h4>
                      {campaign.requiredDocuments.length > 0 && (
                        <span className="text-[11px] text-blue-700 font-medium">
                          Suggested: {campaign.requiredDocuments.join(", ")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Document Name (e.g. Aadhaar Card, Salary Slip)"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <Input
                        placeholder="Document File URL (HTTPS)"
                        value={newDocUrl}
                        onChange={(e) => setNewDocUrl(e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddDoc}
                        className="h-8 text-xs px-2.5"
                      >
                        Attach
                      </Button>
                    </div>

                    {documents.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {documents.map((doc, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                          >
                            <span className="font-semibold text-slate-800">{doc.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-500 truncate max-w-xs">
                                {doc.url}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setDocuments(documents.filter((_, i) => i !== idx))
                                }
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Customer Consent & Authorization */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={consentConfirmed}
                        onChange={(e) => setConsentConfirmed(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-blue-600 h-4 w-4"
                      />
                      <div className="text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold block text-slate-900">
                          Customer Authorization & Consent Confirmation *
                        </span>
                        I confirm that the customer has explicitly authorized Lets Make Brand and its partner network to submit this application on their behalf and contact them regarding qualifying offers.
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      disabled={isPending}
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
                    >
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Submit Lead for Verification</span>
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

