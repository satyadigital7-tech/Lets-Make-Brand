"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { contactSchema, ContactFormData } from "@/lib/security/validation";

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    inquiryType: "partner",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    // Validate with Zod
    const result = contactSchema.safeParse(formData);
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

    setIsSubmitting(true);
    try {
      // Simulate contact dispatch
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSuccess(true);
    } catch {
      setServerError("An unexpected error occurred. Please reach out to contact@letsmakebrand.co.in directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-16 md:py-24 bg-[#F6F8FC]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge variant="brand">Enterprise Assistance</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
            Contact the LMB Operations Team
          </h1>
          <p className="text-sm text-[#64748B]">
            Have questions regarding vendor onboarding, partner squad contracts, or technical integration? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Card */}
          <div className="space-y-6">
            <Card className="border-[#E2E8F0] bg-white rounded-xl shadow-sm">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-bold text-[#172033] border-b border-[#E2E8F0] pb-3">
                  Direct Channels
                </h3>

                <div className="space-y-4 text-xs text-[#172033]">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#EAF2FF] text-[#092B63]">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-[#172033]">General Inquiries</span>
                      <a href="mailto:contact@letsmakebrand.co.in" className="text-[#092B63] font-medium hover:underline">
                        contact@letsmakebrand.co.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 text-[#16A34A]">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-[#172033]">Corporate Desk</span>
                      <span className="text-[#64748B]">+91 (800) 562-2726</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#EAF2FF] text-[#2563EB]">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-semibold block text-[#172033]">Corporate Headquarters</span>
                      <span className="text-[#64748B]">
                        LMB Tower, Financial District, Cyber City, Hyderabad 500081
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] text-xs text-[#64748B]">
                  <strong>Operating Hours:</strong> Monday – Friday, 9:00 AM – 6:00 PM IST.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-[#E2E8F0] bg-white rounded-xl shadow-sm">
              <CardContent className="p-6 sm:p-8">
                {isSuccess ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold text-[#172033]">
                      Inquiry Received Successfully
                    </h3>
                    <p className="text-xs text-[#64748B] max-w-md mx-auto">
                      Thank you for contacting Lets Make Brand. A representative will review your message and reply to {formData.email} within 1 business day.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsSuccess(false);
                        setFormData({
                          name: "",
                          email: "",
                          phone: "",
                          inquiryType: "partner",
                          subject: "",
                          message: "",
                        });
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {serverError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Submission Error</AlertTitle>
                        <AlertDescription>{serverError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label required htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          placeholder="Jane Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          error={errors.name}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label required htmlFor="email">Business Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="jane@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          error={errors.email}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="phone">Phone (Optional)</Label>
                        <Input
                          id="phone"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          error={errors.phone}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="inquiryType">Inquiry Type</Label>
                        <select
                          id="inquiryType"
                          value={formData.inquiryType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              inquiryType: e.target.value as ContactFormData["inquiryType"],
                            })
                          }
                          className="flex h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#092B63]"
                        >
                          <option value="partner">Partner Network Application</option>
                          <option value="vendor">Brand Vendor Onboarding</option>
                          <option value="enterprise">Enterprise Custom Deployment</option>
                          <option value="support">Technical & Ledger Support</option>
                          <option value="general">General Inquiries</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label required htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Brief summary of your inquiry"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        error={errors.subject}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label required htmlFor="message">Message</Label>
                      <textarea
                        id="message"
                        rows={4}
                        placeholder="Provide details about your brand, partner squad, or request..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="flex w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#172033] placeholder:text-[#64748B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#092B63] focus-visible:border-transparent transition-colors"
                      />
                      {errors.message && (
                        <p className="text-xs text-[#DC2626] font-medium">{errors.message}</p>
                      )}
                    </div>

                    <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto font-semibold">
                      <Send className="h-4 w-4 mr-2" />
                      <span>Submit Inquiry</span>
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
