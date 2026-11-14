import React from "react";
import { Store, Building, AlertTriangle, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { canManageVendorTransfers } from "@/lib/auth/permissions";
import { getAdminOrSessionClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminVendorsPage() {
  const user = await requireRole(["admin", "super_admin"]);
  const adminClient = await getAdminOrSessionClient();

  const { data } = await adminClient
    .from("user_roles")
    .select(`
      user_id,
      profiles:user_id (
        id,
        email,
        full_name,
        company_name,
        phone,
        status,
        created_at
      ),
      roles!inner (
        code
      )
    `)
    .eq("roles.code", "vendor");

  const vendors = ((data as any[]) || []).map((item: any) => {
    const prof = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    return {
      id: prof?.id || item.user_id,
      email: prof?.email || "vendor@company.com",
      fullName: prof?.full_name || "Merchant Owner",
      companyName: prof?.company_name || "Enterprise Brand",
      phone: prof?.phone || "N/A",
      status: prof?.status || "active",
      createdAt: prof?.created_at || new Date().toISOString(),
    };
  });

  const canTransfer = canManageVendorTransfers(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Vendors Directory"
        description="Review merchant onboarding, company information, and brand verification statuses."
        badge="PostgreSQL Records"
      />

      {/* Sensitive Permission Status Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
        canTransfer
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-amber-200 bg-amber-50 text-amber-900"
      }`}>
        <div className="flex items-center gap-2">
          {canTransfer ? (
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          )}
          <span>
            <strong>Vendor Portfolio Transfers:</strong>{" "}
            {canTransfer
              ? "You have explicit Super Admin authorization to manage and transfer vendor portfolios."
              : "Standard Admin permissions deny portfolio transfers (can_manage_vendor_transfers = false). Contact Super Admin for authorization."}
          </span>
        </div>
      </div>

      {vendors.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company & Brand</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-bold text-xs text-slate-900">
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-blue-600" />
                    <span>{vendor.companyName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-slate-700">
                  {vendor.fullName}
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-mono">
                  {vendor.email}
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-mono">
                  {vendor.phone}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={vendor.status === "active" ? "success" : "secondary"}
                    className="text-[10px] py-0 px-1.5"
                  >
                    {vendor.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-400 font-mono">
                  {formatDate(vendor.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={<Store className="h-8 w-8 text-slate-400" />}
          title="No vendors found"
          description="Registered brand merchants will appear here automatically."
          actionLabel="Register as Vendor"
          actionHref="/register?role=vendor"
        />
      )}
    </div>
  );
}

