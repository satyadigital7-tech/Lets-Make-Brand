"use client";

import React, { useState, useTransition } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { toggleAdminPermissionAction, updateAdminStatusAction } from "./actions";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  status: "active" | "suspended" | "pending_verification" | "inactive";
  created_at: string;
  permissions: Record<string, boolean>; // code -> is_granted
}

interface PermissionDef {
  code: string;
  name: string;
  module: string;
  description: string;
  isSensitive?: boolean;
}

interface AdminManagerProps {
  admins: AdminUser[];
  availablePermissions: PermissionDef[];
}

export function AdminManager({ admins, availablePermissions }: AdminManagerProps) {
  const [selectedAdminId, setSelectedAdminId] = useState<string>(
    admins[0]?.id || ""
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedAdmin = admins.find((a) => a.id === selectedAdminId);

  const handleToggle = (permissionCode: string, currentVal: boolean) => {
    if (!selectedAdmin) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        await toggleAdminPermissionAction({
          adminUserId: selectedAdmin.id,
          permissionCode,
          isGranted: !currentVal,
        });
        setFeedback(`Permission "${permissionCode}" updated successfully.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update permission";
        setFeedback(`Error: ${msg}`);
      }
    });
  };

  const handleStatusChange = (status: "active" | "suspended" | "inactive") => {
    if (!selectedAdmin) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        await updateAdminStatusAction({
          adminUserId: selectedAdmin.id,
          status,
        });
        setFeedback(`Admin status updated to ${status}.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update status";
        setFeedback(`Error: ${msg}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-blue-500 hover:text-blue-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin List Column */}
        <div className="space-y-4">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold">Admin Directory</CardTitle>
              <CardDescription className="text-xs">
                Select an administrator to inspect and manage granular permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {admins.length > 0 ? (
                admins.map((adm) => {
                  const isSelected = adm.id === selectedAdminId;
                  const hasVendorTransfers = adm.permissions["can_manage_vendor_transfers"] === true;

                  return (
                    <button
                      key={adm.id}
                      onClick={() => setSelectedAdminId(adm.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/60 shadow-sm"
                          : "border-transparent hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">
                          {adm.full_name || "Admin User"}
                        </span>
                        <Badge
                          variant={adm.status === "active" ? "success" : "destructive"}
                          className="text-[9px] py-0 px-1.5"
                        >
                          {adm.status}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 truncate">{adm.email}</span>
                      <div className="flex items-center gap-2 pt-1 text-[10px]">
                        {hasVendorTransfers ? (
                          <span className="text-amber-600 font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Vendor Transfers: Granted
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">
                            Vendor Transfers: Denied (Default)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  No dedicated admin accounts created yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected Admin Permission Editor */}
        <div className="lg:col-span-2 space-y-4">
          {selectedAdmin ? (
            <Card className="border-slate-200">
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900">
                      Permission Matrix: {selectedAdmin.full_name || selectedAdmin.email}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Explicit grants override role defaults in PostgreSQL
                    </CardDescription>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold mr-1">Status:</span>
                    <Button
                      size="sm"
                      variant={selectedAdmin.status === "active" ? "default" : "outline"}
                      onClick={() => handleStatusChange("active")}
                      disabled={isPending}
                      className="text-xs h-7 px-2.5"
                    >
                      Active
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedAdmin.status === "suspended" ? "destructive" : "outline"}
                      onClick={() => handleStatusChange("suspended")}
                      disabled={isPending}
                      className="text-xs h-7 px-2.5"
                    >
                      Suspend
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* SENSITIVE PERMISSION CALLOUT */}
                <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span>CRITICAL PERMISSION: can_manage_vendor_transfers</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-white border-amber-300 text-amber-800">
                      Default: FALSE
                    </Badge>
                  </div>

                  <p className="text-xs text-amber-800/90 leading-relaxed">
                    By platform security mandate, administrators cannot transfer or reassign vendor portfolios 
                    unless explicitly authorized by a Super Admin.
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-800">
                      Current Grant:{" "}
                      {selectedAdmin.permissions["can_manage_vendor_transfers"] ? (
                        <span className="text-emerald-700">AUTHORIZED</span>
                      ) : (
                        <span className="text-rose-700">DENIED (ENFORCED)</span>
                      )}
                    </span>

                    <Button
                      size="sm"
                      variant={selectedAdmin.permissions["can_manage_vendor_transfers"] ? "destructive" : "default"}
                      onClick={() =>
                        handleToggle(
                          "can_manage_vendor_transfers",
                          selectedAdmin.permissions["can_manage_vendor_transfers"] || false
                        )
                      }
                      disabled={isPending}
                      className="text-xs font-semibold gap-1.5"
                    >
                      {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>
                        {selectedAdmin.permissions["can_manage_vendor_transfers"]
                          ? "Revoke Transfer Permission"
                          : "Explicitly Grant Permission"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Granular Permissions Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Standard Operational Permissions
                  </h4>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Permission Code</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availablePermissions
                        .filter((p) => p.code !== "can_manage_vendor_transfers")
                        .map((perm) => {
                          const isGranted = selectedAdmin.permissions[perm.code] ?? true;

                          return (
                            <TableRow key={perm.code}>
                              <TableCell className="font-mono text-xs font-bold text-slate-800">
                                {perm.code}
                              </TableCell>
                              <TableCell className="capitalize text-xs text-slate-500 font-medium">
                                {perm.module.replace("_", " ")}
                              </TableCell>
                              <TableCell className="text-xs text-slate-600">
                                {perm.description}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant={isGranted ? "outline" : "default"}
                                  onClick={() => handleToggle(perm.code, isGranted)}
                                  disabled={isPending}
                                  className="text-xs h-7 px-3"
                                >
                                  {isGranted ? "Revoke" : "Grant"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 bg-white">
              <ShieldAlert className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Select an administrator from the left panel to review permissions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

