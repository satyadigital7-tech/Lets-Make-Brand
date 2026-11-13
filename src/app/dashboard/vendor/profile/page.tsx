import React from "react";
import { Building, Mail, Phone, ShieldCheck, Calendar } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VendorProfilePage() {
  const user = await requireRole(["vendor", "super_admin"]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand & Company Profile"
        description="Your verified vendor identity, legal business profile, and platform status."
        badge="PostgreSQL Profile Record"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="text-center pb-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto text-xl font-bold mb-2">
              <Building className="h-8 w-8" />
            </div>
            <CardTitle className="text-base font-bold text-slate-900">
              {user.profile.company_name || "Enterprise Brand"}
            </CardTitle>
            <CardDescription className="text-xs">
              Registered Merchant Account
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 border-t border-slate-100 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Account Status</span>
              <Badge variant="success" className="text-[10px]">
                {user.profile.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Primary Role</span>
              <span className="font-semibold text-slate-800">Brand Vendor</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Member Since</span>
              <span className="font-mono text-slate-700">
                {formatDate(user.profile.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-bold">Business Information</CardTitle>
            <CardDescription className="text-xs">
              Primary operational contacts registered in PostgreSQL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Contact Person
                </span>
                <p className="font-semibold text-slate-800">
                  {user.profile.full_name || "Not provided"}
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Business Email
                </span>
                <p className="font-semibold text-slate-800 font-mono">
                  {user.profile.email}
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Phone Number
                </span>
                <p className="font-semibold text-slate-800 font-mono">
                  {user.profile.phone || "Not provided"}
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Unique User UUID
                </span>
                <p className="font-mono text-[11px] text-slate-600 truncate">
                  {user.id}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Row Level Security Active:</strong> Only authenticated sessions 
                matching your user UUID can access or modify your campaigns and company records.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

