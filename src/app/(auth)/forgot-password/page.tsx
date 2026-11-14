"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, ForgotPasswordFormData } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({ email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const result = forgotPasswordSchema.safeParse(formData);
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
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setServerError(error.message);
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Password reset request failed.";
      setServerError(
        message.toLowerCase().includes("failed to fetch")
          ? "Could not reach authentication servers. Please verify your connection and try again."
          : message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-[#E2E8F0] shadow-sm bg-white rounded-xl">
      <CardHeader className="space-y-1.5 pb-5">
        <CardTitle className="text-2xl font-bold tracking-tight text-center text-[#172033]">
          Reset Your Password
        </CardTitle>
        <CardDescription className="text-center text-xs text-[#64748B]">
          Enter your registered email and we will send you a password reset link
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isSuccess ? (
          <div className="py-4 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[#172033]">
              Reset Link Dispatched
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-sm mx-auto">
              If an account exists for <strong>{formData.email}</strong>, a secure password reset link has been dispatched to your inbox.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Return to Sign In</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Reset Request Failed</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label required htmlFor="email">Registered Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                icon={<Mail className="h-4 w-4" />}
                value={formData.email}
                onChange={(e) => setFormData({ email: e.target.value })}
                error={errors.email}
                autoComplete="email"
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full font-semibold shadow-sm">
              <span>Send Reset Link</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#092B63] font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
