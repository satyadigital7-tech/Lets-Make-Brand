"use client";

import React, { useState, useTransition } from "react";
import { Plus, X, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createAdminAction } from "./actions";

export function CreateAdminDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    mobile: "",
    canManageVendorTransfers: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const result = await createAdminAction({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          mobile: formData.mobile || undefined,
          permissions: [],
          canManageVendorTransfers: formData.canManageVendorTransfers,
        });

        if (result.success) {
          setSuccess(`Admin account created successfully for ${formData.email}!`);
          setFormData({
            fullName: "",
            email: "",
            password: "",
            mobile: "",
            canManageVendorTransfers: false,
          });
          setTimeout(() => {
            setIsOpen(false);
            setSuccess(null);
          }, 1500);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to create admin");
      }
    });
  };

  return (
    <div>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
      >
        <Plus className="h-4 w-4" />
        <span>Create Admin Account</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <Card className="w-full max-w-lg shadow-xl border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Provision Administrator Account
                </CardTitle>
                <CardDescription className="text-xs">
                  Create a new platform administrator with strict privilege boundaries
                </CardDescription>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="p-5 space-y-4">
                {error && (
                  <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                    {success}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="admin-name" className="text-xs font-semibold">
                    Full Legal Name *
                  </Label>
                  <Input
                    id="admin-name"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-email" className="text-xs font-semibold">
                    Admin Corporate Email *
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    required
                    placeholder="admin@letsmakebrand.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-password" className="text-xs font-semibold">
                      Initial Password *
                    </Label>
                    <Input
                      id="admin-password"
                      type="password"
                      required
                      placeholder="Min 8 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="admin-mobile" className="text-xs font-semibold">
                      Mobile Number (Optional)
                    </Label>
                    <Input
                      id="admin-mobile"
                      placeholder="e.g. 9876543210"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* SENSITIVE PERMISSION TOGGLE - DEFAULTS TO FALSE */}
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-amber-900 block">
                        Sensitive Permission: can_manage_vendor_transfers
                      </span>
                      <p className="text-amber-800/90 text-[11px] mt-0.5">
                        Mandated security rule: Must default to FALSE. Leave unchecked unless explicitly required.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canManageVendorTransfers}
                      onChange={(e) =>
                        setFormData({ ...formData, canManageVendorTransfers: e.target.checked })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Explicitly authorize this administrator to manage vendor transfers
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
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
                    <span>Provision Account</span>
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
