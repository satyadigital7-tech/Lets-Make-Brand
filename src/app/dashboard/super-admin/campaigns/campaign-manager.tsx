"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  PauseCircle,
  Archive,
  Edit,
  UserPlus,
  X,
  Loader2,
  Calendar,
  Building,
  Tag,
  DollarSign,
  FileText,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  createCampaignAction,
  updateCampaignAction,
  setCampaignStatusAction,
  assignCampaignAction,
  removeCampaignAssignmentAction,
} from "./actions";
import { DynamicFieldDef } from "@/lib/types/database.types";

export interface CampaignItem {
  id: string;
  campaignCode: string;
  title: string;
  brandName: string;
  slug: string;
  category: string;
  description: string;
  instructions: string | null;
  eligibility: string | null;
  bannerImageUrl: string | null;
  commissionRate: number;
  commissionAmount: number;
  maxPayout: number | null;
  budget: number;
  status: "draft" | "pending_approval" | "active" | "paused" | "completed" | "archived";
  startDate: string | null;
  endDate: string | null;
  requiredDocuments: string[];
  dynamicFields: DynamicFieldDef[];
  createdAt: string;
  assignments: {
    id: string;
    assignedType: string;
    targetName: string;
  }[];
}

export interface TargetOption {
  id: string;
  name: string;
  type: "partner" | "vendor" | "team" | "team_member";
}

interface CampaignManagerProps {
  initialCampaigns: CampaignItem[];
  availableTargets?: TargetOption[];
}

export function CampaignManager({
  initialCampaigns,
  availableTargets = [],
}: CampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>(initialCampaigns);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create & Edit modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
  const [assigningCampaign, setAssigningCampaign] = useState<CampaignItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    brandName: "",
    category: "Banking & Finance",
    description: "",
    instructions: "",
    eligibility: "",
    bannerImageUrl: "",
    commissionAmount: 500,
    maxPayout: "",
    budget: 50000,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    status: "active" as "draft" | "active" | "paused" | "completed" | "archived" | "pending_approval",
    requiredDocuments: ["Customer ID Proof", "Proof of Address"] as string[],
    dynamicFields: [] as DynamicFieldDef[],
  });

  // Assignment Modal State
  const [assignmentData, setAssignmentData] = useState({
    assignedType: "all_partners" as "all_partners" | "partner" | "vendor" | "team" | "team_member",
    targetId: "",
  });

  // Filter & Search Logic
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesStatus =
        statusFilter === "all" ? true : c.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        c.title.toLowerCase().includes(term) ||
        c.brandName.toLowerCase().includes(term) ||
        (c.campaignCode && c.campaignCode.toLowerCase().includes(term)) ||
        c.category.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [campaigns, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCampaigns.length / pageSize));
  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCampaigns.slice(start, start + pageSize);
  }, [filteredCampaigns, currentPage, pageSize]);

  // Handle Save Campaign (Create / Edit)
  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      try {
        if (editingCampaign) {
          // Update
          await updateCampaignAction(editingCampaign.id, {
            title: formData.title,
            brandName: formData.brandName,
            category: formData.category,
            description: formData.description,
            instructions: formData.instructions || undefined,
            eligibility: formData.eligibility || undefined,
            bannerImageUrl: formData.bannerImageUrl || undefined,
            commissionAmount: Number(formData.commissionAmount),
            commissionRate: Number(formData.commissionAmount),
            commissionType: "fixed",
            maxPayout: formData.maxPayout ? Number(formData.maxPayout) : null,
            budget: Number(formData.budget),
            startDate: formData.startDate || undefined,
            endDate: formData.endDate || undefined,
            status: formData.status,
            requiredDocuments: formData.requiredDocuments,
            dynamicFields: formData.dynamicFields,
          });

          setCampaigns((prev) =>
            prev.map((c) =>
              c.id === editingCampaign.id
                ? {
                    ...c,
                    title: formData.title,
                    brandName: formData.brandName || c.brandName,
                    category: formData.category,
                    description: formData.description,
                    instructions: formData.instructions || null,
                    eligibility: formData.eligibility || null,
                    bannerImageUrl: formData.bannerImageUrl || null,
                    commissionAmount: Number(formData.commissionAmount),
                    commissionRate: Number(formData.commissionAmount),
                    maxPayout: formData.maxPayout ? Number(formData.maxPayout) : null,
                    budget: Number(formData.budget),
                    startDate: formData.startDate || null,
                    endDate: formData.endDate || null,
                    status: formData.status,
                    requiredDocuments: formData.requiredDocuments,
                    dynamicFields: formData.dynamicFields,
                  }
                : c
            )
          );

          setEditingCampaign(null);
          setFeedback({ type: "success", text: "Campaign updated successfully!" });
        } else {
          // Create
          const res = await createCampaignAction({
            title: formData.title,
            brandName: formData.brandName || undefined,
            category: formData.category,
            description: formData.description,
            instructions: formData.instructions || undefined,
            eligibility: formData.eligibility || undefined,
            bannerImageUrl: formData.bannerImageUrl || undefined,
            commissionAmount: Number(formData.commissionAmount),
            commissionRate: Number(formData.commissionAmount),
            commissionType: "fixed",
            maxPayout: formData.maxPayout ? Number(formData.maxPayout) : null,
            budget: Number(formData.budget),
            startDate: formData.startDate || undefined,
            endDate: formData.endDate || undefined,
            status: formData.status,
            requiredDocuments: formData.requiredDocuments,
            dynamicFields: formData.dynamicFields,
          });

          const createdCamp = res.campaign;
          const newItem: CampaignItem = {
            id: createdCamp.id,
            campaignCode: createdCamp.campaign_code || "LMB-CMP-NEW",
            title: createdCamp.title,
            brandName: createdCamp.brand_name || formData.brandName || "Brand Client",
            slug: createdCamp.slug,
            category: createdCamp.category,
            description: createdCamp.description,
            instructions: createdCamp.instructions,
            eligibility: createdCamp.eligibility,
            bannerImageUrl: createdCamp.banner_image_url,
            commissionRate: Number(createdCamp.commission_rate),
            commissionAmount: Number(createdCamp.commission_amount || createdCamp.commission_rate),
            maxPayout: createdCamp.max_payout ? Number(createdCamp.max_payout) : null,
            budget: Number(createdCamp.budget),
            status: createdCamp.status,
            startDate: createdCamp.start_date,
            endDate: createdCamp.end_date,
            requiredDocuments: (createdCamp.required_documents as string[]) || [],
            dynamicFields: (createdCamp.dynamic_fields as DynamicFieldDef[]) || [],
            createdAt: createdCamp.created_at,
            assignments: [],
          };

          setCampaigns((prev) => [newItem, ...prev]);
          setIsCreateOpen(false);
          setFeedback({
            type: "success",
            text: `Campaign created successfully! Assigned Code: ${newItem.campaignCode}`,
          });
        }
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to save campaign",
        });
      }
    });
  };

  // Handle Quick Status Change
  const handleStatusChange = (
    campaignId: string,
    newStatus: "draft" | "active" | "paused" | "completed" | "archived"
  ) => {
    setFeedback(null);
    startTransition(async () => {
      try {
        await setCampaignStatusAction(campaignId, newStatus);
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? { ...c, status: newStatus } : c))
        );
        setFeedback({
          type: "success",
          text: `Campaign status changed to ${newStatus}.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to change status",
        });
      }
    });
  };

  // Handle Assignment
  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningCampaign) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await assignCampaignAction({
          campaignId: assigningCampaign.id,
          assignedType: assignmentData.assignedType,
          targetId: assignmentData.targetId || undefined,
        });

        const targetObj = availableTargets.find((t) => t.id === assignmentData.targetId);
        const targetLabel =
          assignmentData.assignedType === "all_partners"
            ? "All Approved Partners"
            : targetObj?.name || "Target Entity";

        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === assigningCampaign.id
              ? {
                  ...c,
                  assignments: [
                    ...c.assignments,
                    {
                      id: res.assignmentId,
                      assignedType: assignmentData.assignedType,
                      targetName: targetLabel,
                    },
                  ],
                }
              : c
          )
        );

        setAssigningCampaign(null);
        setFeedback({
          type: "success",
          text: `Campaign assigned to ${targetLabel}! Access permissions updated.`,
        });
      } catch (err: unknown) {
        setFeedback({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to assign campaign",
        });
      }
    });
  };

  const getStatusBadge = (status: CampaignItem["status"]) => {
    switch (status) {
      case "active":
        return <Badge variant="success" className="text-[10px]">Active</Badge>;
      case "draft":
        return <Badge variant="outline" className="text-[10px]">Draft</Badge>;
      case "paused":
        return <Badge variant="warning" className="text-[10px]">Paused</Badge>;
      case "completed":
        return <Badge variant="secondary" className="text-[10px]">Completed</Badge>;
      case "archived":
        return <Badge variant="destructive" className="text-[10px]">Archived</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search campaigns by title, brand, code, or category..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses ({campaigns.length})</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <Button
                onClick={() => {
                  setFormData({
                    title: "",
                    brandName: "",
                    category: "Banking & Finance",
                    description: "",
                    instructions: "",
                    eligibility: "",
                    bannerImageUrl: "",
                    commissionAmount: 500,
                    maxPayout: "",
                    budget: 50000,
                    startDate: new Date().toISOString().split("T")[0],
                    endDate: "",
                    status: "active",
                    requiredDocuments: ["Customer ID Proof", "Proof of Address"],
                    dynamicFields: [],
                  });
                  setEditingCampaign(null);
                  setIsCreateOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create Campaign</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Promotional Campaigns ({filteredCampaigns.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Manage brand offers, lead forms, commission rates, and partner squad assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedCampaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign ID</TableHead>
                    <TableHead>Campaign & Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Commission Payout</TableHead>
                    <TableHead>Assignments</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCampaigns.map((camp) => (
                    <TableRow key={camp.id} className="hover:bg-slate-50/80">
                      <TableCell className="font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                        {camp.campaignCode}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="font-bold text-xs text-slate-900">
                            {camp.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block pl-5.5">
                          Brand: {camp.brandName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {camp.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-emerald-700">
                        {formatCurrency(camp.commissionAmount)}
                        {camp.maxPayout && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Cap: {formatCurrency(camp.maxPayout)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {camp.assignments.length > 0 ? (
                          <span className="font-bold text-blue-600">
                            {camp.assignments.length} assigned
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Open / Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(camp.status)}</TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono whitespace-nowrap">
                        {camp.startDate ? formatDate(camp.startDate) : "Ongoing"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAssigningCampaign(camp);
                              setAssignmentData({
                                assignedType: "all_partners",
                                targetId: "",
                              });
                            }}
                            className="h-7 text-xs px-2 gap-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                            title="Assign to Partners or Squads"
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Assign</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setFormData({
                                title: camp.title,
                                brandName: camp.brandName,
                                category: camp.category,
                                description: camp.description,
                                instructions: camp.instructions || "",
                                eligibility: camp.eligibility || "",
                                bannerImageUrl: camp.bannerImageUrl || "",
                                commissionAmount: camp.commissionAmount,
                                maxPayout: camp.maxPayout ? String(camp.maxPayout) : "",
                                budget: camp.budget,
                                startDate: camp.startDate ? camp.startDate.split("T")[0] : "",
                                endDate: camp.endDate ? camp.endDate.split("T")[0] : "",
                                status: camp.status,
                                requiredDocuments: camp.requiredDocuments,
                                dynamicFields: camp.dynamicFields,
                              });
                              setEditingCampaign(camp);
                              setIsCreateOpen(true);
                            }}
                            className="h-7 text-xs px-2 gap-1 text-slate-700"
                            title="Edit Campaign"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </Button>

                          {camp.status === "active" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusChange(camp.id, "paused")}
                              disabled={isPending}
                              className="h-7 text-xs px-1.5 text-amber-600 hover:bg-amber-50"
                              title="Pause Campaign"
                            >
                              <PauseCircle className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusChange(camp.id, "active")}
                              disabled={isPending}
                              className="h-7 text-xs px-1.5 text-emerald-600 hover:bg-emerald-50"
                              title="Publish / Activate"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500">
              No campaigns found matching current filters.
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs">
              <span className="text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 text-xs px-2"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 text-xs px-2"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE / EDIT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  {editingCampaign ? `Edit Campaign: ${editingCampaign.campaignCode}` : "Create New Brand Campaign"}
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure promotion details, payout limits, required documents, and custom dynamic lead fields
                </CardDescription>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingCampaign(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveCampaign}>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="camp-title" className="text-xs font-semibold">
                      Campaign Title *
                    </Label>
                    <Input
                      id="camp-title"
                      required
                      placeholder="e.g. HDFC Millennia Credit Card Acquisition"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="camp-brand" className="text-xs font-semibold">
                      Brand / Client Name *
                    </Label>
                    <Input
                      id="camp-brand"
                      required
                      placeholder="e.g. HDFC Bank, Axis Bank, PolicyBazaar"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="camp-cat" className="text-xs font-semibold">
                      Category *
                    </Label>
                    <select
                      id="camp-cat"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Banking & Finance">Banking & Finance</option>
                      <option value="Insurance">Insurance</option>
                      <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                      <option value="EdTech">EdTech</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="SaaS & Technology">SaaS & Technology</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="camp-comm" className="text-xs font-semibold">
                      Commission Amount (₹) *
                    </Label>
                    <Input
                      id="camp-comm"
                      type="number"
                      required
                      min={0}
                      value={formData.commissionAmount}
                      onChange={(e) => setFormData({ ...formData, commissionAmount: Number(e.target.value) })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="camp-max" className="text-xs font-semibold">
                      Max Payout Cap (Optional)
                    </Label>
                    <Input
                      id="camp-max"
                      type="number"
                      min={0}
                      placeholder="No limit"
                      value={formData.maxPayout}
                      onChange={(e) => setFormData({ ...formData, maxPayout: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="camp-desc" className="text-xs font-semibold">
                    Description & Value Proposition *
                  </Label>
                  <textarea
                    id="camp-desc"
                    required
                    rows={3}
                    placeholder="Comprehensive description of the product or service being promoted..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="camp-inst" className="text-xs font-semibold">
                      Partner Instructions
                    </Label>
                    <textarea
                      id="camp-inst"
                      rows={2}
                      placeholder="Submission steps, dos and don'ts, verification requirements..."
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="camp-elig" className="text-xs font-semibold">
                      Customer Eligibility Criteria
                    </Label>
                    <textarea
                      id="camp-elig"
                      rows={2}
                      placeholder="e.g. Age 21-60, Minimum monthly income ₹25,000, CIBIL 750+..."
                      value={formData.eligibility}
                      onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="camp-status" className="text-xs font-semibold">
                      Campaign Status *
                    </Label>
                    <select
                      id="camp-status"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active (Published)</option>
                      <option value="draft">Draft (Unpublished)</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="camp-start" className="text-xs font-semibold">
                      Start Date
                    </Label>
                    <Input
                      id="camp-start"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="camp-end" className="text-xs font-semibold">
                      End Date
                    </Label>
                    <Input
                      id="camp-end"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* DYNAMIC FORM FIELDS CONFIGURATION (Module 4) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Custom Dynamic Lead Fields ({formData.dynamicFields.length})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Add campaign-specific inputs required from partners when submitting leads
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newField: DynamicFieldDef = {
                          id: `custom_${Date.now()}`,
                          label: "Monthly Income",
                          type: "number",
                          required: true,
                        };
                        setFormData({
                          ...formData,
                          dynamicFields: [...formData.dynamicFields, newField],
                        });
                      }}
                      className="h-7 text-xs px-2"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Field
                    </Button>
                  </div>

                  {formData.dynamicFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2 text-xs"
                    >
                      <Input
                        placeholder="Field Label (e.g. PAN Number)"
                        value={field.label}
                        onChange={(e) => {
                          const updated = [...formData.dynamicFields];
                          updated[idx].label = e.target.value;
                          setFormData({ ...formData, dynamicFields: updated });
                        }}
                        className="h-8 text-xs flex-1 bg-white"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const updated = [...formData.dynamicFields];
                          updated[idx].type = e.target.value as any;
                          setFormData({ ...formData, dynamicFields: updated });
                        }}
                        className="h-8 px-2 text-xs border border-slate-200 rounded-md bg-white text-slate-700"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="select">Dropdown</option>
                        <option value="textarea">Textarea</option>
                        <option value="date">Date</option>
                      </select>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => {
                            const updated = [...formData.dynamicFields];
                            updated[idx].required = e.target.checked;
                            setFormData({ ...formData, dynamicFields: updated });
                          }}
                          className="rounded border-slate-300 text-blue-600 h-3.5 w-3.5"
                        />
                        <span className="text-[11px] font-semibold text-slate-600">Req</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            dynamicFields: formData.dynamicFields.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setEditingCampaign(null);
                    }}
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
                    <span>{editingCampaign ? "Save Changes" : "Create Campaign"}</span>
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* ASSIGN CAMPAIGN MODAL (Module 2) */}
      {assigningCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-md shadow-2xl border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Assign Campaign Visibility
                </CardTitle>
                <CardDescription className="text-xs">
                  {assigningCampaign.campaignCode}: {assigningCampaign.title}
                </CardDescription>
              </div>
              <button
                onClick={() => setAssigningCampaign(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleAssign}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="assign-type" className="text-xs font-semibold">
                    Assignment Scope *
                  </Label>
                  <select
                    id="assign-type"
                    value={assignmentData.assignedType}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        assignedType: e.target.value as any,
                        targetId: "",
                      })
                    }
                    className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all_partners">All Approved Partners (Public)</option>
                    <option value="partner">Specific Independent Partner</option>
                    <option value="vendor">Selected Brand Vendor Organization</option>
                    <option value="team">Dedicated Promotional Squad / Team</option>
                    <option value="team_member">Selected Team Member</option>
                  </select>
                </div>

                {assignmentData.assignedType !== "all_partners" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="assign-target" className="text-xs font-semibold">
                      Select Target Entity *
                    </Label>
                    <select
                      id="assign-target"
                      required
                      value={assignmentData.targetId}
                      onChange={(e) =>
                        setAssignmentData({ ...assignmentData, targetId: e.target.value })
                      }
                      className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select target...</option>
                      {availableTargets
                        .filter((t) => t.type === assignmentData.assignedType)
                        .map((target) => (
                          <option key={target.id} value={target.id}>
                            {target.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
                  <span className="font-bold block">Access Validation (Module 2):</span>
                  <p className="text-blue-800 text-[11px]">
                    Only approved accounts with matching assignment links or public status can view this campaign in their dashboard catalog.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAssigningCampaign(null)}
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
                    <span>Assign Campaign</span>
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
