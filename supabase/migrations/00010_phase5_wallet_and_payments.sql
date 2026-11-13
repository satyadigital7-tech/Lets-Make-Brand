-- ==============================================================================
-- LMB Platform - Migration 00010: Phase 5 Wallet and Financial Management Schema
-- ==============================================================================

-- 1. SEQUENCES & UNIQUE CODE GENERATORS (Module 1, 4, 7, 8)
CREATE SEQUENCE IF NOT EXISTS public.wallet_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.withdrawal_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.payment_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.wallet_ledger_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_wallet_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.wallet_code_seq');
        new_code := 'LMB-WAL-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.wallets WHERE wallet_code = new_code) INTO is_taken;
        IF NOT is_taken THEN RETURN new_code; END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_withdrawal_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.withdrawal_code_seq');
        new_code := 'LMB-WDR-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.withdrawals WHERE withdrawal_code = new_code) INTO is_taken;
        IF NOT is_taken THEN RETURN new_code; END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_payment_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.payment_code_seq');
        new_code := 'LMB-PAY-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.payments WHERE payment_code = new_code) INTO is_taken;
        IF NOT is_taken THEN RETURN new_code; END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_wallet_ledger_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.wallet_ledger_seq');
        new_code := 'LMB-WTR-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.wallet_ledger WHERE ledger_code = new_code) INTO is_taken;
        IF NOT is_taken THEN RETURN new_code; END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. WALLETS TABLE (Module 1)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_code VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_role VARCHAR(30) NOT NULL,
    total_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_earnings >= 0),
    pending_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (pending_earnings >= 0),
    available_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (available_balance >= 0),
    reserved_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (reserved_balance >= 0),
    total_withdrawn NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total_withdrawn >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT unique_user_wallet UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_code ON public.wallets(wallet_code);

-- 3. PAYOUT METHODS TABLE (Module 4)
CREATE TABLE IF NOT EXISTS public.payout_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('upi', 'bank_transfer')),
    is_default BOOLEAN NOT NULL DEFAULT true,
    upi_id VARCHAR(100),
    account_holder_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50),
    ifsc_code VARCHAR(20),
    bank_name VARCHAR(100),
    branch_name VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_payout_methods_user ON public.payout_methods(user_id);

-- 4. WITHDRAWALS TABLE (Module 4, 5, 6)
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    withdrawal_code VARCHAR(30) UNIQUE NOT NULL,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('upi', 'bank_transfer', 'neft', 'imps')),
    payout_details JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'processing', 'paid', 'rejected', 'cancelled')),
    rejection_reason TEXT,
    admin_remarks TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_wallet ON public.withdrawals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_code ON public.withdrawals(withdrawal_code);

-- 5. PAYMENTS TABLE (MANUAL PAYMENT RECORDS) (Module 7, 9)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_code VARCHAR(30) UNIQUE NOT NULL,
    withdrawal_id UUID NOT NULL REFERENCES public.withdrawals(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL,
    payment_reference VARCHAR(100) NOT NULL UNIQUE, -- UTR / Reference number
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'refunded')),
    proof_url TEXT,
    admin_remarks TEXT,
    processed_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_payments_withdrawal ON public.payments(withdrawal_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(payment_reference);

-- 6. WALLET LEDGER (IMMUTABLE FINANCIAL WALLET LEDGER) (Module 8)
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_code VARCHAR(30) UNIQUE NOT NULL,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(40) NOT NULL 
        CHECK (transaction_type IN ('commission_credit', 'withdrawal_reservation', 'withdrawal_release', 'withdrawal_payment', 'commission_reversal', 'manual_adjustment')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('credit', 'debit')),
    balance_before NUMERIC(12, 2) NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    reference_id VARCHAR(64) NOT NULL,
    description TEXT,
    processed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_wallet_ledger_wallet ON public.wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user ON public.wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_type ON public.wallet_ledger(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_code ON public.wallet_ledger(ledger_code);

-- 7. FINANCIAL AUDIT LOGS TABLE (Module 11)
CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id),
    withdrawal_id UUID REFERENCES public.withdrawals(id),
    payment_id UUID REFERENCES public.payments(id),
    actor_id UUID REFERENCES public.profiles(id),
    action VARCHAR(50) NOT NULL,
    amount NUMERIC(12, 2),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_financial_audit_actor ON public.financial_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_financial_audit_action ON public.financial_audit_logs(action);

-- 8. TRIGGER: IMMUTABLE WALLET LEDGER (Module 8 & 11)
CREATE OR REPLACE FUNCTION public.prevent_wallet_ledger_modifications()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Compliance Violation: Direct modification or deletion of wallet ledger entries is strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_wallet_ledger_modifications ON public.wallet_ledger;
CREATE TRIGGER trg_prevent_wallet_ledger_modifications
    BEFORE UPDATE OR DELETE ON public.wallet_ledger
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_wallet_ledger_modifications();

-- 9. ATOMIC RPC: GET OR CREATE WALLET (Module 1)
CREATE OR REPLACE FUNCTION public.get_or_create_wallet(
    p_user_id UUID,
    p_user_role TEXT DEFAULT 'independent_partner'
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_new_code TEXT;
    v_total_earned NUMERIC(12, 2) := 0.00;
    v_total_paid NUMERIC(12, 2) := 0.00;
    v_reserved NUMERIC(12, 2) := 0.00;
    v_available NUMERIC(12, 2) := 0.00;
    v_pending NUMERIC(12, 2) := 0.00;
BEGIN
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        v_new_code := public.generate_wallet_code();
        
        -- Calculate initial earnings from existing commission_transactions
        SELECT COALESCE(SUM(
            CASE 
                WHEN transaction_type = 'credit' THEN commission_amount 
                WHEN transaction_type = 'reversal' THEN -commission_amount
                ELSE 0.00 
            END
        ), 0.00) INTO v_total_earned
        FROM public.commission_transactions
        WHERE user_id = p_user_id AND commission_status = 'approved';

        -- Calculate pending earnings from leads
        SELECT COALESCE(SUM(commission_amount), 0.00) INTO v_pending
        FROM public.leads
        WHERE submitted_by = p_user_id AND status IN ('pending', 'under_verification', 'correction_requested');

        v_available := GREATEST(0.00, v_total_earned);

        INSERT INTO public.wallets (
            wallet_code,
            user_id,
            user_role,
            total_earnings,
            pending_earnings,
            available_balance,
            reserved_balance,
            total_withdrawn
        ) VALUES (
            v_new_code,
            p_user_id,
            p_user_role,
            v_total_earned,
            v_pending,
            v_available,
            0.00,
            0.00
        ) RETURNING * INTO v_wallet;
    END IF;

    RETURN to_jsonb(v_wallet);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. ATOMIC RPC: SUBMIT WITHDRAWAL REQUEST (Module 4, 6, 11)
CREATE OR REPLACE FUNCTION public.submit_withdrawal_request(
    p_user_id UUID,
    p_amount NUMERIC(12, 2),
    p_method TEXT,
    p_details JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_active_requests INT;
    v_min_threshold NUMERIC(12, 2) := 500.00; -- Default threshold
    v_wdr_code TEXT;
    v_wdr_id UUID;
    v_ledger_code TEXT;
    v_balance_before NUMERIC(12, 2);
    v_balance_after NUMERIC(12, 2);
BEGIN
    -- 1. Fetch system minimum withdrawal setting if configured
    SELECT COALESCE((value->>'min_withdrawal_amount')::NUMERIC, 500.00)
    INTO v_min_threshold
    FROM public.system_settings
    WHERE key = 'financial_settings';

    IF v_min_threshold IS NULL THEN v_min_threshold := 500.00; END IF;

    -- Validate minimum threshold
    IF p_amount < v_min_threshold THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Requested amount (₹' || p_amount || ') is below the minimum withdrawal threshold of ₹' || v_min_threshold || '.'
        );
    END IF;

    -- 2. Lock wallet row for update
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found for this account.');
    END IF;

    IF v_wallet.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet is ' || v_wallet.status || '. Withdrawals are disabled.');
    END IF;

    -- Validate sufficient available balance
    IF v_wallet.available_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Insufficient available balance. Available: ₹' || v_wallet.available_balance || ', Requested: ₹' || p_amount || '.'
        );
    END IF;

    -- 3. Check for existing pending/processing withdrawal requests (Module 4)
    SELECT COUNT(*) INTO v_active_requests
    FROM public.withdrawals
    WHERE user_id = p_user_id AND status IN ('pending', 'approved', 'processing');

    IF v_active_requests > 0 THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'You already have an active withdrawal request pending or processing. Please wait for it to complete.'
        );
    END IF;

    -- 4. Execute atomic balance hold
    v_balance_before := v_wallet.available_balance;
    v_balance_after := v_balance_before - p_amount;

    UPDATE public.wallets
    SET 
        available_balance = v_balance_after,
        reserved_balance = reserved_balance + p_amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = v_wallet.id;

    -- 5. Insert Withdrawal record
    v_wdr_code := public.generate_withdrawal_code();

    INSERT INTO public.withdrawals (
        withdrawal_code,
        wallet_id,
        user_id,
        amount,
        payment_method,
        payout_details,
        status
    ) VALUES (
        v_wdr_code,
        v_wallet.id,
        p_user_id,
        p_amount,
        p_method,
        p_details,
        'pending'
    ) RETURNING id INTO v_wdr_id;

    -- 6. Insert Wallet Ledger reservation entry
    v_ledger_code := public.generate_wallet_ledger_code();

    INSERT INTO public.wallet_ledger (
        ledger_code,
        wallet_id,
        user_id,
        transaction_type,
        amount,
        direction,
        balance_before,
        balance_after,
        reference_id,
        description,
        processed_by
    ) VALUES (
        v_ledger_code,
        v_wallet.id,
        p_user_id,
        'withdrawal_reservation',
        p_amount,
        'debit',
        v_balance_before,
        v_balance_after,
        v_wdr_code,
        'Funds reserved for withdrawal request ' || v_wdr_code,
        p_user_id
    );

    -- 7. Financial Audit Log
    INSERT INTO public.financial_audit_logs (
        wallet_id, withdrawal_id, actor_id, action, amount, details
    ) VALUES (
        v_wallet.id, v_wdr_id, p_user_id, 'WITHDRAWAL_REQUESTED', p_amount,
        jsonb_build_object('withdrawal_code', v_wdr_code, 'payment_method', p_method)
    );

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', v_wdr_id,
        'withdrawal_code', v_wdr_code,
        'amount', p_amount,
        'available_balance', v_balance_after
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. ATOMIC RPC: PROCESS WITHDRAWAL STATUS TRANSITION (Module 5, 6, 7)
CREATE OR REPLACE FUNCTION public.process_withdrawal_status(
    p_withdrawal_id UUID,
    p_action TEXT, -- 'approve', 'mark_processing', 'reject', 'cancel', 'mark_paid'
    p_actor_id UUID,
    p_params JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_wdr RECORD;
    v_wallet RECORD;
    v_ledger_code TEXT;
    v_pay_code TEXT;
    v_pay_id UUID;
    v_reason TEXT;
    v_remarks TEXT;
    v_utr TEXT;
    v_pay_date DATE;
    v_proof_url TEXT;
BEGIN
    SELECT * INTO v_wdr FROM public.withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Withdrawal request not found.');
    END IF;

    SELECT * INTO v_wallet FROM public.wallets WHERE id = v_wdr.wallet_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Associated wallet not found.');
    END IF;

    -- ACTION: APPROVE
    IF p_action = 'approve' THEN
        IF v_wdr.status != 'pending' THEN
            RETURN jsonb_build_object('success', false, 'error', 'Only pending requests can be approved (current: ' || v_wdr.status || ').');
        END IF;

        UPDATE public.withdrawals
        SET status = 'approved', reviewed_by = p_actor_id, reviewed_at = TIMEZONE('utc', NOW()), updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_wdr.id;

        INSERT INTO public.financial_audit_logs (wallet_id, withdrawal_id, actor_id, action, amount, details)
        VALUES (v_wallet.id, v_wdr.id, p_actor_id, 'WITHDRAWAL_APPROVED', v_wdr.amount, jsonb_build_object('withdrawal_code', v_wdr.withdrawal_code));

        RETURN jsonb_build_object('success', true, 'status', 'approved');

    -- ACTION: MARK PROCESSING
    ELSIF p_action = 'mark_processing' THEN
        IF v_wdr.status NOT IN ('pending', 'approved') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Request must be pending or approved to mark processing (current: ' || v_wdr.status || ').');
        END IF;

        UPDATE public.withdrawals
        SET status = 'processing', reviewed_by = p_actor_id, reviewed_at = TIMEZONE('utc', NOW()), updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_wdr.id;

        INSERT INTO public.financial_audit_logs (wallet_id, withdrawal_id, actor_id, action, amount, details)
        VALUES (v_wallet.id, v_wdr.id, p_actor_id, 'WITHDRAWAL_PROCESSING', v_wdr.amount, jsonb_build_object('withdrawal_code', v_wdr.withdrawal_code));

        RETURN jsonb_build_object('success', true, 'status', 'processing');

    -- ACTION: REJECT (Releases reserved funds back to available)
    ELSIF p_action = 'reject' THEN
        IF v_wdr.status NOT IN ('pending', 'approved', 'processing') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Cannot reject a withdrawal in status ' || v_wdr.status || '.');
        END IF;

        v_reason := p_params->>'rejection_reason';
        IF v_reason IS NULL OR LENGTH(TRIM(v_reason)) = 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Mandatory rejection reason required.');
        END IF;

        -- Release reserved balance back to available balance
        UPDATE public.wallets
        SET 
            available_balance = available_balance + v_wdr.amount,
            reserved_balance = GREATEST(0.00, reserved_balance - v_wdr.amount),
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_wallet.id;

        -- Update withdrawal record
        UPDATE public.withdrawals
        SET 
            status = 'rejected',
            rejection_reason = v_reason,
            reviewed_by = p_actor_id,
            reviewed_at = TIMEZONE('utc', NOW()),
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_wdr.id;

        -- Record ledger release entry
        v_ledger_code := public.generate_wallet_ledger_code();
        INSERT INTO public.wallet_ledger (
            ledger_code, wallet_id, user_id, transaction_type, amount, direction,
            balance_before, balance_after, reference_id, description, processed_by
        ) VALUES (
            v_ledger_code, v_wallet.id, v_wdr.user_id, 'withdrawal_release', v_wdr.amount, 'credit',
            v_wallet.available_balance, v_wallet.available_balance + v_wdr.amount,
            v_wdr.withdrawal_code, 'Funds released for rejected withdrawal ' || v_wdr.withdrawal_code || ': ' || v_reason,
            p_actor_id
        );

        INSERT INTO public.financial_audit_logs (wallet_id, withdrawal_id, actor_id, action, amount, details)
        VALUES (v_wallet.id, v_wdr.id, p_actor_id, 'WITHDRAWAL_REJECTED', v_wdr.amount, jsonb_build_object('reason', v_reason));

        RETURN jsonb_build_object('success', true, 'status', 'rejected');

    -- ACTION: CANCEL (Partner cancels own request)
    ELSIF p_action = 'cancel' THEN
        IF v_wdr.status != 'pending' THEN
            RETURN jsonb_build_object('success', false, 'error', 'Only pending requests can be cancelled.');
        END IF;

        -- Release reserved funds
        UPDATE public.wallets
        SET 
            available_balance = available_balance + v_wdr.amount,
            reserved_balance = GREATEST(0.00, reserved_balance - v_wdr.amount),
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_wallet.id;

        UPDATE public.withdrawals
        SET status = 'cancelled', updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_wdr.id;

        v_ledger_code := public.generate_wallet_ledger_code();
        INSERT INTO public.wallet_ledger (
            ledger_code, wallet_id, user_id, transaction_type, amount, direction,
            balance_before, balance_after, reference_id, description, processed_by
        ) VALUES (
            v_ledger_code, v_wallet.id, v_wdr.user_id, 'withdrawal_release', v_wdr.amount, 'credit',
            v_wallet.available_balance, v_wallet.available_balance + v_wdr.amount,
            v_wdr.withdrawal_code, 'Funds released upon cancellation of request ' || v_wdr.withdrawal_code,
            p_actor_id
        );

        INSERT INTO public.financial_audit_logs (wallet_id, withdrawal_id, actor_id, action, amount, details)
        VALUES (v_wallet.id, v_wdr.id, p_actor_id, 'WITHDRAWAL_CANCELLED', v_wdr.amount, jsonb_build_object('withdrawal_code', v_wdr.withdrawal_code));

        RETURN jsonb_build_object('success', true, 'status', 'cancelled');

    -- ACTION: MARK PAID (Debits reserved balance, creates linked payment record with unique UTR)
    ELSIF p_action = 'mark_paid' THEN
        IF v_wdr.status NOT IN ('pending', 'approved', 'processing') THEN
            RETURN jsonb_build_object('success', false, 'error', 'Withdrawal cannot be marked paid in status ' || v_wdr.status || '.');
        END IF;

        v_utr := p_params->>'payment_reference';
        IF v_utr IS NULL OR LENGTH(TRIM(v_utr)) = 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Payment Reference / UTR Number is mandatory.');
        END IF;

        -- Prevent duplicate UTR across platform (Module 7 & 11)
        IF EXISTS (SELECT 1 FROM public.payments WHERE payment_reference = TRIM(v_utr)) THEN
            RETURN jsonb_build_object('success', false, 'error', 'Payment Reference / UTR Number already exists in the system.');
        END IF;

        v_remarks := p_params->>'admin_remarks';
        v_proof_url := p_params->>'proof_url';
        v_pay_date := COALESCE((p_params->>'payment_date')::DATE, CURRENT_DATE);

        -- Debit reserved balance, increment total_withdrawn
        UPDATE public.wallets
        SET 
            reserved_balance = GREATEST(0.00, reserved_balance - v_wdr.amount),
            total_withdrawn = total_withdrawn + v_wdr.amount,
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_wallet.id;

        -- Update withdrawal record
        UPDATE public.withdrawals
        SET 
            status = 'paid',
            admin_remarks = v_remarks,
            reviewed_by = p_actor_id,
            reviewed_at = TIMEZONE('utc', NOW()),
            updated_at = TIMEZONE('utc', NOW())
        WHERE id = v_wdr.id;

        -- Insert Payment Record
        v_pay_code := public.generate_payment_code();
        INSERT INTO public.payments (
            payment_code, withdrawal_id, user_id, amount, payment_method,
            payment_reference, payment_date, status, proof_url, admin_remarks, processed_by
        ) VALUES (
            v_pay_code, v_wdr.id, v_wdr.user_id, v_wdr.amount, v_wdr.payment_method,
            TRIM(v_utr), v_pay_date, 'completed', v_proof_url, v_remarks, p_actor_id
        ) RETURNING id INTO v_pay_id;

        -- Insert Wallet Ledger payment entry
        v_ledger_code := public.generate_wallet_ledger_code();
        INSERT INTO public.wallet_ledger (
            ledger_code, wallet_id, user_id, transaction_type, amount, direction,
            balance_before, balance_after, reference_id, description, processed_by
        ) VALUES (
            v_ledger_code, v_wallet.id, v_wdr.user_id, 'withdrawal_payment', v_wdr.amount, 'debit',
            v_wallet.available_balance, v_wallet.available_balance,
            v_pay_code, 'Payout completed via ' || v_wdr.payment_method || ' (Ref: ' || TRIM(v_utr) || ')',
            p_actor_id
        );

        INSERT INTO public.financial_audit_logs (wallet_id, withdrawal_id, payment_id, actor_id, action, amount, details)
        VALUES (v_wallet.id, v_wdr.id, v_pay_id, p_actor_id, 'WITHDRAWAL_PAID', v_wdr.amount, 
            jsonb_build_object('payment_code', v_pay_code, 'payment_reference', v_utr));

        RETURN jsonb_build_object(
            'success', true, 
            'status', 'paid', 
            'payment_code', v_pay_code,
            'payment_reference', v_utr
        );
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Invalid action specified: ' || p_action);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

