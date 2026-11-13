import React from "react";
import { Settings, ShieldCheck, Sliders, Database } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SuperAdminSettingsPage() {
  await requireRole(["super_admin"]);
  const adminClient = createAdminClient();

  const { data } = await adminClient
    .from("system_settings")
    .select("*")
    .order("key", { ascending: true });

  const settingsList = ((data as any[]) || []).map((s: any) => s);

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Settings & Governance"
        description="Global platform parameters, runtime rules, security policies, and contact endpoints stored in PostgreSQL."
        badge="PostgreSQL Records"
      />

      <div className="grid grid-cols-1 gap-6">
        {settingsList.map((setting) => (
          <Card key={setting.key} className="border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-600" />
                    <CardTitle className="font-mono text-sm font-bold text-slate-900">
                      {setting.key}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {setting.description || "Core platform configuration parameter"}
                  </CardDescription>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Updated: {formatDateTime(setting.updated_at)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 bg-slate-50/50">
              <pre className="p-4 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto shadow-inner leading-relaxed">
                {JSON.stringify(setting.value, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

