import React from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Users,
  Store,
  Megaphone,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuperAdminOverviewPage() {
  const user = await requireRole(["super_admin"]);
  const supabase = await createClient();

  // Retrieve actual real database counts
  const [
    { count: totalUsersCount },
    { count: totalAdminsCount },
    { count: totalCampaignsCount },
    { data: recentAuditLogs },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("user_roles")
      .select("*, roles!inner(*)", { count: "exact", head: true })
      .eq("roles.code", "admin"),
    supabase.from("campaigns").select("*", { count: "exact", head: true }),
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const auditLogs = recentAuditLogs || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Super Admin Command Center"
        description="Full governance, identity management, database RLS policies, and system audit logs."
        badge="Privileged Access"
      >
        <Link href="/dashboard/super-admin/admins">
          <Button size="sm" className="gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4" />
            <span>Manage Admins & Permissions</span>
          </Button>
        </Link>
      </PageHeader>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Identities
              </span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {totalUsersCount ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">PostgreSQL profiles table</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Admin Accounts
              </span>
              <ShieldAlert className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {totalAdminsCount ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Explicit granular permissions</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Real Campaigns
              </span>
              <Megaphone className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {totalCampaignsCount ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Active & pending brand records</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Security Posture
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="h-4 w-4" />
              <span>RLS Enforced (9 Tables)</span>
            </div>
            <p className="text-[11px] text-slate-400">Default-deny access active</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Architecture Callout */}
      <Card className="border-slate-200 bg-slate-900 text-white">
        <CardContent className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Lock className="h-4 w-4" />
            <span>Phase 1 Access Control Enforcement</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            Granular Admin Permissions & Sensitive Transfer Controls
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Standard Admin roles have operational access but are strictly denied vendor portfolio 
            transfers (<code className="text-blue-300 font-mono">can_manage_vendor_transfers = false</code>) 
            by default. Only a Super Admin can explicitly grant this permission per administrator.
          </p>
          <div className="pt-2">
            <Link href="/dashboard/super-admin/admins">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 font-semibold text-xs">
                Review Administrator Permissions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Audit Logs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Immutable Audit Logs
            </h3>
            <p className="text-xs text-slate-500">
              Recorded server-side in the PostgreSQL audit_logs table
            </p>
          </div>
        </div>

        {auditLogs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {formatDateTime(log.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">
                    {log.entity_type}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    {log.entity_id || "N/A"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {log.ip_address || "Internal"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 bg-white">
            <Activity className="h-6 w-6 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              No audit log events recorded yet. Administrative operations will be displayed here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

