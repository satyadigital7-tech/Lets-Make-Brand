-- ==============================================================================
-- LMB Platform - Migration 00012: Phase 6 KYC Management & Generated Documents
-- ==============================================================================

-- 1. SEQUENCES & CODE GENERATORS (Module 1, 2, 3)
CREATE SEQUENCE IF NOT EXISTS public.kyc_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.doc_code_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_kyc_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.kyc_code_seq');
        new_code := 'LMB-KYC-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.kyc_records WHERE kyc_code = new_code) INTO is_taken;
        IF NOT is_taken THEN RETURN new_code; END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_doc_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.doc_code_seq');
        new_code := 'LMB-DOC-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.generated_documents WHERE doc_code = new_code) INTO is_taken;
        IF NOT is_taken THEN RETURN new_code; END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. KYC RECORDS TABLE (Module 1)
CREATE TABLE IF NOT EXISTS public.kyc_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kyc_code VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_role VARCHAR(30) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    pan_number_masked VARCHAR(20) NOT NULL,
    bank_account_holder VARCHAR(255) NOT NULL,
    bank_account_number_masked VARCHAR(50) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    bank_name VARCHAR(100),
    upi_id VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('not_submitted', 'pending', 'under_review', 'approved', 'rejected', 'resubmission_required')),
    rejection_reason TEXT,
    admin_remarks TEXT,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT unique_user_kyc UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_kyc_user ON public.kyc_records(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.kyc_records(status);
CREATE INDEX IF NOT EXISTS idx_kyc_code ON public.kyc_records(kyc_code);

-- 3. KYC DOCUMENTS TABLE (Module 1)
CREATE TABLE IF NOT EXISTS public.kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kyc_id UUID NOT NULL REFERENCES public.kyc_records(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('pan_card', 'address_proof', 'bank_proof', 'business_reg', 'other')),
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_kyc_docs_kyc_id ON public.kyc_documents(kyc_id);
CREATE INDEX IF NOT EXISTS idx_kyc_docs_user_id ON public.kyc_documents(user_id);

-- 4. DOCUMENT TEMPLATES TABLE (Module 3)
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_type VARCHAR(50) UNIQUE NOT NULL CHECK (template_type IN ('id_card_partner', 'id_card_vendor', 'offer_letter_partner', 'offer_letter_vendor')),
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL DEFAULT 'Lets Make Brand',
    company_address TEXT NOT NULL DEFAULT '123 Business Boulevard, Financial District, Cyber City, Bangalore, KA 560001',
    company_website VARCHAR(255) NOT NULL DEFAULT 'https://letsmakebrand.com',
    company_logo_url TEXT,
    signatory_name VARCHAR(255) NOT NULL DEFAULT 'Executive Director',
    signatory_title VARCHAR(255) NOT NULL DEFAULT 'Head of Brand Operations & Legal Compliance',
    signatory_signature_url TEXT,
    terms_content TEXT,
    commission_policy_ref TEXT,
    responsibilities TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- Seed Default Document Templates (Module 3)
INSERT INTO public.document_templates (
    template_type, title, terms_content, commission_policy_ref, responsibilities
) VALUES 
(
    'id_card_partner',
    'Official Partner Identity Card',
    'This credential identifies the cardholder as an authorized Promotional Affiliate of Lets Make Brand. Valid across India.',
    'Governed by the LMB Standard Affiliate Terms & Commission Schedule.',
    'Promoting verified campaigns, acquiring genuine user acquisitions, and maintaining compliance with LMB Advertising Guidelines.'
),
(
    'id_card_vendor',
    'Official Vendor Agency Identity Card',
    'This credential certifies the organization as an Accredited Promotional Agency Vendor under the Lets Make Brand Enterprise Network.',
    'Subject to the Master Agency Services Agreement and Enterprise Commission Split Rules.',
    'Deploying field marketing squads, ensuring promotional campaign integrity, and supervising registered team members.'
),
(
    'offer_letter_partner',
    'Independent Brand Promotion Partner Offer Letter',
    'We are delighted to engage you as an Independent Brand Promotion Partner with Lets Make Brand. This engagement is non-exclusive and performance-based. You will be compensated in accordance with verified lead conversions adhering strictly to our anti-fraud verification standard.',
    'Standard Commission Tier: Full platform affiliate rates as configured per campaign. Disbursements processed weekly to verified bank accounts.',
    '1. Disseminate assigned campaign assets via permitted promotional channels. 2. Solicit authentic customer inquiries without unsolicited messaging or spam. 3. Comply with all data privacy directives.'
),
(
    'offer_letter_vendor',
    'Accredited Agency Vendor Appointment Agreement',
    'Lets Make Brand proudly appoints your organization as an Authorized Corporate Promotion Vendor. You are authorized to onboard promotional squads, configure allowable commission splits within established platform caps, and execute enterprise marketing programs.',
    'Enterprise Vendor Split Policy: Vendors may configure squad revenue distributions not exceeding the platform maximum campaign cap.',
    '1. Manage squad member onboarding and compliance. 2. Review and verify team lead submissions before platform audit. 3. Maintain active commercial licensure and regulatory compliance.'
)
ON CONFLICT (template_type) DO NOTHING;

-- 5. GENERATED DOCUMENTS TABLE (Module 2, 3)
CREATE TABLE IF NOT EXISTS public.generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_code VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id_card', 'offer_letter')),
    title VARCHAR(255) NOT NULL,
    verification_reference VARCHAR(64) UNIQUE NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    generated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_gen_docs_user ON public.generated_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_verification ON public.generated_documents(verification_reference);
CREATE INDEX IF NOT EXISTS idx_gen_docs_type ON public.generated_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_gen_docs_code ON public.generated_documents(doc_code);
