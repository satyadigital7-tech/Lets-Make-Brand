import React from "react";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  badge,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 break-words">
            {title}
          </h1>
          {badge && <Badge variant="brand">{badge}</Badge>}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">{children}</div>}
    </div>
  );
}

