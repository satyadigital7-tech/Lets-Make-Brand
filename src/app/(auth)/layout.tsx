import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F6F8FC]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#092B63] text-white font-black text-xl shadow-sm group-hover:bg-[#123D82] transition-colors">
            LMB
          </div>
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-[#172033] text-lg tracking-tight leading-tight group-hover:text-[#092B63] transition-colors">
              Lets Make Brand
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#2563EB]">
              Partner & Brand Platform
            </span>
          </div>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {children}
      </div>

      <div className="mt-8 text-center text-xs text-[#64748B] flex items-center justify-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Secured with Supabase Auth & PostgreSQL Row-Level Security</span>
      </div>
    </div>
  );
}
