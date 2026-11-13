-- ==============================================================================
-- LMB Platform - Migration 00011: Phase 5 Financial Row Level Security (RLS)
-- ==============================================================================

-- 1. ENABLE RLS ON ALL PHASE 5 FINANCIAL TABLES
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. WALLETS RLS POLICIES (Module 1, 2, 3, 11)
DROP POLICY IF EXISTS "Super Admin full access on wallets" ON public.wallets;
CREATE POLICY "Super Admin full access on wallets"
    ON public.wallets FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins view wallets" ON public.wallets;
CREATE POLICY "Admins view wallets"
    ON public.wallets FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users view own wallet" ON public.wallets;
CREATE POLICY "Users view own wallet"
    ON public.wallets FOR SELECT
    USING (user_id = auth.uid());

-- 3. PAYOUT METHODS RLS POLICIES (Module 4)
DROP POLICY IF EXISTS "Super Admin and Admins view payout_methods" ON public.payout_methods;
CREATE POLICY "Super Admin and Admins view payout_methods"
    ON public.payout_methods FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users manage own payout_methods" ON public.payout_methods;
CREATE POLICY "Users manage own payout_methods"
    ON public.payout_methods FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 4. WITHDRAWALS RLS POLICIES (Module 4, 5, 6)
DROP POLICY IF EXISTS "Super Admin full access on withdrawals" ON public.withdrawals;
CREATE POLICY "Super Admin full access on withdrawals"
    ON public.withdrawals FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins view and process withdrawals" ON public.withdrawals;
CREATE POLICY "Admins view and process withdrawals"
    ON public.withdrawals FOR ALL
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users view own withdrawals" ON public.withdrawals;
CREATE POLICY "Users view own withdrawals"
    ON public.withdrawals FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own withdrawal requests" ON public.withdrawals;
CREATE POLICY "Users insert own withdrawal requests"
    ON public.withdrawals FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 5. PAYMENTS RLS POLICIES (Module 7, 9)
DROP POLICY IF EXISTS "Super Admin full access on payments" ON public.payments;
CREATE POLICY "Super Admin full access on payments"
    ON public.payments FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins view and create payments" ON public.payments;
CREATE POLICY "Admins view and create payments"
    ON public.payments FOR ALL
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users view payments made to themselves" ON public.payments;
CREATE POLICY "Users view payments made to themselves"
    ON public.payments FOR SELECT
    USING (user_id = auth.uid());

-- 6. WALLET LEDGER RLS POLICIES (Module 8, 11)
DROP POLICY IF EXISTS "Super Admin full view on wallet_ledger" ON public.wallet_ledger;
CREATE POLICY "Super Admin full view on wallet_ledger"
    ON public.wallet_ledger FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins view wallet_ledger" ON public.wallet_ledger;
CREATE POLICY "Admins view wallet_ledger"
    ON public.wallet_ledger FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users view own wallet_ledger entries" ON public.wallet_ledger;
CREATE POLICY "Users view own wallet_ledger entries"
    ON public.wallet_ledger FOR SELECT
    USING (user_id = auth.uid());

-- 7. FINANCIAL AUDIT LOGS RLS POLICIES
DROP POLICY IF EXISTS "Super Admin and Admins view financial_audit_logs" ON public.financial_audit_logs;
CREATE POLICY "Super Admin and Admins view financial_audit_logs"
    ON public.financial_audit_logs FOR SELECT
    USING (public.is_admin_or_super());
