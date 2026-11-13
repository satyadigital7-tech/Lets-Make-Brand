# Lets Make Brand (LMB) - PostgreSQL Database Architecture & Schema Reference

## 1. Schema Topology & Design Principles

The database is built on **Supabase PostgreSQL 15+** adhering to:
- **Strict Row Level Security (RLS):** All tables default to deny; access policies strictly isolate multi-tenant records.
- **Idempotent Sequential Migrations:** 15 modular migration files consolidated into `apply_migrations.sql`.
- **Centralized Central Identity:** `auth.users` maps to `public.profiles` via an atomic trigger `on_auth_user_created`.
- **Financial Balance Invariant:**
  $$\text{Total Earnings} = \text{Available Balance} + \text{Reserved Balance} + \text{Total Withdrawn}$$
  Protected by check constraints (`chk_wallet_available_non_negative`, etc.).
- **Immutable Audit Logging:** `public.audit_logs` has insert-only policies; updates and deletes are blocked.

---

## 2. Core Relational Entity Map

| Table Name | Primary Key | Key Foreign Keys | Key Constraints & Indexes |
| :--- | :--- | :--- | :--- |
| `public.profiles` | `id` (UUID) | `id -> auth.users(id)` | Unique email, check on status (`active`, `pending_approval`, etc.) |
| `public.roles` | `id` (UUID) | None | Unique `code` (`super_admin`, `admin`, `vendor`, `team_leader`, `team_member`, `independent_partner`) |
| `public.permissions` | `id` (UUID) | None | Unique `code` |
| `public.user_roles` | `id` (UUID) | `user_id -> profiles(id)`, `role_id -> roles(id)` | Unique composite `(user_id, role_id)` |
| `public.campaigns` | `id` (UUID) | `created_by -> profiles(id)` | Unique `slug`, `campaign_code`, status enum |
| `public.campaign_assignments`| `id` (UUID) | `campaign_id -> campaigns(id)`, `partner_id`, `vendor_id`, `team_id` | Composite lookup index |
| `public.teams` | `id` (UUID) | `vendor_id -> profiles(id)`, `leader_id -> profiles(id)` | Unique `team_code` |
| `public.team_members` | `id` (UUID) | `team_id -> teams(id)`, `user_id -> profiles(id)` | Unique composite `(team_id, user_id)` |
| `public.team_invitations` | `id` (UUID) | `team_id -> teams(id)`, `vendor_id -> profiles(id)` | Unique `token`, expiry timestamp |
| `public.leads` | `id` (UUID) | `campaign_id`, `submitted_by`, `vendor_id`, `team_id` | Unique `lead_code`, composite indexes on phone/email |
| `public.lead_documents` | `id` (UUID) | `lead_id -> leads(id)` | Index on `lead_id` |
| `public.lead_status_history` | `id` (UUID) | `lead_id -> leads(id)`, `actor_id -> profiles(id)` | Immutable history |
| `public.commission_rules` | `id` (UUID) | `campaign_id -> campaigns(id)`, `vendor_id`, `team_id` | Unique active rule index |
| `public.commission_transactions`| `id` (UUID) | `lead_id -> leads(id)`, `campaign_id`, `partner_id`, `vendor_id` | Unique transaction code, lead uniqueness check |
| `public.wallet_balances` | `id` (UUID) | `user_id -> profiles(id)` | Unique `user_id`, non-negative check constraints |
| `public.wallet_transactions` | `id` (UUID) | `wallet_id -> wallet_balances(id)` | Unique `transaction_code`, composite index on created_at |
| `public.withdrawal_requests` | `id` (UUID) | `wallet_id -> wallet_balances(id)`, `user_id -> profiles(id)` | Unique `request_code`, status enum |
| `public.payment_records` | `id` (UUID) | `withdrawal_id -> withdrawal_requests(id)` | Unique payment reference code |
| `public.kyc_records` | `id` (UUID) | `user_id -> profiles(id)` | Unique `kyc_code`, status enum |
| `public.kyc_documents` | `id` (UUID) | `kyc_id -> kyc_records(id)` | Private bucket file path |
| `public.document_templates` | `id` (UUID) | None | Template type (`id_card_partner`, `id_card_vendor`, `offer_letter`) |
| `public.generated_documents` | `id` (UUID) | `user_id -> profiles(id)` | Unique `verification_reference`, `doc_code` |
| `public.notifications` | `id` (UUID) | `user_id -> profiles(id)` | Index on `(user_id, is_read, created_at DESC)` |
| `public.notification_preferences`| `id` (UUID) | `user_id -> profiles(id)` | Unique `user_id` |
| `public.support_tickets` | `id` (UUID) | `user_id -> profiles(id)`, `assigned_to_id -> profiles(id)` | Unique `ticket_code`, composite status index |
| `public.support_messages` | `id` (UUID) | `ticket_id -> support_tickets(id)`, `user_id -> profiles(id)` | Threaded messaging |
| `public.support_attachments`| `id` (UUID) | `message_id -> support_messages(id)` | Private storage attachment path |
| `public.report_exports` | `id` (UUID) | `user_id -> profiles(id)` | Unique `export_code`, format enum |
| `public.audit_logs` | `id` (UUID) | `user_id -> profiles(id)` | Append-only security audit trail |
| `public.system_settings` | `id` (UUID) | None | Unique `key` |

---

## 3. Database Views & Verification Functions

- **`public.view_wallet_reconciliation`**: Real-time view asserting that `computed_available = total_earnings - reserved_balance - total_withdrawn`.
- **`public.check_system_financial_integrity()`**: Automated plpgsql function validating zero negative balances and zero wallet discrepancies.
