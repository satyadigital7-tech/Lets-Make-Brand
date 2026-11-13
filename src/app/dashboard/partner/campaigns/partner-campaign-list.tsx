"use client";

import React, { useState } from "react";
import {
  Megaphone,
  Link2,
  Copy,
  CheckCircle2,
  Calendar,
  Building,
  Tag,
  DollarSign,
  FileText,
  Info,
  X,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SubmitLeadDialog, CampaignForSubmission } from "../leads/submit-lead-dialog";

export interface PartnerCampaignItem extends CampaignForSubmission {
  slug: string;
  category: string;
  description: string;
  instructions: string | null;
  eligibility: string | null;
  bannerImageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

interface PartnerCampaignListProps {
  campaigns: PartnerCampaignItem[];
  userId: string;
  siteUrl: string;
}

export function PartnerCampaignList({
  campaigns,
  userId,
  siteUrl,
}: PartnerCampaignListProps) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<PartnerCampaignItem | null>(null);

  const handleCopyLink = (slug: string) => {
    const link = `${siteUrl}/c/${slug}?ref=${userId}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-4">
      {campaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((camp) => {
            const trackingLink = `${siteUrl}/c/${camp.slug}?ref=${userId}`;

            return (
              <Card key={camp.id} className="border-slate-200 shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] text-blue-700">
                          {camp.campaignCode}
                        </Badge>
                        <Badge variant="success" className="text-[10px]">
                          {camp.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-bold text-slate-900 line-clamp-1">
                        {camp.title}
                      </CardTitle>
                      <CardDescription className="text-xs flex items-center gap-1.5 text-slate-600">
                        <Building className="h-3 w-3 text-blue-600" />
                        <span>Brand: {camp.brandName}</span>
                      </CardDescription>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Payout
                      </span>
                      <span className="text-sm font-bold text-emerald-700">
                        {formatCurrency(camp.commissionAmount)}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {camp.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-slate-400" />
                      {camp.category}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      {camp.startDate ? formatDate(camp.startDate) : "Ongoing"}
                    </span>
                  </div>

                  {/* Referral Link Box */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-[10px] text-slate-500 truncate">
                      {trackingLink}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyLink(camp.slug)}
                      className="h-6 text-[10px] px-2 gap-1 text-slate-700 shrink-0"
                    >
                      {copiedSlug === camp.slug ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDetailCampaign(camp)}
                      className="h-8 text-xs text-slate-600 gap-1"
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </Button>

                    <SubmitLeadDialog
                      campaign={camp}
                      triggerButton={
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Submit Lead</span>
                        </Button>
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-slate-200">
          <CardContent className="p-12 text-center text-xs text-slate-500 space-y-2">
            <Megaphone className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="font-bold text-slate-700">No Authorized Campaigns Found</p>
            <p className="text-slate-400">
              There are currently no active campaigns assigned to your partner account. New promotional offers will appear here when published.
            </p>
          </CardContent>
        </Card>
      )}

      {/* DETAIL MODAL */}
      {detailCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-lg shadow-2xl border-slate-200 max-h-[85vh] overflow-y-auto">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  {detailCampaign.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {detailCampaign.brandName} • Code: {detailCampaign.campaignCode}
                </CardDescription>
              </div>
              <button
                onClick={() => setDetailCampaign(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-800 block">Offer Description</span>
                <p className="text-slate-600 leading-relaxed">{detailCampaign.description}</p>
              </div>

              {detailCampaign.instructions && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">Partner Instructions</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border">
                    {detailCampaign.instructions}
                  </p>
                </div>
              )}

              {detailCampaign.eligibility && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">Customer Eligibility</span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border">
                    {detailCampaign.eligibility}
                  </p>
                </div>
              )}

              {detailCampaign.requiredDocuments.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">Required Supporting Documents</span>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                    {detailCampaign.requiredDocuments.map((doc, idx) => (
                      <li key={idx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px]">Commission</span>
                  <strong className="text-emerald-700 font-bold text-sm">
                    {formatCurrency(detailCampaign.commissionAmount)}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDetailCampaign(null)}
                    className="h-8 text-xs"
                  >
                    Close
                  </Button>
                  <SubmitLeadDialog
                    campaign={detailCampaign}
                    triggerButton={
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Submit Lead</span>
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

