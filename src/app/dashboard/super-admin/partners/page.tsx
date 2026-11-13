import React from "react";
import { Users, Briefcase, Mail, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuperAdminPartnersPage() {
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
        phone,
        status,
        created_at
      ),
      roles!inner (
        code,
        name
      )
    `)
    .in("roles.code", ["independent_partner", "team_leader", "team_member"]);

  const partners = ((data as any[]) || []).map((item: any) => {
    const prof = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    const roleObj = Array.isArray(item.roles) ? item.roles[0] : item.roles;
    return {
      id: prof?.id || item.user_id,
      email: prof?.email || "partner@network.com",
      fullName: prof?.full_name || "Affiliate Partner",
      roleCode: roleObj?.code || "independent_partner",
      roleName: roleObj?.name || "Independent Partner",
      phone: prof?.phone || "N/A",
      status: prof?.status || "active",
      createdAt: prof?.created_at || new Date().toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Network Directory"
        description="All promotional partners across Independent Affiliates, Team Leaders, and Agency Squads."
        badge="PostgreSQL Records"
      />

      {partners.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Name</TableHead>
              <TableHead>Partner Tier / Role</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell className="font-bold text-xs text-slate-900">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    <span>{partner.fullName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="brand" className="text-[10px] py-0 px-1.5 font-semibold">
                    {partner.roleName}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-mono">
                  {partner.email}
                </TableCell>
                <TableCell className="text-xs text-slate-500 font-mono">
                  {partner.phone}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={partner.status === "active" ? "success" : "secondary"}
                    className="text-[10px] py-0 px-1.5"
                  >
                    {partner.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-slate-400 font-mono">
                  {formatDate(partner.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={<Users className="h-8 w-8 text-slate-400" />}
          title="No partners registered in database"
          description="When independent partners register through the public portal, their profile records will populate here."
          actionLabel="Register as Partner"
          actionHref="/register?role=independent_partner"
        />
      )}
    </div>
  );
}

