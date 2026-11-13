"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  ArrowRight,
  AlertCircle,
  Tag,
  Image,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { partnerRegisterSchema, PartnerRegisterFormData } from "@/lib/security/validation";
import { registerPartnerAction } from "../actions";

function PartnerRegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite") || "";
  const refCode = searchParams.get("ref") || "";

  const [formData, setFormData] = useState<PartnerRegisterFormData>({
    fullName: "",
    email: "",
    mobile: "",
    dob: "",
    gender: "Prefer not to say",
    address: "",
    city: "",
    state: "",
    pincode: "",
    profilePhotoUrl: "",
    referralCode: refCode,
    registrationType: inviteToken ? "team_member" : "independent",
    invitationToken: inviteToken,
    password: "",
    confirmPassword: "",
    termsAccepted: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<{ role: string; email: string } | null>(null);

  // If invitation token present, lookup invitation
  useEffect(() => {
    if (inviteToken) {
      async function checkInvite() {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from("invitations")
            .select("email, role, status")
            .eq("token", inviteToken)
            .single();

          if (data && data.status === "pending") {
            setInvitationInfo({ role: data.role, email: data.email });
            setFormData((prev) => ({ ...prev, email: data.email }));
          }
        } catch {
          // Token invalid or expired
        }
      }
      checkInvite();
    }
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const result = partnerRegisterSchema.safeParse(formData);
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
      const res = await registerPartnerAction(formData);

      if (!res.success) {
        setServerError(res.error || "Partner registration failed.");
        setIsLoading(false);
        return;
      }

      // Redirect to Pending Approval view
      router.push("/pending-approval");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Partner registration failed.";
      setServerError(message);
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-md max-w-2xl mx-auto">
      <CardHeader className="space-y-1.5 pb-4 text-center">
        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1">
          <Users className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Partner Network Registration
        </CardTitle>
        <CardDescription className="text-xs">
          Join as an Independent Partner or Vendor Squad Member to earn performance commissions
        </CardDescription>
        {invitationInfo && (
          <div className="pt-2">
            <Badge variant="brand" className="text-xs py-1 px-3">
              Invited as: {invitationInfo.role === "team_leader" ? "Team Leader" : "Team Member"}
            </Badge>
          </div>
        )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Alex Morgan"
                icon={<User className="h-4 w-4" />}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                error={errors.fullName}
              />
            </div>

            <div className="space-y-1.5">
              <Label required htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@promotions.com"
                icon={<Mail className="h-4 w-4" />}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                disabled={Boolean(invitationInfo)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label required htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                placeholder="+1 (555) 987-6543"
                icon={<Phone className="h-4 w-4" />}
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                error={errors.mobile}
              />
            </div>

            <div className="space-y-1.5">
              <Label required htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                error={errors.dob}
              />
            </div>

            <div className="space-y-1.5">
              <Label required htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value as PartnerRegisterFormData["gender"],
                  })
                }
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="address">Residential Address</Label>
            <Input
              id="address"
              placeholder="42 Partner Boulevard, Apt 12B"
              icon={<MapPin className="h-4 w-4" />}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              error={errors.address}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label required htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Austin"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                error={errors.city}
              />
            </div>

            <div className="space-y-1.5">
              <Label required htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="TX"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                error={errors.state}
              />
            </div>

            <div className="space-y-1.5">
              <Label required htmlFor="pincode">PIN / Postal Code</Label>
              <Input
                id="pincode"
                placeholder="78701"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                error={errors.pincode}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <Input
                id="referralCode"
                placeholder="REF-XXXXXX"
                icon={<Tag className="h-4 w-4" />}
                value={formData.referralCode || ""}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                error={errors.referralCode}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profilePhotoUrl">Profile Photo URL (Optional)</Label>
              <Input
                id="profilePhotoUrl"
                placeholder="https://images.com/avatar.jpg"
                icon={<Image className="h-4 w-4" />}
                value={formData.profilePhotoUrl || ""}
                onChange={(e) => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
                error={errors.profilePhotoUrl}
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
                  Partner Terms of Service
                </Link>{" "}
                and acknowledge account requires Super Admin verification before activation.
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.termsAccepted}</p>
            )}
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full font-semibold shadow-sm">
            <span>Submit Partner Application</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>

        <div className="pt-3 text-center border-t border-slate-100 text-xs text-slate-500">
          Looking to list brand campaigns instead?{" "}
          <Link href="/register/vendor" className="text-blue-600 font-semibold hover:underline">
            Register as Vendor
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PartnerRegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading form...</div>}>
      <PartnerRegisterForm />
    </Suspense>
  );
}
