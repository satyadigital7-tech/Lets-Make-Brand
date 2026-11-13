# Lets Make Brand (LMB) - Business Growth Metrics & Feedback System

> [!IMPORTANT]
> **COMPLIANCE DIRECTIVE:** All platform KPIs, partner metrics, and financial reporting must be queried directly from real PostgreSQL records. LMB strictly prohibits fabricated metrics or mock counters in public marketing or administrative analytics.

---

## 1. Executive Business Performance Queries

The following queries extract the exact commercial performance metrics from the live database:

### 1.1 Core Growth Indicators

```sql
-- 1. Total Registered & Approved Vendors
SELECT
  COUNT(*) FILTER (WHERE status = 'active') AS total_approved_vendors,
  COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_vendor_applications,
  COUNT(*) AS total_registered_vendors
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
JOIN roles r ON r.id = ur.role_id
WHERE r.name = 'vendor';

-- 2. Total Approved & Pending Partners (Independent & Squad Members)
SELECT
  COUNT(*) FILTER (WHERE status = 'active') AS total_approved_partners,
  COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_partner_applications,
  COUNT(*) AS total_registered_partners
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
JOIN roles r ON r.id = ur.role_id
WHERE r.name IN ('independent_partner', 'team_member');

-- 3. Active Marketing Squads & Team Members
SELECT
  (SELECT COUNT(*) FROM teams WHERE status = 'active') AS active_teams_count,
  (SELECT COUNT(*) FROM team_members WHERE status = 'active') AS active_squad_members_count,
  (SELECT COUNT(*) FROM team_invitations WHERE status = 'pending') AS pending_invitations_count;

-- 4. Active Verified Campaigns
SELECT
  COUNT(*) FILTER (WHERE status = 'active') AS active_campaigns,
  COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_review_campaigns,
  COUNT(*) AS total_campaigns
FROM campaigns;
```

---

### 1.2 Lead Intake & Conversion Funnel Metrics

```sql
-- 5. Lead Verification & Conversion Ratios
SELECT
  COUNT(*) AS total_leads_submitted,
  COUNT(*) FILTER (WHERE status = 'approved') AS approved_leads,
  COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_leads,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_leads,
  COUNT(*) FILTER (WHERE is_duplicate = true) AS duplicate_discrepancies,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'approved')::numeric / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) AS overall_conversion_rate_percent
FROM leads;
```

---

### 1.3 Financial Treasury & Settlement Totals

```sql
-- 6. Total Platform Commissions Generated & Payouts Disbursed
SELECT
  -- Gross commissions credited to users
  COALESCE(
    SUM(commission_amount) FILTER (WHERE transaction_type = 'credit' AND commission_status = 'approved'), 
    0
  ) AS total_commissions_accrued,
  -- Commission reversals (disputes/fraud)
  COALESCE(
    SUM(commission_amount) FILTER (WHERE transaction_type = 'reversal'), 
    0
  ) AS total_commissions_reversed,
  -- Net commissions
  COALESCE(
    SUM(commission_amount) FILTER (WHERE transaction_type = 'credit' AND commission_status = 'approved'), 0
  ) - COALESCE(
    SUM(commission_amount) FILTER (WHERE transaction_type = 'reversal'), 0
  ) AS net_commissions_generated
FROM commission_transactions;

-- 7. Total Withdrawals Disbursed (Manual Bank Transfers with UTR)
SELECT
  COUNT(*) FILTER (WHERE status = 'paid') AS total_disbursements_completed,
  COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS total_rupees_disbursed,
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_payout_requests,
  COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending_payout_liability
FROM withdrawals;
```

---

### 1.4 Monthly Platform Growth Velocity

```sql
-- 8. Monthly Cohort Growth (Past 6 Months)
SELECT
  DATE_TRUNC('month', created_at) AS report_month,
  COUNT(*) AS new_partners_acquired,
  COUNT(*) FILTER (WHERE status = 'active') AS active_cohort
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
JOIN roles r ON r.id = ur.role_id
WHERE r.name IN ('independent_partner', 'team_member')
  AND created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY report_month DESC;
```

---

## 2. Launch Feedback Collection & Triage System

### 2.1 Direct Support Desk Integration
LMB captures launch feedback and partner bug reports natively via the built-in Support Desk (`/dashboard/support` for Partners/Vendors, `/dashboard/super-admin/support` for Administrators):

| Inquiry Category | Primary Subject Matter | Escalation Tier | SLA |
| :--- | :--- | :--- | :--- |
| **`wallet` / `withdrawal`** | Balance discrepancy, payout delay, UTR verification | Tier 1 (Finance Team) | < 4 Hours |
| **`lead_submission`** | Duplicate flagging questions, validation errors | Tier 2 (Operations Lead) | < 8 Hours |
| **`kyc`** | Document rejections, PAN / Bank name mismatch | Tier 2 (Compliance Admin) | < 12 Hours |
| **`campaign`** | Attribution tracking links, target criteria clarification | Tier 3 (Account Executive) | < 24 Hours |
| **`technical_support`** | UI responsiveness, login issues, bug reports | Engineering Lead | < 24 Hours |

### 2.2 Continuous Improvement & Feedback Loop
1. **Weekly Feedback Audit:** Every Monday, the Super Admin reviews all resolved and pending support tickets.
2. **Prioritization Framework:** Reported issues are categorized:
   - **P0 (Critical):** Prevents login, lead submission, or wallet withdrawal → Patch within 4 hours.
   - **P1 (High):** Erroneous validation error on valid document upload → Patch within 24 hours.
   - **P2 (Normal):** UI enhancement, copy clarification, or filter optimization → Include in next minor sprint.
3. **Staging Verification:** All improvements undergo testing in a non-production branch with `pnpm test` and `pnpm build` before deployment.
