-- ==============================================================================
-- LMB Platform - Migration 00006: Phase 3 Campaigns and Leads Schema
-- ==============================================================================

-- 1. UPDATE CAMPAIGNS STATUS CONSTRAINT & ADD PHASE 3 FIELDS
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_status_check 
    CHECK (status IN ('draft', 'pending_approval', 'active', 'paused', 'completed', 'archived'));

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS campaign_code VARCHAR(30) UNIQUE;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS dynamic_fields JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS max_payout DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_code ON public.campaigns(campaign_code);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_name ON public.campaigns(brand_name);

-- Sequences & function for unique Campaign ID (e.g. LMB-CMP-000001)
CREATE SEQUENCE IF NOT EXISTS public.campaign_id_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_campaign_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.campaign_id_seq');
        new_code := 'LMB-CMP-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.campaigns WHERE campaign_code = new_code) INTO is_taken;
        IF NOT is_taken THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Backfill existing campaigns with campaign_code if null
UPDATE public.campaigns 
SET campaign_code = 'LMB-CMP-' || LPAD(nextval('public.campaign_id_seq')::TEXT, 6, '0')
WHERE campaign_code IS NULL;

-- 2. CAMPAIGN ASSIGNMENTS TABLE (Module 2)
CREATE TABLE IF NOT EXISTS public.campaign_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    assigned_type VARCHAR(50) NOT NULL CHECK (assigned_type IN ('all_partners', 'partner', 'vendor', 'team', 'team_member')),
    partner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_campaign_assignments_campaign ON public.campaign_assignments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_type ON public.campaign_assignments(assigned_type);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_partner ON public.campaign_assignments(partner_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_vendor ON public.campaign_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_team ON public.campaign_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_member ON public.campaign_assignments(team_member_id);

-- 3. LEADS TABLE (Module 4, 5, 6, 7, 8)
CREATE SEQUENCE IF NOT EXISTS public.lead_id_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_lead_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.lead_id_seq');
        new_code := 'LMB-LED-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.leads WHERE lead_code = new_code) INTO is_taken;
        IF NOT is_taken THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_code VARCHAR(30) UNIQUE NOT NULL,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE RESTRICT,
    submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_mobile VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_location VARCHAR(255),
    address TEXT,
    additional_fields JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'under_verification', 'approved', 'rejected', 'correction_requested', 'duplicate')),
    rejection_reason TEXT,
    correction_notes TEXT,
    commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_of_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    consent_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_leads_lead_code ON public.leads(lead_code);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_submitted_by ON public.leads(submitted_by);
CREATE INDEX IF NOT EXISTS idx_leads_vendor_id ON public.leads(vendor_id);
CREATE INDEX IF NOT EXISTS idx_leads_team_id ON public.leads(team_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_customer_mobile ON public.leads(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_leads_customer_email ON public.leads(customer_email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. LEAD DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.lead_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    file_url TEXT NOT NULL,
    file_size BIGINT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_id ON public.lead_documents(lead_id);

-- 5. IMMUTABLE LEAD STATUS HISTORY TABLE (Module 10)
CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    action VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead ON public.lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_actor ON public.lead_status_history(actor_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_date ON public.lead_status_history(created_at DESC);

-- Prevent updating or deleting history records (Immutable ledger)
CREATE OR REPLACE FUNCTION public.prevent_lead_history_modifications()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'lead_status_history records are immutable audit entries and cannot be altered or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_lead_history ON public.lead_status_history;
CREATE TRIGGER trg_immutable_lead_history
    BEFORE UPDATE OR DELETE ON public.lead_status_history
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_lead_history_modifications();

-- 6. DUPLICATE DETECTION CHECKS TABLE (Module 7)
CREATE TABLE IF NOT EXISTS public.lead_duplicate_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    normalized_mobile VARCHAR(50) NOT NULL,
    normalized_email VARCHAR(255) NOT NULL,
    match_type VARCHAR(50) NOT NULL CHECK (match_type IN ('mobile_match', 'email_match', 'both_match', 'campaign_identifier_match')),
    matched_existing_lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    is_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_lead_dup_campaign_mobile ON public.lead_duplicate_checks(campaign_id, normalized_mobile);
CREATE INDEX IF NOT EXISTS idx_lead_dup_campaign_email ON public.lead_duplicate_checks(campaign_id, normalized_email);
CREATE INDEX IF NOT EXISTS idx_lead_dup_lead ON public.lead_duplicate_checks(lead_id);

-- 7. NOTIFICATIONS TABLE (Module 11)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

