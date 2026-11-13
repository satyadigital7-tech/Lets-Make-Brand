-- ==============================================================================
-- LMB PLATFORM: PHASE 7 DATABASE HARDENING, INDEXES & RECONCILIATION
-- High-Performance Composite Indexes, Balance Integrity Constraints & Auditing
-- ==============================================================================

-- 1. High-Performance Composite Indexes for Production Query Workloads
CREATE INDEX IF NOT EXISTS idx_leads_campaign_status_created 
    ON public.leads(campaign_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_partner_status 
    ON public.leads(partner_id, status);

CREATE INDEX IF NOT EXISTS idx_leads_phone_email 
    ON public.leads(customer_mobile, customer_email);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet_created 
    ON public.wallet_transactions(wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_withdrawal_wallet_status 
    ON public.withdrawal_requests(wallet_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
    ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created 
    ON public.audit_logs(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status_priority 
    ON public.support_tickets(status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kyc_status_user 
    ON public.kyc_records(status, user_id);

CREATE INDEX IF NOT EXISTS idx_campaign_assignments_user 
    ON public.campaign_assignments(campaign_id, partner_id, vendor_id);

-- 2. Financial Integrity Check Constraints (Anti-Tampering & Overdraw Guards)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_wallet_available_non_negative'
    ) THEN
        ALTER TABLE public.wallet_balances 
            ADD CONSTRAINT chk_wallet_available_non_negative CHECK (available_balance >= 0);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_wallet_reserved_non_negative'
    ) THEN
        ALTER TABLE public.wallet_balances 
            ADD CONSTRAINT chk_wallet_reserved_non_negative CHECK (reserved_balance >= 0);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_wallet_total_earnings_non_negative'
    ) THEN
        ALTER TABLE public.wallet_balances 
            ADD CONSTRAINT chk_wallet_total_earnings_non_negative CHECK (total_earnings >= 0);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Financial Reconciliation View (Mathematical Ledger Invariant Check)
CREATE OR REPLACE VIEW public.view_wallet_reconciliation AS
SELECT 
    wb.id AS wallet_id,
    wb.user_id,
    wb.total_earnings,
    wb.available_balance,
    wb.reserved_balance,
    wb.total_withdrawn,
    ROUND((wb.total_earnings - wb.reserved_balance - wb.total_withdrawn)::numeric, 2) AS computed_available,
    CASE 
        WHEN ROUND(wb.available_balance::numeric, 2) = ROUND((wb.total_earnings - wb.reserved_balance - wb.total_withdrawn)::numeric, 2)
             AND wb.available_balance >= 0 
             AND wb.reserved_balance >= 0 
        THEN true 
        ELSE false 
    END AS is_mathematically_consistent,
    COALESCE(
        (SELECT ROUND(SUM(wr.amount)::numeric, 2) 
         FROM public.withdrawal_requests wr 
         WHERE wr.wallet_id = wb.id AND wr.status = 'pending'), 
        0.00
    ) AS active_pending_withdrawals_sum
FROM public.wallet_balances wb;

-- 4. Database Integrity Verification Function
CREATE OR REPLACE FUNCTION public.check_system_financial_integrity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inconsistent_wallets int;
    v_negative_balances int;
    v_result jsonb;
BEGIN
    SELECT COUNT(*) INTO v_inconsistent_wallets
    FROM public.view_wallet_reconciliation
    WHERE is_mathematically_consistent = false;

    SELECT COUNT(*) INTO v_negative_balances
    FROM public.wallet_balances
    WHERE available_balance < 0 OR reserved_balance < 0 OR total_earnings < 0;

    v_result := jsonb_build_object(
        'timestamp', now(),
        'inconsistent_wallets_count', v_inconsistent_wallets,
        'negative_balances_count', v_negative_balances,
        'status', CASE WHEN v_inconsistent_wallets = 0 AND v_negative_balances = 0 THEN 'CLEAN' ELSE 'DISCREPANCY_DETECTED' END
    );

    RETURN v_result;
END;
$$;

