import React from "react";
import { Store, ShieldCheck, Mail, Building, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuperAdminVendorsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors Directory"
        description="Vetted brand merchants, campaign sponsors, and company profiles registered on LMB."
        badge="PostgreSQL Records"
      />

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
          title="No vendors registered in database"
          description="When brand merchants register on the public site or are provisioned by an administrator, they will appear here in real time."
          actionLabel="Register Test Vendor"
          actionHref="/register?role=vendor"
        />
      )}
    </div>
  );
}

