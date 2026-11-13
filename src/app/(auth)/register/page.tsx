"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  Building,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, RegisterFormData } from "@/lib/security/validation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "vendor" ? "vendor" : "independent_partner";

  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    phone: "",
    role: initialRole,
    termsAccepted: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    // Validate with Zod
    const result = registerSchema.safeParse(formData);
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
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName || null,
            phone: formData.phone || null,
            role: formData.role, // Strictly validated to 'independent_partner' or 'vendor'
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setServerError(error.message);
        setIsLoading(false);
        return;
      }

      // Check if session was created directly or email confirmation required
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-slate-200 shadow-md">
        <CardContent className="p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Account Created Successfully!
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            We have sent an email verification link to <strong>{formData.email}</strong>. 
            Please check your inbox (and spam folder) and click the link to confirm your account.
          </p>
          <div className="pt-2">
            <Link href="/login">
              <Button size="sm" variant="outline">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-md">
      <CardHeader className="space-y-1.5 pb-5">
        <CardTitle className="text-2xl font-bold tracking-tight text-center">
          Create LMB Account
        </CardTitle>
        <CardDescription className="text-center text-xs">
          Join the verified partner and brand promotion platform
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Registration Error</AlertTitle>
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label required>I am joining as a:</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "independent_partner" })}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  formData.role === "independent_partner"
                    ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <span>Partner</span>
                </div>
                <span className="text-[10px] text-slate-500">Promote brands & earn commissions</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: "vendor" })}
                className={`p-3 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  formData.role === "vendor"
                    ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600"
                    : "border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <Store className="h-4 w-4 text-blue-600" />
                  <span>Brand Vendor</span>
                </div>
                <span className="text-[10px] text-slate-500">Launch campaigns & gain leads</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Jane Doe"
              icon={<User className="h-4 w-4" />}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              error={errors.fullName}
            />
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="email">Business Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              icon={<Mail className="h-4 w-4" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company / Brand (Optional)</Label>
              <Input
                id="companyName"
                placeholder="Acme Corp"
                icon={<Building className="h-4 w-4" />}
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                error={errors.companyName}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 000-0000"
                icon={<Phone className="h-4 w-4" />}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required htmlFor="password">Password</Label>
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
              <Label required htmlFor="confirmPassword">Confirm Password</Label>
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
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={Boolean(formData.termsAccepted)}
                onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.termsAccepted}</p>
            )}
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full font-semibold shadow-sm">
            <span>Complete Registration</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>

        <div className="pt-4 text-center border-t border-slate-100 text-xs text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Sign In here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

