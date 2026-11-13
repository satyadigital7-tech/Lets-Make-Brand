# Lets Make Brand (LMB) - Vendor Agency User Guide

## 1. Welcome to LMB for Brand Vendors

As a registered Vendor Agency on the Lets Make Brand platform, you have access to enterprise tools to manage promotional squads, configure commission distributions, publish or assign brand campaigns, and manage agency disbursements.

---

## 2. Onboarding & Account Approval

1. **Registration:** Submit the Vendor Registration form with your legal business name, registered address, and official contact information.
2. **Pending Approval:** New accounts are placed in `pending_approval` status while our compliance staff conducts due diligence.
3. **Approval Notification:** Once approved by Super Admin, your unique Vendor Code (`VEN-XXXXXX`) is generated, and your dashboard unlocks.
4. **KYC Submission:** Navigate to **KYC & Compliance** (`/dashboard/vendor/kyc`) to submit commercial entity PAN, GSTIN (optional), and corporate bank account details.

---

## 3. Team & Squad Management (`/dashboard/vendor/teams`)

- **Creating Squads:** Create specialized teams (e.g., *North Region Growth*, *Digital Influencer Squad*).
- **Designating Team Leaders:** Assign an approved partner as Team Leader. Team Leaders can view assigned squad members and monitor campaign traffic without claiming individual member commissions.
- **Inviting Team Members:**
  - Send email invitation links directly from `/dashboard/vendor/invitations`.
  - When members accept, they are automatically linked to your vendor agency organization under PostgreSQL Row Level Security.

---

## 4. Commission Splits & Distribution (`/dashboard/vendor/commission`)

- **Configuring Splits:** For assigned campaigns, you can configure how the total commission is divided between your agency and the active partner.
- **Rule Limits:** The sum of your vendor share and the partner's payout can never exceed the maximum campaign limit configured by Super Admin.
- **Version History:** Every split configuration change creates an immutable version snapshot, ensuring prior conversions maintain their original agreed rates.

---

## 5. Wallet & Payout Withdrawals (`/dashboard/vendor/wallet`)

- **Available Balance:** Funds available for immediate withdrawal.
- **Reserved Balance:** Funds currently locked in active withdrawal requests awaiting administrator disbursement.
- **Requesting Withdrawal:**
  1. Click **Request Withdrawal**.
  2. Enter amount (minimum ₹500).
  3. Select Bank Transfer or UPI ID.
  4. Submit request. The amount is immediately moved to `reserved_balance`.
  5. Once staff disburses funds and attaches the banking reference (UTR), the status updates to `completed`.

---

## 6. Official Documents & ID Verification (`/dashboard/vendor/documents`)

- **Vendor ID Card:** Download your official digital ID card with your unique vendor code and QR verification badge.
- **Master Vendor Agreement:** Download your counter-signed appointment agreement with LMB platform terms.
