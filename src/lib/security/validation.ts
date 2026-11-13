import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

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
    // CRITICAL: Self-registration is strictly restricted to non-privileged roles!
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
  message: z.string().min(10, "Message must be at 10 characters").max(2000).trim(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const campaignCreateSchema = z.object({
  title: z.string().min(5, "Campaign title must be at least 5 characters").max(150).trim(),
  category: z.string().min(2, "Please select or specify a category").trim(),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000).trim(),
  targetAudience: z.string().max(500).optional(),
  commissionRate: z.number().min(0.01, "Commission rate must be greater than 0"),
  commissionType: z.enum(["percentage", "fixed"]),
  budget: z.number().min(0, "Budget cannot be negative").default(0),
});

export type CampaignCreateFormData = z.infer<typeof campaignCreateSchema>;

export const adminPermissionUpdateSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  permissionId: z.string().uuid("Invalid permission ID"),
  isGranted: z.boolean(),
});

export const systemSettingUpdateSchema = z.object({
  key: z.string().min(1, "Setting key is required"),
  value: z.record(z.string(), z.unknown()),
});
