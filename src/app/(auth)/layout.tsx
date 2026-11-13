import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/70">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-950 via-blue-900 to-blue-600 text-white font-extrabold text-xl shadow-md group-hover:scale-105 transition-transform">
            LMB
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-slate-900 text-lg tracking-tight leading-tight">
              Lets Make Brand
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-600">
              Partner & Brand Platform
            </span>
          </div>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {children}
      </div>

      <div className="mt-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        <span>Secured with Supabase Auth & PostgreSQL Row-Level Security</span>
      </div>
    </div>
  );
}

