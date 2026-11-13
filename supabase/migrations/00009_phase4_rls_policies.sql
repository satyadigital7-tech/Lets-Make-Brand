-- ==============================================================================
-- LMB Platform - Migration 00009: Phase 4 Commission Row Level Security (RLS)
-- ==============================================================================

-- 1. ENABLE RLS ON ALL PHASE 4 FINANCIAL TABLES
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_commission_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_reversals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. COMMISSION RULES RLS POLICIES (Module 1, 10)
DROP POLICY IF EXISTS "Super Admin full access on commission_rules" ON public.commission_rules;
CREATE POLICY "Super Admin full access on commission_rules"
    ON public.commission_rules FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can view commission_rules" ON public.commission_rules;
CREATE POLICY "Admins can view commission_rules"
    ON public.commission_rules FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Vendors and Partners view active commission_rules" ON public.commission_rules;
CREATE POLICY "Vendors and Partners view active commission_rules"
    ON public.commission_rules FOR SELECT
    USING (is_active = true);

-- 3. VENDOR COMMISSION SPLITS RLS POLICIES (Module 2, 10)
DROP POLICY IF EXISTS "Super Admin full access on vendor_commission_splits" ON public.vendor_commission_splits;
CREATE POLICY "Super Admin full access on vendor_commission_splits"
    ON public.vendor_commission_splits FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can view vendor_commission_splits" ON public.vendor_commission_splits;
CREATE POLICY "Admins can view vendor_commission_splits"
    ON public.vendor_commission_splits FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Vendors manage own commission_splits" ON public.vendor_commission_splits;
CREATE POLICY "Vendors manage own commission_splits"
    ON public.vendor_commission_splits FOR ALL
    USING (vendor_id = auth.uid())
    WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Team members view active splits for their vendor" ON public.vendor_commission_splits;
CREATE POLICY "Team members view active splits for their vendor"
    ON public.vendor_commission_splits FOR SELECT
    USING (
        is_active = true
        AND (
            EXISTS (
                SELECT 1 FROM public.profiles p 
                WHERE p.id = auth.uid() AND p.associated_vendor_id = vendor_commission_splits.vendor_id
            )
            OR EXISTS (
                SELECT 1 FROM public.team_members tm 
                JOIN public.teams t ON t.id = tm.team_id 
                WHERE tm.user_id = auth.uid() AND tm.status = 'active' AND t.vendor_id = vendor_commission_splits.vendor_id
            )
        )
    );

-- 4. COMMISSION TRANSACTIONS RLS POLICIES (IMMUTABLE LEDGER) (Module 6, 7, 8, 10)
DROP POLICY IF EXISTS "Super Admin full view on commission_transactions" ON public.commission_transactions;
CREATE POLICY "Super Admin full view on commission_transactions"
    ON public.commission_transactions FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can view commission_transactions" ON public.commission_transactions;
CREATE POLICY "Admins can view commission_transactions"
    ON public.commission_transactions FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Vendors view own financial transactions and squad credits" ON public.commission_transactions;
CREATE POLICY "Vendors view own financial transactions and squad credits"
    ON public.commission_transactions FOR SELECT
    USING (
        vendor_id = auth.uid()
        OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Partners view own commission credits" ON public.commission_transactions;
CREATE POLICY "Partners view own commission credits"
    ON public.commission_transactions FOR SELECT
    USING (user_id = auth.uid());

-- 5. COMMISSION REVERSALS RLS POLICIES
DROP POLICY IF EXISTS "Super Admin and Admin view commission_reversals" ON public.commission_reversals;
CREATE POLICY "Super Admin and Admin view commission_reversals"
    ON public.commission_reversals FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Beneficiaries view reversals for own transactions" ON public.commission_reversals;
CREATE POLICY "Beneficiaries view reversals for own transactions"
    ON public.commission_reversals FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.commission_transactions ct
            WHERE ct.id = commission_reversals.transaction_id
            AND (ct.user_id = auth.uid() OR ct.vendor_id = auth.uid())
        )
    );

-- 6. COMMISSION AUDIT LOGS RLS POLICIES
DROP POLICY IF EXISTS "Super Admin full access on commission_audit_logs" ON public.commission_audit_logs;
CREATE POLICY "Super Admin full access on commission_audit_logs"
    ON public.commission_audit_logs FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins view commission_audit_logs" ON public.commission_audit_logs;
CREATE POLICY "Admins view commission_audit_logs"
    ON public.commission_audit_logs FOR SELECT
    USING (public.is_admin_or_super());

