# Lets Make Brand (LMB) - Future Enhancements & Architectural Roadmap

> [!IMPORTANT]
> **GOVERNANCE RULE:** The modules documented in this roadmap are strictly **optional future enhancements**. They are **NOT** active in the current production release and must **NOT** be implemented without explicit client authorization and architectural signoff.

---

## 1. Architectural Principles for Future Modules

To ensure that future enhancements do not compromise existing stability, security, or financial accuracy:
1. **Zero Breaking Changes:** Existing PostgreSQL schemas, RLS policies, and API contracts must remain backwards-compatible.
2. **Preserve Manual Payout Default:** Any automated payout integration must exist strictly as an opt-in administrative feature requiring secondary multi-factor authentication (MFA).
3. **No Fabricated Data:** Real PostgreSQL records remain the single source of truth for all analytics and promotional badges.
4. **Staging Environment Validation:** All future modules must undergo isolated staging environment validation before production rollout.

---

## 2. Optional Future Enhancements Catalog

### Module 1: Native Mobile Application (iOS & Android)
- **Description:** Dedicated mobile application for Partners, Team Leaders, and Vendors.
- **Recommended Stack:** React Native with Expo (TypeScript), utilizing existing Supabase Auth and PostgREST endpoints.
- **Target Features:**
  - Push notifications for lead approval, team member joins, and withdrawal status updates.
  - Quick QR code sharing and lead intake on mobile devices.
  - Biometric authentication (FaceID / Fingerprint) for wallet balance inspection.
- **Prerequisites:** Supabase Auth mobile deep linking configuration (`lmb://auth/callback`), Apple Developer Account, Google Play Console.
- **Client Approval Gate:** Requires mobile UI/UX design review and App Store deployment authorization.

---

### Module 2: WhatsApp Notifications & Two-Way Bot
- **Description:** Automated transactional notifications and inquiry responses via WhatsApp.
- **Recommended Stack:** Meta Cloud API (WhatsApp Business Platform) or Twilio WhatsApp API.
- **Target Features:**
  - Real-time lead status updates ("Your lead for Campaign X has been approved!").
  - Payout disbursement confirmations with bank UTR reference numbers.
  - KYC verification status alerts (approval or correction requests).
  - Optional interactive chat bot for checking available wallet balances.
- **Prerequisites:** Verified Meta Business Manager account, approved WhatsApp Message Templates, Indian DLT compliance.
- **Client Approval Gate:** Requires template message pricing approval and business number verification.

---

### Module 3: Advanced Analytics Dashboard
- **Description:** Deep business intelligence and executive visual reporting suite.
- **Recommended Stack:** PostHog / Grafana Cloud or embedded Apache Superset with read-only PostgreSQL replica connection.
- **Target Features:**
  - Real-time partner conversion heatmaps by geographical region in India.
  - Lead submission velocity charts and vendor campaign burn-rate analysis.
  - Churn prediction for underperforming marketing squads.
- **Prerequisites:** Dedicated read-only database replica to prevent analytics queries from impacting production transactional throughput.
- **Client Approval Gate:** Requires infrastructure cost approval for read replica.

---

### Module 4: Automated Report Scheduling
- **Description:** Cron-based automated generation and email dispatch of periodic platform reports.
- **Recommended Stack:** Vercel Cron Jobs / Supabase pg_cron with Resend / Amazon SES.
- **Target Features:**
  - Weekly Monday morning digest sent to Brand Vendors detailing squad conversions.
  - Monthly Executive Treasury PDF automatically delivered to Super Admin finance team on the 1st of each month.
  - Automated partner earning statements in PDF format.
- **Prerequisites:** Verified production domain in email service provider (Resend / AWS SES) with SPF, DKIM, and DMARC records.
- **Client Approval Gate:** Requires email dispatch schedule and recipient list approval.

---

### Module 5: Advanced Campaign Performance Analytics
- **Description:** Granular attribution funnel tracking and promotional click analytics.
- **Target Features:**
  - Multi-touch attribution modeling (First-click, Last-click, Linear).
  - Real-time Sub-ID tracking and conversion rate analysis per traffic source.
  - Campaign A/B testing with automated traffic distribution.
- **Prerequisites:** Scalable event intake pipeline (Redis / Upstash) to handle high-frequency click redirects without database locks.
- **Client Approval Gate:** Requires attribution model signoff from brand partners.

---

### Module 6: Multi-Language Support (Localization)
- **Description:** Localization of public website and dashboard interfaces into Hindi and major regional Indian languages.
- **Recommended Stack:** `next-intl` or `i18next` with JSON locale dictionaries.
- **Target Languages:** Hindi (`hi-IN`), Marathi (`mr-IN`), Bengali (`bn-IN`), Tamil (`ta-IN`), Telugu (`te-IN`), and Gujarati (`gu-IN`).
- **Target Features:**
  - Locale selector in public header and dashboard topbar.
  - Localized transactional notification emails and PDF ID cards.
  - Support ticket automatic translation for multilingual partner inquiries.
- **Prerequisites:** Certified human translation or LLM-assisted localization review.
- **Client Approval Gate:** Requires translation accuracy signoff by operations team.

---

### Module 7: Referral & Promotional Enhancements
- **Description:** Gamified multi-tier referral programs and partner incentive tiers.
- **Target Features:**
  - Partner-to-Partner referral bonus rules (e.g. 5% override on direct invitee earnings for first 90 days).
  - Achievement badges (e.g. "Top Converter", "Century Lead Club", "Elite Agency").
  - Campaign bounty leaderboards with bonus prize distributions.
- **Prerequisites:** Schema additions for `partner_referrals` and `gamification_badges` with strict anti-gaming fraud detection.
- **Client Approval Gate:** Requires financial split modeling approval to ensure total commissions never exceed campaign budgets.

---

### Module 8: Direct Bank Payout & Gateway Integrations
- **Description:** Automated API disbursement to Indian bank accounts and UPI IDs.
- **Recommended Providers:** RazorpayX Payouts, Cashfree Payouts, or Decentro API.
- **Target Features:**
  - One-click IMPS / NEFT / RTGS direct transfer from LMB treasury wallet.
  - Automated bank account Penny Drop validation during KYC verification.
  - Instant UPI VPA verification before withdrawal submission.
  - Real-time webhook reconciliation for instant UTR capture.
- **Safety Safeguards:**
  - Dual-authorization threshold: Withdrawals exceeding ₹50,000 require two separate Super Admin approvals.
  - Daily disbursement caps to mitigate catastrophic balance drainage in the event of compromised credentials.
- **Prerequisites:** Current Account opening with partner bank, corporate KYC with payment aggregator.
- **Client Approval Gate:** **MANDATORY CLIENT APPROVAL REQUIRED.** Must not be activated without explicit corporate resolution.

