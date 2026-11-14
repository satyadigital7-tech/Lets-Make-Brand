"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { loginSchema, LoginFormData } from "@/lib/security/validation";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const errorParam = searchParams.get("error");
  const verifiedParam = searchParams.get("verified");

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(
    errorParam === "auth_callback_failed"
      ? "Authentication session exchange failed. Please sign in directly."
      : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Primary: Direct standard REST API endpoint (never affected by Next.js static prerendering or Server Action ID mismatches)
      let res: { success: boolean; error?: string; userId?: string } | null = null;
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          res = await response.json();
        } else {
          try {
            const errData = await response.json();
            res = { success: false, error: errData.error || `Server responded with status ${response.status}` };
          } catch {
            res = { success: false, error: `Server error (${response.status}). Please try again.` };
          }
        }
      } catch {
        // Fallback to Server Action if API route is unreachable
        try {
          res = await loginAction(formData);
        } catch {
          res = {
            success: false,
            error: "Unable to reach authentication server. Please check your internet connection or try again in a moment.",
          };
        }
      }

      if (!res || !res.success) {
        setServerError(res?.error || "Authentication failed.");
        setIsLoading(false);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected authentication error occurred.";
      const friendlyMessage =
        message.toLowerCase().includes("failed to fetch") || message.toLowerCase().includes("fetch failed")
          ? "Could not reach authentication servers. Please check your internet connection and try again."
          : message;
      setServerError(friendlyMessage);
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-[#E2E8F0] shadow-sm bg-white rounded-xl">
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight text-center text-[#172033]">
          Sign In to LMB
        </CardTitle>
        <CardDescription className="text-center text-xs text-[#64748B]">
          Enter your registered enterprise credentials to access your dashboard
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {verifiedParam && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Email Verified</AlertTitle>
            <AlertDescription>Your email has been confirmed. You may now log in.</AlertDescription>
          </Alert>
        )}

        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Authentication Failed</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label required htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              icon={<Mail className="h-4 w-4" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label required htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#092B63] hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full font-semibold shadow-sm">
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>

        <div className="pt-4 text-center border-t border-[#E2E8F0] text-xs text-[#64748B]">
          Do not have an account?{" "}
          <Link href="/register" className="text-[#092B63] font-semibold hover:underline">
            Register / Join LMB
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#64748B]">Loading form...</div>}>
      <LoginForm />
    </Suspense>
  );
}
