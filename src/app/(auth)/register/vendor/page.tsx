"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  ArrowRight,
  AlertCircle,
  Building,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { vendorRegisterSchema, VendorRegisterFormData } from "@/lib/security/validation";
import { registerVendorAction } from "../actions";

export default function VendorRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<VendorRegisterFormData>({
    fullName: "",
    businessName: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    profilePhotoUrl: "",
    password: "",
    confirmPassword: "",
    termsAccepted: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const result = vendorRegisterSchema.safeParse(formData);
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
      const res = await registerVendorAction(formData);

      if (!res.success) {
        setServerError(res.error || "Vendor registration failed.");
        setIsLoading(false);
        return;
      }

      // Redirect to Pending Approval view
      router.push("/pending-approval");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Vendor registration failed.";
      setServerError(message);
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-md max-w-2xl mx-auto">
      <CardHeader className="space-y-1.5 pb-4 text-center">
        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-1">
          <Store className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Brand Vendor Registration
        </CardTitle>
        <CardDescription className="text-xs">
          Register your brand to publish performance campaigns and recruit verified partner squads
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <Label required htmlFor="businessName">Business / Brand Name</Label>
              <Input
                id="businessName"
                placeholder="Apex Technologies Inc."
                icon={<Building className="h-4 w-4" />}
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                error={errors.businessName}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label required htmlFor="email">Business Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jane@company.com"
                icon={<Mail className="h-4 w-4" />}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
              />
            </div>

            <div className="space-y-1.5">
              <Label required htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                placeholder="+1 (555) 012-3456"
                icon={<Phone className="h-4 w-4" />}
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                error={errors.mobile}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label required htmlFor="address">Business Address</Label>
            <Input
              id="address"
              placeholder="100 Enterprise Way, Suite 400"
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
                placeholder="New York"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                error={errors.city}
              />
            </div>

            <div className="space-y-1.5">
              <Label required htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="NY"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                error={errors.state}
              />
            </div>

            <div className="space-y-1.5">
              <Label required htmlFor="pincode">PIN / Postal Code</Label>
              <Input
                id="pincode"
                placeholder="10001"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                error={errors.pincode}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profilePhotoUrl">Profile / Brand Logo Photo URL (Optional)</Label>
            <Input
              id="profilePhotoUrl"
              placeholder="https://company.com/logo.png"
              icon={<Image className="h-4 w-4" />}
              value={formData.profilePhotoUrl}
              onChange={(e) => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
              error={errors.profilePhotoUrl}
            />
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
                  Vendor Compliance Agreement
                </Link>{" "}
                and acknowledge account requires Super Admin approval before activation.
              </span>
            </label>
            {errors.termsAccepted && (
              <p className="mt-1 text-xs text-rose-600 font-medium">{errors.termsAccepted}</p>
            )}
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full font-semibold shadow-sm">
            <span>Submit Vendor Application</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>

        <div className="pt-3 text-center border-t border-slate-100 text-xs text-slate-500">
          Want to promote brands instead?{" "}
          <Link href="/register/partner" className="text-blue-600 font-semibold hover:underline">
            Register as Partner
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

