"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Link2,
  Copy,
  Check,
  QrCode,
  Share2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface CampaignOption {
  id: string;
  title: string;
  slug: string;
  category: string;
  commission_rate: number;
  commission_type: string;
  brand_name?: string;
  target_audience?: string;
}

interface PartnerLinksViewProps {
  partnerId: string;
  partnerCode: string;
  campaigns: CampaignOption[];
  siteUrl: string;
}

export function PartnerLinksView({
  partnerId,
  partnerCode,
  campaigns,
  siteUrl,
}: PartnerLinksViewProps) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    campaigns[0]?.id || ""
  );
  const [subId, setSubId] = useState<string>("");
  const [utmSource, setUtmSource] = useState<string>("partner_direct");
  const [copied, setCopied] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const activeCampaign =
    campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  // Construct referral tracking URL
  const campaignSlug = activeCampaign?.slug || "general";
  const refParam = partnerCode || partnerId.slice(0, 8).toUpperCase();

  let generatedUrl = `${siteUrl}/c/${campaignSlug}?ref=${encodeURIComponent(refParam)}`;
  if (subId.trim()) {
    generatedUrl += `&subid=${encodeURIComponent(subId.trim())}`;
  }
  if (utmSource.trim()) {
    generatedUrl += `&utm_source=${encodeURIComponent(utmSource.trim())}`;
  }

  // Generate QR code when URL changes
  useEffect(() => {
    if (generatedUrl) {
      QRCode.toDataURL(generatedUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(""));
    }
  }, [generatedUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `lmb_qr_${campaignSlug}_${refParam}.png`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Link Generator Config */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="p-6 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  Custom Referral Link Builder
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Generate unique trackable attribution links for social media, PPC, and offline campaigns.
                </CardDescription>
              </div>
              <Badge variant="brand" className="text-[11px] gap-1">
                <Sparkles className="h-3 w-3" />
                Live Attribution
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {/* 1. Campaign Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Target Campaign
              </label>
              {campaigns.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campaigns.map((camp) => {
                    const isSelected = camp.id === selectedCampaignId;
                    return (
                      <button
                        key={camp.id}
                        type="button"
                        onClick={() => setSelectedCampaignId(camp.id)}
                        className={`text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 shadow-xs"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-sm line-clamp-1">
                            {camp.title}
                          </span>
                          <span className="text-xs font-bold text-blue-600 shrink-0">
                            {camp.commission_type === "percentage"
                              ? `${camp.commission_rate}%`
                              : formatCurrency(camp.commission_rate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span>{camp.category}</span>
                          {camp.brand_name && <span>• {camp.brand_name}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No active campaigns available.</p>
              )}
            </div>

            {/* 2. Sub-ID and Channel Tagging */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sub-ID / Channel Tag (Optional)
                </label>
                <input
                  type="text"
                  value={subId}
                  onChange={(e) => setSubId(e.target.value)}
                  placeholder="e.g. youtube_vlog, insta_bio, email_blast"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Identifies specific traffic sources in your commission ledger.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  UTM Source (Optional)
                </label>
                <select
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="partner_direct">Direct / Organic</option>
                  <option value="social_media">Social Media (FB, X, Insta)</option>
                  <option value="youtube">YouTube Video / Shorts</option>
                  <option value="newsletter">Email Newsletter</option>
                  <option value="paid_ads">PPC / Paid Ads</option>
                  <option value="offline_print">Offline / QR Print</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Standard campaign tracking telemetry.
                </span>
              </div>
            </div>

            {/* 3. Generated Tracking URL */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Your Unique Tracking Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedUrl}
                  className="flex-1 text-xs font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 select-all"
                />
                <Button
                  onClick={handleCopy}
                  className={`gap-1.5 font-semibold text-xs px-4 py-2.5 rounded-lg transition-all ${
                    copied
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy Link</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  Protected by PostgreSQL attribution ledger. All customer leads submitted via this link will automatically attribute commissions to your wallet.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code & Direct Preview */}
      <div className="space-y-6">
        <Card className="border-slate-200 bg-white text-center">
          <CardHeader className="p-6 pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-center gap-1.5">
              <QrCode className="h-4 w-4 text-blue-600" />
              <span>Instant QR Code</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Print-ready vector QR for billboards, business cards & posters.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex flex-col items-center">
            {qrDataUrl ? (
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <img
                  src={qrDataUrl}
                  alt="Referral QR Code"
                  className="h-44 w-44 object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="h-44 w-44 bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}

            <div className="space-y-1 text-center">
              <span className="text-xs font-bold text-slate-800 block">
                {activeCampaign?.title || "Campaign"}
              </span>
              <span className="text-[11px] text-slate-400 font-mono block">
                Ref Code: {refParam}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadQr}
              className="gap-1.5 text-xs font-semibold w-full"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download High-Res QR</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
