# Lets Make Brand (LMB) - Administrator & Super Admin Operational Manual

## 1. Overview & Role Hierarchy

The Lets Make Brand platform provides two administrative tiers:
- **Super Admin (`super_admin`):** Complete system authority with wildcard permissions (`*`). Controls campaign maximum limits, vendor transfer permissions, master commission ceilings, KYC review, wallet manual disbursement approvals, and platform audit logs.
- **Admin (`admin`):** Staff role with operational permissions explicitly granted by Super Admin. Handles lead qualifications, partner and vendor onboarding reviews, and support ticket resolution.

> [!IMPORTANT]
> Standard Admins **CANNOT** execute vendor balance transfers (`can_manage_vendor_transfers = false`) unless explicitly granted this permission by a Super Admin.

---

## 2. Super Admin Operations

### 2.1 Staff & Admin Account Management (`/dashboard/super-admin/admins`)
- **Creating an Admin:** Navigate to the Admin Management desk, click **Create Admin**, and enter Full Name, Email, and initial permissions.
- **Granular Permission Grants:** Admins do not inherit dangerous permissions automatically. Assign permissions individually:
  - `view_vendors` / `manage_vendors`
  - `view_partners` / `manage_partners`
  - `view_campaigns` / `manage_campaigns`
  - `can_manage_vendor_transfers` *(Sensitive action strictly audited)*
- **Deactivating Staff:** Use the Toggle Status switch to revoke an Admin's access immediately.

### 2.2 Campaign Lifecycle & Commission Ceilings (`/dashboard/super-admin/campaigns`)
- **Campaign Creation:** Enter Brand/Client name, description, target audience, eligibility criteria, and maximum payout.
- **Commission Limits:** Super Admin sets the absolute ceiling (`max_commission_amount`). Vendors cannot configure team splits exceeding this amount.
- **Status Progression:** `Draft` $\to$ `Active` $\to$ `Paused` $\to$ `Completed` $\to$ `Archived`.
- **Campaign Assignment:** Assign brand campaigns to specific Vendors, Teams, or Independent Partners.

### 2.3 Lead Moderation & Verification (`/dashboard/super-admin/leads`)
- **Review Queue:** Inspect customer leads submitted by partners, view attached proof documents, and review automated fraud/duplicate detection scores.
- **Approval:** Approving a lead automatically initiates the atomic commission calculation engine, crediting the partner's and vendor's wallets according to configured splits.
- **Rejection & Resubmission:** Provide explicit reasons when rejecting or requesting partner corrections.

### 2.4 Financial Payouts & Approvals (`/dashboard/super-admin/wallet` & `/payments`)
- **Withdrawal Requests:** When a vendor or partner requests a withdrawal, their available balance is reserved in an atomic transaction.
- **Disbursement:**
  1. Inspect payout destination (Bank IFSC/Account or UPI).
  2. Execute payment via external corporate banking portal.
  3. Enter the external banking UTR / Transaction Reference ID.
  4. Click **Confirm Payment & Release Funds**.
- **Reconciliation Engine:** Run financial audits from `/dashboard/super-admin/reports` to ensure ledger mathematical consistency.

### 2.5 KYC Compliance Desk (`/dashboard/super-admin/kyc`)
- Inspect government PAN and banking documents via private short-lived URLs.
- Verify that full names match bank records.
- Approve or request resubmission.

---

## 3. Support & Incident Triage (`/dashboard/super-admin/support`)
- View tickets categorized by `campaign`, `commission`, `technical`, `kyc`, or `other`.
- Assign tickets to specific administrators.
- Respond with threaded messages and update status: `open` $\to$ `in_progress` $\to$ `waiting_user` $\to$ `resolved` $\to$ `closed`.
