import React from "react";
import { Clock, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ModulePlaceholderProps {
  moduleName: string;
  phase: string;
  description: string;
  features: string[];
  backHref: string;
}

export function ModulePlaceholder({
  moduleName,
  phase,
  description,
  features,
  backHref,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-600">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-8 sm:p-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {moduleName}
                </h1>
                <Badge variant="brand" className="font-semibold text-xs">
                  {phase} Specification
                </Badge>
              </div>
              <p className="text-xs text-slate-500 max-w-xl">{description}</p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <Clock className="h-4 w-4" />
              <span>Foundation Established (Phase 1)</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Approved Roadmap Architecture:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 text-xs text-slate-700 flex items-start gap-2.5"
                >
                  <span className="font-bold text-blue-600">{idx + 1}.</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-slate-600 flex items-start gap-3">
            <ShieldAlert className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Phase 1 Integrity Policy:</strong> As per strict project requirements, 
              simulated dummy records and mock statistics are not displayed. 
              The database schema, RLS policies, and access control tokens for this module are configured in PostgreSQL.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

