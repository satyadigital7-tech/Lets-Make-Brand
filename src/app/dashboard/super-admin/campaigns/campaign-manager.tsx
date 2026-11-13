"use client";

import React, { useState, useTransition } from "react";
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  X,
  Loader2,
  CheckCircle2,
  DollarSign,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/common/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createCampaignAction, toggleCampaignStatusAction } from "./actions";
import { CampaignCreateFormData, campaignCreateSchema } from "@/lib/security/validation";

interface CampaignItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  commission_rate: number;
  commission_type: "percentage" | "fixed";
  budget: number;
  status: "draft" | "pending_approval" | "active" | "paused" | "completed";
  created_at: string;
}

interface CampaignManagerProps {
  initialCampaigns: CampaignItem[];
}

export function CampaignManager({ initialCampaigns }: CampaignManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formData, setFormData] = useState<CampaignCreateFormData>({
    title: "",
    category: "SaaS & Cloud",
    description: "",
    targetAudience: "",
    commissionRate: 15,
    commissionType: "percentage",
    budget: 10000,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFeedback(null);

    const result = campaignCreateSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      try {
        await createCampaignAction(formData);
        setFeedback("Campaign created successfully and published to PostgreSQL.");
        setIsModalOpen(false);
        setFormData({
          title: "",
          category: "SaaS & Cloud",
          description: "",
          targetAudience: "",
          commissionRate: 15,
          commissionType: "percentage",
          budget: 10000,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create campaign";
        setFeedback(`Error: ${msg}`);
      }
    });
  };

  const handleToggleStatus = (campaignId: string, currentStatus: string) => {
    setFeedback(null);
    const newStatus = currentStatus === "active" ? "paused" : "active";

    startTransition(async () => {
      try {
        await toggleCampaignStatusAction(campaignId, newStatus);
        setFeedback(`Campaign status changed to ${newStatus}.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update status";
        setFeedback(`Error: ${msg}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback Bar */}
      {feedback && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-blue-500 hover:text-blue-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Live Campaign Repository ({initialCampaigns.length})
          </h3>
          <p className="text-xs text-slate-500">
            All rows queried from PostgreSQL public.campaigns table
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>Create Campaign</span>
        </Button>
      </div>

      {/* Campaigns Table */}
      {initialCampaigns.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign Title & Category</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialCampaigns.map((camp) => (
              <TableRow key={camp.id}>
                <TableCell>
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-900 block">
                      {camp.title}
                    </span>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                      {camp.category}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-xs text-blue-600">
                  {camp.commission_type === "percentage"
                    ? `${camp.commission_rate}%`
                    : formatCurrency(camp.commission_rate)}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-700">
                  {formatCurrency(camp.budget)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={camp.status === "active" ? "success" : "warning"}
                    className="text-[10px] py-0 px-1.5 capitalize"
                  >
                    {camp.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-400 font-mono">
                  {formatDate(camp.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={camp.status === "active" ? "outline" : "default"}
                    onClick={() => handleToggleStatus(camp.id, camp.status)}
                    disabled={isPending}
                    className="text-xs h-7 px-2.5 gap-1"
                  >
                    {camp.status === "active" ? (
                      <>
                        <Pause className="h-3 w-3 text-amber-600" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 text-emerald-600" />
                        <span>Activate</span>
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={<Megaphone className="h-8 w-8 text-slate-400" />}
          title="No campaigns found in PostgreSQL"
          description="Create your first campaign record using the button above or execute the database seed migration."
          actionLabel="Create Campaign"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Modal Dialog for New Campaign */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Create New Enterprise Campaign
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label required htmlFor="title">Campaign Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. NextGen Cloud Platform Launch"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  error={errors.title}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label required htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <option value="SaaS & Cloud">SaaS & Cloud</option>
                    <option value="FinTech & Payments">FinTech & Payments</option>
                    <option value="E-Commerce & Fashion">E-Commerce & Fashion</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="HealthTech">HealthTech</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label required htmlFor="budget">Escrow Budget ($ USD)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) =>
                      setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })
                    }
                    error={errors.budget}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label required htmlFor="commissionRate">Commission Rate</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    step="0.01"
                    value={formData.commissionRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commissionRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    error={errors.commissionRate}
                  />
                </div>

                <div className="space-y-1">
                  <Label required htmlFor="commissionType">Commission Model</Label>
                  <select
                    id="commissionType"
                    value={formData.commissionType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commissionType: e.target.value as "percentage" | "fixed",
                      })
                    }
                    className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <option value="percentage">Percentage (%) of Sale</option>
                    <option value="fixed">Fixed Bounty ($ USD) per Lead</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="targetAudience">Target Audience Criteria</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g. Enterprise IT executives in North America"
                  value={formData.targetAudience}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAudience: e.target.value })
                  }
                  error={errors.targetAudience}
                />
              </div>

              <div className="space-y-1">
                <Label required htmlFor="description">Campaign Description</Label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Detailed guidelines, conversion criteria, and promotional dos/don'ts..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                />
                {errors.description && (
                  <p className="text-xs text-rose-600 font-medium">{errors.description}</p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isPending} className="font-semibold">
                  Publish Campaign to PostgreSQL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

