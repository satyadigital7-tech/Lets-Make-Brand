"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema, ResetPasswordFormData } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const result = resetPasswordSchema.safeParse(formData);
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
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        setServerError(error.message);
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Password update failed.";
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
          Set New Password
        </CardTitle>
        <CardDescription className="text-center text-xs text-[#64748B]">
          Choose a secure password containing uppercase and numbers
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isSuccess ? (
          <div className="py-4 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-[#172033]">
              Password Updated Successfully
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-sm mx-auto">
              Your new password has been stored securely. You can now access your account with the new credentials.
            </p>
            <div className="pt-2">
              <Link href="/login">
                <Button size="sm" className="font-semibold shadow-sm">
                  Sign In to Your Dashboard
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Update Failed</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label required htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
              />
            </div>

            <div className="space-y-1.5">
              <Label required htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="h-4 w-4" />}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
              />
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full font-semibold shadow-sm">
              <span>Save New Password</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
