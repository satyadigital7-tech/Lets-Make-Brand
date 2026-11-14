import Link from "next/link";
import { ShieldCheck, Mail, Phone, MapPin, ArrowRight } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-[#092B63] text-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#092B63] font-black text-lg shadow-sm">
                LMB
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-lg tracking-tight leading-tight">
                  Lets Make Brand
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-300">
                  Enterprise Promotion Platform
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-sm leading-relaxed">
              Enterprise Partner & Brand Promotion Platform connecting verified merchant brands with high-performance partner networks for transparent, high-ROI conversions.
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-200 bg-white/5 p-3 rounded-lg border border-white/10 max-w-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Multi-Tenant PostgreSQL Row-Level Security & RBAC Governance</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/campaigns" className="hover:text-white transition-colors">
                  Campaign Directory
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/become-partner" className="hover:text-white transition-colors">
                  Become a Partner
                </Link>
              </li>
              <li>
                <Link href="/become-vendor" className="hover:text-white transition-colors">
                  Become a Vendor
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Company
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Support & Admin
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-300 shrink-0" />
                <a href="mailto:contact@letsmakebrand.com" className="hover:text-white">
                  contact@letsmakebrand.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-300 shrink-0" />
                <span>+1 (800) 562-2726</span>
              </li>
              <li className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-300 hover:text-white hover:underline"
                >
                  <span>Super Admin Portal</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} Lets Make Brand (LMB). All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <span>&bull;</span>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <span>&bull;</span>
            <Link href="/login" className="hover:text-white">Staff Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
