"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  ShieldCheck,
  Megaphone,
  Briefcase,
  Store,
  Layers,
  ArrowRight,
  Info,
  PhoneCall,
  Home,
} from "lucide-react";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "About Us", href: "/about", icon: Info },
    { name: "How It Works", href: "/how-it-works", icon: Layers },
    { name: "Campaigns", href: "/campaigns", icon: Megaphone },
    { name: "Become a Partner", href: "/become-partner", icon: Briefcase },
    { name: "Become a Vendor", href: "/become-vendor", icon: Store },
    { name: "Contact", href: "/contact", icon: PhoneCall },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md shadow-xs transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group select-none">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#092B63] text-white font-extrabold text-lg shadow-sm group-hover:bg-[#123D82] transition-colors">
            LMB
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[#172033] text-lg tracking-tight leading-tight group-hover:text-[#092B63] transition-colors">
              Lets Make Brand
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#2563EB]">
              Partner & Brand Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#EAF2FF] text-[#092B63] shadow-xs"
                    : "text-[#64748B] hover:text-[#172033] hover:bg-[#F6F8FC]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          <Link href="/login">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-semibold text-[#172033] border-[#E2E8F0] hover:bg-[#F6F8FC] hover:text-[#092B63]"
            >
              Log In
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="gap-1.5 text-xs font-semibold bg-[#092B63] hover:bg-[#123D82] text-white shadow-sm"
            >
              <span>Join LMB</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#172033] hover:bg-[#F6F8FC] focus:outline-none focus:ring-2 focus:ring-[#092B63]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-[#172033]" />
            ) : (
              <Menu className="h-6 w-6 text-[#172033]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E2E8F0] bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-[#EAF2FF] text-[#092B63]"
                      : "text-[#64748B] hover:text-[#172033] hover:bg-[#F6F8FC]"
                  }`}
                >
                  <Icon className="h-4 w-4 text-[#2563EB]" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold border-[#E2E8F0] text-[#172033]"
              >
                Log In
              </Button>
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full"
            >
              <Button
                size="sm"
                className="w-full gap-1.5 text-xs font-semibold bg-[#092B63] hover:bg-[#123D82] text-white"
              >
                <span>Join LMB</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
