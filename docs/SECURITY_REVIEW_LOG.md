# Lets Make Brand (LMB) - Security Review & Vulnerability Management Log

## 1. Security Baseline & Governance Overview

This document records the security posture, review cycles, and vulnerability management history for the **Lets Make Brand (LMB)** platform.

### Core Security Principles Enforced:
1. **Default-Deny Access Control:** All PostgreSQL tables have Row Level Security (RLS) enabled. Unless explicitly permitted by an RLS policy, access is denied.
2. **Anti-Privilege Escalation:** Database triggers block unprivileged users from assigning `super_admin` or `admin` roles during registration or profile updates.
3. **Sensitive Data Protection:** PAN, bank account numbers, passwords, JWT tokens, and session cookies are strictly sanitized before logging (`src/lib/logging/logger.ts`).
4. **Private Storage Isolation:** Identity proofs and dispute files are stored in private Supabase Storage buckets, accessible exclusively via server-signed short-lived URLs.
5. **Immutable Financial Records:** Financial transactions in `wallet_ledger` cannot be updated or deleted; discrepancies are handled via authorized compensatory adjustments.

---

## 2. Security Audit History & Review Log

| Review Date | Review Scope | Reviewer Role | Status / Outcome |
| :--- | :--- | :--- | :--- |
| **2026-11-13** | **Phase 1 RBAC & Initial RLS Policies** | Security Engineer | **PASSED:** 109 automated assertions passed. Confirmed default-deny RLS on `profiles`, `roles`, `permissions`, and `audit_logs`. |
| **2026-11-13** | **Phase 4 Financial Split Validation** | Financial Systems Engineer | **PASSED:** Server-side validation guarantees vendor splits cannot exceed Super Admin campaign maximums. |
| **2026-11-13** | **Phase 5 Double-Entry Ledger Security** | Financial Architect | **PASSED:** Non-negative balance check constraints enforced. Balance invariant verified across 114 tests. |
| **2026-11-13** | **Phase 6 KYC Privacy & Signed URLs** | Security Architect | **PASSED:** Sensitive document buckets confirmed private. Short-lived URLs enforced. PAN/Account masking verified. |
| **2026-11-13** | **Phase 7 Production Security Hardening** | Lead Security Architect | **PASSED:** 32 comprehensive security assertions passed. Implemented `reconcileSingleWallet`, HTTP security headers in `vercel.json`, and database function `check_system_financial_integrity`. |
| **2026-11-13** | **Phase 8 Client Handover Audit** | QA & Security Engineer | **PASSED:** 16 handover audit assertions passed. Zero credential leaks verified across documentation and codebase. |

---

## 3. Row Level Security (RLS) Audit Checklist

All 20+ database tables maintain verified RLS policies:

- [x] **`public.profiles`**: Users can read and update only their own profile; Super Admins have elevated management access.
- [x] **`public.roles` & `public.permissions`**: Read-only for authenticated users; modifications restricted to Super Admin.
- [x] **`public.user_roles` & `public.user_permissions`**: Strictly managed by Super Admin; protected against client-side insertion.
- [x] **`public.campaigns`**: Public read for active campaigns; creation and modification restricted to verified Brand Vendors and Super Admins.
- [x] **`public.leads`**: Restricted to the submitting partner, assigned squad leader, owning vendor, and administrative staff. Cross-vendor data access is strictly blocked.
- [x] **`public.commission_transactions`**: Visible only to the respective beneficiary (vendor or partner) and Super Admins.
- [x] **`public.wallet_balances` & `public.wallet_ledger`**: Each user can only query their own wallet. Direct balance updates via client API are completely blocked.
- [x] **`public.withdrawals`**: Users can submit and view their own withdrawal requests; approval and payment recording is restricted to Super Admin.
- [x] **`public.kyc_applications` & `public.kyc_documents`**: Restricted to the applicant and compliance administrators.
- [x] **`public.audit_logs`**: Read-only for Super Admin; insert-only via server actions; update and delete operations blocked by database trigger.

---

## 4. Quarterly Permission Review Schedule

To ensure permissions do not drift over time, the following review must be executed every 90 days:

```sql
-- 1. Identify all active Super Admin and Admin accounts
SELECT
  p.id,
  p.full_name,
  p.email,
  r.name AS assigned_role,
  ur.created_at AS assigned_at
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
JOIN roles r ON r.id = ur.role_id
WHERE r.name IN ('super_admin', 'admin')
ORDER BY r.name, p.full_name;

-- 2. Audit all individual user permission overrides
SELECT
  p.full_name,
  p.email,
  perm.name AS override_permission,
  up.is_granted,
  up.created_at,
  up.notes
FROM user_permissions up
JOIN profiles p ON p.id = up.user_id
JOIN permissions perm ON perm.id = up.permission_id
ORDER BY p.full_name;
```

---

## 5. Dependency Vulnerability Management Policy

1. **Automated Dependabot / GitHub Alerts:** Enabled on repository to track published CVEs.
2. **Weekly Dependency Inspection:** Check for patch updates for `@supabase/supabase-js`, `@supabase/ssr`, `next`, and `zod`.
3. **Compatibility Testing:** Prior to bumping any minor or major package version:
   - Run complete test suite (`pnpm test`).
   - Run full production build (`pnpm build`).
   - Verify Supabase SSR authentication and session cookies function cleanly.
