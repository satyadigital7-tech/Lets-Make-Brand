import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Phase 1 general register schema (backward compatibility)
export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100).trim(),
    email: z.string().email("Please enter a valid business email").trim().toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    companyName: z.string().max(100).optional(),
    phone: z.string().max(30).optional(),
    role: z.enum(["independent_partner", "vendor"]),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms of Service & Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// MODULE 1: VENDOR REGISTRATION SCHEMA
export const vendorRegisterSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100).trim(),
    businessName: z.string().min(2, "Business name must be at least 2 characters").max(150).trim(),
    email: z.string().email("Please enter a valid business email").trim().toLowerCase(),
    mobile: z.string().min(10, "Please enter a valid mobile number with at least 10 digits").max(20).trim(),
    address: z.string().min(5, "Business address must be at least 5 characters").max(300).trim(),
    city: z.string().min(2, "City must be at least 2 characters").max(100).trim(),
    state: z.string().min(2, "State must be at least 2 characters").max(100).trim(),
    pincode: z.string().min(3, "Please enter a valid postal / PIN code").max(20).trim(),
    profilePhotoUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the Vendor Terms & Compliance Agreement",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type VendorRegisterFormData = z.infer<typeof vendorRegisterSchema>;

// MODULE 2: PARTNER REGISTRATION SCHEMA
export const partnerRegisterSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100).trim(),
    email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
    mobile: z.string().min(10, "Please enter a valid mobile number with at least 10 digits").max(20).trim(),
    dob: z.string().min(10, "Please enter a valid date of birth (YYYY-MM-DD)"),
    gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]),
    address: z.string().min(5, "Residential address must be at least 5 characters").max(300).trim(),
    city: z.string().min(2, "City must be at least 2 characters").max(100).trim(),
    state: z.string().min(2, "State must be at least 2 characters").max(100).trim(),
    pincode: z.string().min(3, "Please enter a valid postal / PIN code").max(20).trim(),
    profilePhotoUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
    referralCode: z.string().max(50).optional().or(z.literal("")),
    registrationType: z.enum(["independent", "team_member"]).optional().default("independent"),
    invitationToken: z.string().optional().or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the Partner Terms & Conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PartnerRegisterFormData = z.infer<typeof partnerRegisterSchema>;

// MODULE 3: CREATE ADMIN SCHEMA
export const createAdminSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100).trim(),
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  mobile: z.string().max(20).optional(),
  permissions: z.array(z.string()).optional().default([]),
  canManageVendorTransfers: z.boolean().optional().default(false), // CRITICAL: defaults to false!
});

export type CreateAdminFormData = z.infer<typeof createAdminSchema>;

// MODULE 6: CREATE / EDIT TEAM SCHEMA
export const teamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(150).trim(),
  description: z.string().max(500).optional().or(z.literal("")),
  leaderId: z.string().uuid("Invalid Leader ID").optional().or(z.literal("")),
});

export type TeamFormData = z.infer<typeof teamSchema>;

// MODULE 8: INVITATION SCHEMA
export const invitationSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  role: z.enum(["team_leader", "team_member"]),
  teamId: z.string().uuid("Invalid team ID").optional().or(z.literal("")),
});

export type InvitationFormData = z.infer<typeof invitationSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).trim(),
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  phone: z.string().max(30).optional(),
  inquiryType: z.enum(["partner", "vendor", "enterprise", "support", "general"]),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(150).trim(),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000).trim(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const campaignCreateSchema = z.object({
  title: z.string().min(5, "Campaign title must be at least 5 characters").max(150).trim(),
  brandName: z.string().min(2, "Brand / Client name must be at least 2 characters").max(150).trim().optional(),
  category: z.string().min(2, "Please select or specify a category").trim(),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000).trim(),
  instructions: z.string().max(3000).optional().or(z.literal("")),
  eligibility: z.string().max(1000).optional().or(z.literal("")),
  bannerImageUrl: z.string().url("Please enter a valid image URL").optional().or(z.literal("")),
  targetAudience: z.string().max(500).optional().or(z.literal("")),
  commissionRate: z.number().min(0, "Commission rate cannot be negative").default(0),
  commissionAmount: z.number().min(0, "Commission amount cannot be negative").default(0),
  maxPayout: z.number().min(0).optional().nullable(),
  commissionType: z.enum(["percentage", "fixed"]).default("fixed"),
  budget: z.number().min(0, "Budget cannot be negative").default(0),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "pending_approval", "active", "paused", "completed", "archived"]).default("active"),
  requiredDocuments: z.array(z.string()).optional().default([]),
  dynamicFields: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(["text", "number", "select", "file", "textarea", "date", "boolean"]),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
      placeholder: z.string().optional(),
    })
  ).optional().default([]),
});

export type CampaignCreateFormData = z.infer<typeof campaignCreateSchema>;

// MODULE 2: CAMPAIGN ASSIGNMENT SCHEMA
export const campaignAssignmentSchema = z.object({
  campaignId: z.string().uuid("Invalid Campaign ID"),
  assignedType: z.enum(["all_partners", "partner", "vendor", "team", "team_member"]),
  targetId: z.string().uuid("Invalid Target ID").optional().or(z.literal("")),
});

export type CampaignAssignmentFormData = z.infer<typeof campaignAssignmentSchema>;

// MODULE 4: DYNAMIC LEAD SUBMISSION SCHEMA
export const leadSubmissionSchema = z.object({
  campaignId: z.string().uuid("Invalid Campaign ID"),
  customerName: z.string().min(2, "Customer name must be at least 2 characters").max(100).trim(),
  customerMobile: z.string().min(10, "Customer mobile number must be at least 10 digits").max(20).trim(),
  customerEmail: z.string().email("Please provide a valid customer email address").trim().toLowerCase(),
  customerLocation: z.string().max(150).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  additionalFields: z.record(z.string(), z.unknown()).optional().default({}),
  documents: z.array(
    z.object({
      name: z.string(),
      type: z.string().optional(),
      url: z.string().url("Valid document file URL is required"),
      size: z.number().optional(),
    })
  ).optional().default([]),
  consentConfirmed: z.boolean().refine((val) => val === true, {
    message: "Customer authorization and promotional consent confirmation is mandatory",
  }),
});

export type LeadSubmissionFormData = z.infer<typeof leadSubmissionSchema>;

// MODULE 6: LEAD REVIEW SCHEMA
export const leadReviewSchema = z.object({
  leadId: z.string().uuid("Invalid Lead ID"),
  action: z.enum(["approve", "reject", "request_correction", "mark_under_verification"]),
  reason: z.string().optional(),
});

export type LeadReviewFormData = z.infer<typeof leadReviewSchema>;

export const adminPermissionUpdateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  permissionId: z.string().uuid("Invalid permission ID"),
  isGranted: z.boolean(),
});

export const systemSettingUpdateSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.record(z.string(), z.unknown()),
});

// ==============================================================================
// PHASE 4: COMMISSION MANAGEMENT SCHEMAS
// ==============================================================================

// MODULE 1: SUPER ADMIN COMMISSION RULE SCHEMA
export const commissionRuleSchema = z
  .object({
    campaignId: z.string().uuid("Invalid Campaign ID"),
    maxCommissionAmount: z.number().min(0, "Maximum commission cap must be non-negative"),
    partnerDefaultCommission: z.number().min(0, "Partner default commission must be non-negative"),
    vendorMaxCommission: z.number().min(0, "Vendor maximum commission must be non-negative").default(0),
    independentPartnerCommission: z.number().min(0, "Independent partner commission must be non-negative"),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.independentPartnerCommission <= data.maxCommissionAmount,
    {
      message: "Independent partner commission cannot exceed the maximum campaign limit",
      path: ["independentPartnerCommission"],
    }
  )
  .refine(
    (data) => data.partnerDefaultCommission <= data.maxCommissionAmount,
    {
      message: "Partner default commission cannot exceed the maximum campaign limit",
      path: ["partnerDefaultCommission"],
    }
  );

export type CommissionRuleFormData = z.infer<typeof commissionRuleSchema>;

// MODULE 2: VENDOR COMMISSION SPLIT SCHEMA
export const vendorSplitSchema = z.object({
  campaignId: z.string().uuid("Invalid Campaign ID"),
  vendorShare: z.number().min(0, "Vendor share must be non-negative"),
  partnerShare: z.number().min(0, "Partner share must be non-negative"),
  notes: z.string().max(500).optional(),
});

export type VendorSplitFormData = z.infer<typeof vendorSplitSchema>;

// MODULE 8: COMMISSION REVERSAL SCHEMA
export const commissionReversalSchema = z.object({
  transactionId: z.string().uuid("Invalid Transaction ID"),
  reason: z.string().min(5, "Reversal justification must be at least 5 characters").max(500).trim(),
});

export type CommissionReversalFormData = z.infer<typeof commissionReversalSchema>;

// ==============================================================================
// PHASE 5: WALLET AND PAYMENT MANAGEMENT SCHEMAS
// ==============================================================================

// MODULE 4: PAYOUT METHOD SCHEMA
export const payoutMethodSchema = z.object({
  type: z.enum(["upi", "bank_transfer"]),
  accountHolderName: z.string().min(2, "Account holder name must be at least 2 characters").max(100).trim(),
  upiId: z.string().max(100).trim().optional().or(z.literal("")),
  accountNumber: z.string().max(50).trim().optional().or(z.literal("")),
  ifscCode: z.string().max(20).trim().optional().or(z.literal("")),
  bankName: z.string().max(100).trim().optional().or(z.literal("")),
  branchName: z.string().max(100).trim().optional().or(z.literal("")),
  isDefault: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.type === "upi") {
      return !!data.upiId && data.upiId.includes("@");
    }
    if (data.type === "bank_transfer") {
      return !!data.accountNumber && data.accountNumber.length >= 6 && !!data.ifscCode;
    }
    return true;
  },
  {
    message: "Valid payout credentials are required for the chosen payment method",
    path: ["upiId"],
  }
);

export type PayoutMethodFormData = z.infer<typeof payoutMethodSchema>;

// MODULE 4: WITHDRAWAL REQUEST SCHEMA
export const withdrawalRequestSchema = z.object({
  amount: z.number().min(100, "Minimum withdrawal amount is ₹100"),
  paymentMethod: z.enum(["upi", "bank_transfer", "neft", "imps"]),
  payoutDetails: z.object({
    accountHolderName: z.string().min(2, "Account holder name is required").trim(),
    upiId: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    bankName: z.string().optional(),
  }),
  confirmation: z.boolean().refine((val) => val === true, {
    message: "Confirmation of payout details and terms is mandatory",
  }),
});

export type WithdrawalRequestFormData = z.infer<typeof withdrawalRequestSchema>;

// MODULE 5: WITHDRAWAL REVIEW SCHEMA
export const withdrawalReviewSchema = z.object({
  withdrawalId: z.string().uuid("Invalid Withdrawal ID"),
  action: z.enum(["approve", "mark_processing", "reject"]),
  reason: z.string().max(500).optional(),
});

export type WithdrawalReviewFormData = z.infer<typeof withdrawalReviewSchema>;

// MODULE 7: MANUAL PAYMENT SCHEMA
export const manualPaymentSchema = z.object({
  withdrawalId: z.string().uuid("Invalid Withdrawal ID"),
  paymentReference: z.string().min(3, "Payment Reference / UTR Number is required").max(100).trim(),
  paymentMethod: z.string().min(2, "Payment method is required").max(50).trim(),
  paymentDate: z.string().optional(),
  adminRemarks: z.string().max(500).optional(),
  proofUrl: z.string().url("Valid proof URL is required").optional().or(z.literal("")),
});

export type ManualPaymentFormData = z.infer<typeof manualPaymentSchema>;


