-- ==============================================================================
-- LMB Platform - Migration 00008: Phase 4 Commission Management Schema
-- ==============================================================================

-- 1. COMMISSION RULES TABLE (Module 1, 3)
-- Controlled exclusively by Super Admin to define campaign maximum commission caps.
CREATE TABLE IF NOT EXISTS public.commission_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    max_commission_amount NUMERIC(12, 2) NOT NULL CHECK (max_commission_amount >= 0),
    partner_default_commission NUMERIC(12, 2) NOT NULL CHECK (partner_default_commission >= 0),
    vendor_max_commission NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (vendor_max_commission >= 0),
    independent_partner_commission NUMERIC(12, 2) NOT NULL CHECK (independent_partner_commission >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    is_active BOOLEAN NOT NULL DEFAULT true,
    version INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT unique_campaign_commission_rule UNIQUE (campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_campaign ON public.commission_rules(campaign_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_active ON public.commission_rules(is_active);

-- 2. VENDOR COMMISSION SPLITS TABLE (Module 2)
-- Configured by Vendors to distribute permitted commission between Vendor & Partner.
-- Must never exceed the Super Admin campaign max_commission_amount.
CREATE TABLE IF NOT EXISTS public.vendor_commission_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    vendor_share NUMERIC(12, 2) NOT NULL CHECK (vendor_share >= 0),
    partner_share NUMERIC(12, 2) NOT NULL CHECK (partner_share >= 0),
    total_split NUMERIC(12, 2) GENERATED ALWAYS AS (vendor_share + partner_share) STORED,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_vendor_splits_vendor ON public.vendor_commission_splits(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_splits_campaign ON public.vendor_commission_splits(campaign_id);
CREATE INDEX IF NOT EXISTS idx_vendor_splits_active ON public.vendor_commission_splits(is_active);

-- 3. SEQUENCE & UNIQUE CODE GENERATOR FOR COMMISSION TRANSACTIONS (Module 8)
CREATE SEQUENCE IF NOT EXISTS public.commission_txn_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_commission_transaction_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.commission_txn_seq');
        new_code := 'LMB-TXN-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.commission_transactions WHERE transaction_code = new_code) INTO is_taken;
        IF NOT is_taken THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. COMMISSION TRANSACTIONS TABLE (IMMUTABLE FINANCIAL LEDGER) (Module 8)
-- Historical ledger recording every credit, debit, reversal, and adjustment.
CREATE TABLE IF NOT EXISTS public.commission_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code VARCHAR(32) NOT NULL UNIQUE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE RESTRICT,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
    vendor_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    partner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    team_id UUID REFERENCES public.teams(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT, -- Beneficiary receiving the amount
    beneficiary_role VARCHAR(20) NOT NULL CHECK (beneficiary_role IN ('partner', 'vendor')),
    commission_amount NUMERIC(12, 2) NOT NULL CHECK (commission_amount >= 0),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'reversal', 'adjustment')),
    commission_status VARCHAR(20) NOT NULL CHECK (commission_status IN ('pending', 'approved', 'paid', 'reversed')),
    reference_code VARCHAR(64) NOT NULL,
    original_transaction_id UUID REFERENCES public.commission_transactions(id),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_commission_tx_lead ON public.commission_transactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_commission_tx_campaign ON public.commission_transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_commission_tx_vendor ON public.commission_transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commission_tx_partner ON public.commission_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_commission_tx_user ON public.commission_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_tx_status ON public.commission_transactions(commission_status);
CREATE INDEX IF NOT EXISTS idx_commission_tx_type ON public.commission_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_commission_tx_code ON public.commission_transactions(transaction_code);

-- Unique index to prevent duplicate credit transactions for the same lead and beneficiary role (Module 5 & 10)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_lead_credit 
    ON public.commission_transactions (lead_id, beneficiary_role, transaction_type) 
    WHERE transaction_type = 'credit';

-- 5. COMMISSION REVERSALS TABLE (Module 8)
CREATE TABLE IF NOT EXISTS public.commission_reversals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.commission_transactions(id) ON DELETE RESTRICT,
    reversal_transaction_id UUID NOT NULL REFERENCES public.commission_transactions(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    initiated_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_commission_rev_orig ON public.commission_reversals(transaction_id);
CREATE INDEX IF NOT EXISTS idx_commission_rev_new ON public.commission_reversals(reversal_transaction_id);

-- 6. COMMISSION AUDIT LOGS TABLE (Module 10)
CREATE TABLE IF NOT EXISTS public.commission_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id),
    transaction_id UUID REFERENCES public.commission_transactions(id),
    actor_id UUID REFERENCES public.profiles(id),
    action VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_commission_audit_lead ON public.commission_audit_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_commission_audit_actor ON public.commission_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_commission_audit_action ON public.commission_audit_logs(action);

-- 7. TRIGGER: IMMUTABLE COMMISSION LEDGER (Module 8 & 10)
-- Guaranteed prevention of direct UPDATE or DELETE operations on commission_transactions.
CREATE OR REPLACE FUNCTION public.prevent_commission_modifications()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Compliance Violation: Direct modification or deletion of financial commission ledger entries is strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_commission_updates ON public.commission_transactions;
CREATE TRIGGER trg_prevent_commission_updates
    BEFORE UPDATE OR DELETE ON public.commission_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_commission_modifications();

-- 8. ATOMIC COMMISSION CALCULATION ENGINE RPC (Module 4, 5, 10)
-- Runs inside a database transaction to calculate and credit commission idempotently.
CREATE OR REPLACE FUNCTION public.process_lead_commission(
    p_lead_id UUID,
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_lead RECORD;
    v_campaign RECORD;
    v_rule RECORD;
    v_split RECORD;
    v_is_team_leader BOOLEAN := false;
    v_existing_credits INT;
    v_max_cap NUMERIC(12, 2);
    v_partner_share NUMERIC(12, 2) := 0.00;
    v_vendor_share NUMERIC(12, 2) := 0.00;
    v_ref_code TEXT;
    v_partner_txn_code TEXT;
    v_vendor_txn_code TEXT;
    v_partner_txn_id UUID;
    v_vendor_txn_id UUID;
BEGIN
    -- 1. Fetch Lead
    SELECT * INTO v_lead FROM public.leads WHERE id = p_lead_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Lead record not found.');
    END IF;

    -- 2. Verify Lead Status Eligibility (Module 5)
    IF v_lead.status != 'approved' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Commission cannot be generated for unapproved lead (current status: ' || v_lead.status || ').');
    END IF;

    -- 3. Verify Lead is Not Duplicate
    IF v_lead.is_duplicate = true THEN
        RETURN jsonb_build_object('success', false, 'error', 'Commission cannot be generated for duplicate leads.');
    END IF;

    -- 4. Verify Submitting Partner is NOT a Team Leader (Module 5 & 13)
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = v_lead.submitted_by AND r.code = 'team_leader'
    ) INTO v_is_team_leader;

    IF v_is_team_leader THEN
        RETURN jsonb_build_object('success', false, 'error', 'Compliance Mandate: Team Leaders are strictly prohibited from receiving partner commissions.');
    END IF;

    -- 5. Check Idempotence: prevent duplicate processing (Module 5)
    SELECT COUNT(*) INTO v_existing_credits
    FROM public.commission_transactions
    WHERE lead_id = p_lead_id AND transaction_type = 'credit';

    IF v_existing_credits > 0 THEN
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Commission already calculated and credited for this lead (idempotent).',
            'already_processed', true
        );
    END IF;

    -- 6. Fetch Campaign Details
    SELECT * INTO v_campaign FROM public.campaigns WHERE id = v_lead.campaign_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Associated campaign not found.');
    END IF;

    -- 7. Fetch Campaign Commission Rule
    SELECT * INTO v_rule FROM public.commission_rules WHERE campaign_id = v_lead.campaign_id AND is_active = true;
    
    -- Fallback to campaign commission_amount if no explicit rule row exists
    IF NOT FOUND THEN
        v_max_cap := COALESCE(v_campaign.commission_amount, v_campaign.commission_rate, 0.00);
        v_partner_share := v_max_cap;
        v_vendor_share := 0.00;
    ELSE
        v_max_cap := v_rule.max_commission_amount;
    END IF;

    -- 8. Calculate Split based on Vendor vs Independent Partner (Module 2 & 3)
    IF v_lead.vendor_id IS NULL THEN
        -- Independent Partner: 100% partner share, 0% vendor share
        IF v_rule.id IS NOT NULL THEN
            v_partner_share := LEAST(v_rule.independent_partner_commission, v_max_cap);
        ELSE
            v_partner_share := v_max_cap;
        END IF;
        v_vendor_share := 0.00;
    ELSE
        -- Vendor-associated Lead: check vendor_commission_splits
        SELECT * INTO v_split 
        FROM public.vendor_commission_splits 
        WHERE vendor_id = v_lead.vendor_id 
          AND campaign_id = v_lead.campaign_id 
          AND is_active = true
        ORDER BY version DESC 
        LIMIT 1;

        IF FOUND THEN
            -- Validate that total split does not exceed Super Admin limit (Module 2)
            IF v_split.total_split > v_max_cap THEN
                -- Clamp to safe limit: Partner receives split ratio up to cap
                v_partner_share := LEAST(v_split.partner_share, v_max_cap);
                v_vendor_share := LEAST(v_split.vendor_share, v_max_cap - v_partner_share);
            ELSE
                v_partner_share := v_split.partner_share;
                v_vendor_share := v_split.vendor_share;
            END IF;
        ELSE
            -- Default when no vendor split is set
            IF v_rule.id IS NOT NULL THEN
                v_partner_share := LEAST(v_rule.partner_default_commission, v_max_cap);
                v_vendor_share := LEAST(v_rule.vendor_max_commission, v_max_cap - v_partner_share);
            ELSE
                v_partner_share := v_max_cap * 0.8; -- 80% default to partner
                v_vendor_share := v_max_cap * 0.2;  -- 20% default to vendor
            END IF;
        END IF;
    END IF;

    -- 9. Generate Reference & Transaction Codes
    v_ref_code := 'REF-' || v_lead.lead_code || '-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
    v_partner_txn_code := public.generate_commission_transaction_code();

    -- 10. Insert Partner Transaction (Module 8)
    IF v_partner_share > 0 THEN
        INSERT INTO public.commission_transactions (
            transaction_code,
            lead_id,
            campaign_id,
            vendor_id,
            partner_id,
            team_id,
            user_id,
            beneficiary_role,
            commission_amount,
            transaction_type,
            commission_status,
            reference_code,
            description,
            metadata
        ) VALUES (
            v_partner_txn_code,
            v_lead.id,
            v_lead.campaign_id,
            v_lead.vendor_id,
            v_lead.submitted_by,
            v_lead.team_id,
            v_lead.submitted_by,
            'partner',
            v_partner_share,
            'credit',
            'approved',
            v_ref_code,
            'Partner commission credited for approved lead ' || v_lead.lead_code,
            jsonb_build_object('lead_code', v_lead.lead_code, 'campaign_title', v_campaign.title)
        ) RETURNING id INTO v_partner_txn_id;

        -- Record Audit Log
        INSERT INTO public.commission_audit_logs (
            lead_id, transaction_id, actor_id, action, amount, details
        ) VALUES (
            v_lead.id, v_partner_txn_id, p_actor_id, 'COMMISSION_CREDITED_PARTNER', v_partner_share,
            jsonb_build_object('beneficiary', v_lead.submitted_by, 'role', 'partner', 'lead_code', v_lead.lead_code)
        );
    END IF;

    -- 11. Insert Vendor Transaction (if associated and share > 0)
    IF v_lead.vendor_id IS NOT NULL AND v_vendor_share > 0 THEN
        v_vendor_txn_code := public.generate_commission_transaction_code();

        INSERT INTO public.commission_transactions (
            transaction_code,
            lead_id,
            campaign_id,
            vendor_id,
            partner_id,
            team_id,
            user_id,
            beneficiary_role,
            commission_amount,
            transaction_type,
            commission_status,
            reference_code,
            description,
            metadata
        ) VALUES (
            v_vendor_txn_code,
            v_lead.id,
            v_lead.campaign_id,
            v_lead.vendor_id,
            v_lead.submitted_by,
            v_lead.team_id,
            v_lead.vendor_id,
            'vendor',
            v_vendor_share,
            'credit',
            'approved',
            v_ref_code,
            'Vendor override commission credited for approved squad lead ' || v_lead.lead_code,
            jsonb_build_object('lead_code', v_lead.lead_code, 'campaign_title', v_campaign.title)
        ) RETURNING id INTO v_vendor_txn_id;

        -- Record Audit Log
        INSERT INTO public.commission_audit_logs (
            lead_id, transaction_id, actor_id, action, amount, details
        ) VALUES (
            v_lead.id, v_vendor_txn_id, p_actor_id, 'COMMISSION_CREDITED_VENDOR', v_vendor_share,
            jsonb_build_object('beneficiary', v_lead.vendor_id, 'role', 'vendor', 'lead_code', v_lead.lead_code)
        );
    END IF;

    -- 12. Update Lead Record with calculated total commission
    UPDATE public.leads 
    SET commission_amount = (v_partner_share + v_vendor_share)
    WHERE id = p_lead_id;

    RETURN jsonb_build_object(
        'success', true,
        'lead_code', v_lead.lead_code,
        'partner_share', v_partner_share,
        'vendor_share', v_vendor_share,
        'total_commission', (v_partner_share + v_vendor_share),
        'partner_transaction_code', v_partner_txn_code,
        'vendor_transaction_code', v_vendor_txn_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. ATOMIC REVERSAL RPC (Module 8 & 10)
CREATE OR REPLACE FUNCTION public.reverse_lead_commission(
    p_transaction_id UUID,
    p_reason TEXT,
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_orig RECORD;
    v_rev_code TEXT;
    v_rev_id UUID;
BEGIN
    SELECT * INTO v_orig FROM public.commission_transactions WHERE id = p_transaction_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaction not found.');
    END IF;

    IF v_orig.transaction_type = 'reversal' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot reverse an already reversed transaction.');
    END IF;

    -- Check if already reversed
    IF EXISTS (SELECT 1 FROM public.commission_reversals WHERE transaction_id = p_transaction_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaction has already been reversed.');
    END IF;

    v_rev_code := public.generate_commission_transaction_code();

    -- Insert compensating reversal transaction into the immutable ledger
    INSERT INTO public.commission_transactions (
        transaction_code,
        lead_id,
        campaign_id,
        vendor_id,
        partner_id,
        team_id,
        user_id,
        beneficiary_role,
        commission_amount,
        transaction_type,
        commission_status,
        reference_code,
        original_transaction_id,
        description,
        metadata
    ) VALUES (
        v_rev_code,
        v_orig.lead_id,
        v_orig.campaign_id,
        v_orig.vendor_id,
        v_orig.partner_id,
        v_orig.team_id,
        v_orig.user_id,
        v_orig.beneficiary_role,
        v_orig.commission_amount,
        'reversal',
        'reversed',
        'REV-' || v_orig.transaction_code,
        v_orig.id,
        'Reversal of transaction ' || v_orig.transaction_code || ': ' || p_reason,
        jsonb_build_object('reversal_reason', p_reason, 'original_code', v_orig.transaction_code)
    ) RETURNING id INTO v_rev_id;

    -- Record in commission_reversals
    INSERT INTO public.commission_reversals (
        transaction_id,
        reversal_transaction_id,
        reason,
        initiated_by
    ) VALUES (
        p_transaction_id,
        v_rev_id,
        p_reason,
        p_actor_id
    );

    -- Record Audit Log
    INSERT INTO public.commission_audit_logs (
        lead_id, transaction_id, actor_id, action, amount, details
    ) VALUES (
        v_orig.lead_id, v_rev_id, p_actor_id, 'COMMISSION_REVERSED', v_orig.commission_amount,
        jsonb_build_object('original_transaction_id', p_transaction_id, 'reason', p_reason)
    );

    RETURN jsonb_build_object(
        'success', true,
        'reversal_transaction_code', v_rev_code,
        'amount_reversed', v_orig.commission_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. SEED DEFAULT COMMISSION RULES FOR EXISTING CAMPAIGNS
INSERT INTO public.commission_rules (
    campaign_id,
    max_commission_amount,
    partner_default_commission,
    vendor_max_commission,
    independent_partner_commission,
    is_active,
    version,
    notes
)
SELECT 
    id,
    COALESCE(commission_amount, commission_rate, 500.00),
    COALESCE(commission_amount, commission_rate, 500.00) * 0.8,
    COALESCE(commission_amount, commission_rate, 500.00) * 0.2,
    COALESCE(commission_amount, commission_rate, 500.00),
    true,
    1,
    'Default seed commission rule initialized during Phase 4 migration'
FROM public.campaigns
ON CONFLICT (campaign_id) DO NOTHING;

