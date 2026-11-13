-- ==============================================================================
-- LMB Platform - Migration 00004: Phase 2 Organization & User Management Schema
-- ==============================================================================

-- 1. UPDATE PROFILES TABLE STATUS CHECK CONSTRAINT
-- Allow pending_approval and rejected states
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('active', 'pending_approval', 'pending_verification', 'suspended', 'rejected', 'inactive'));

-- 2. EXTEND PROFILES TABLE WITH PHASE 2 ORGANIZATION FIELDS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vendor_id_code VARCHAR(30) UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS partner_id_code VARCHAR(30) UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS registration_type VARCHAR(50) DEFAULT 'independent' CHECK (registration_type IN ('independent', 'team_member'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS associated_vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_vendor_id_code ON public.profiles(vendor_id_code);
CREATE INDEX IF NOT EXISTS idx_profiles_partner_id_code ON public.profiles(partner_id_code);
CREATE INDEX IF NOT EXISTS idx_profiles_associated_vendor ON public.profiles(associated_vendor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_registration_type ON public.profiles(registration_type);

-- 3. SEQUENCES AND GENERATOR FUNCTIONS FOR UNIQUE SERVER-SIDE IDS
CREATE SEQUENCE IF NOT EXISTS public.vendor_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.partner_id_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.team_id_seq START WITH 1;

-- Function to safely generate unique Vendor ID: LMB-VEN-000001
CREATE OR REPLACE FUNCTION public.generate_vendor_id()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.vendor_id_seq');
        new_code := 'LMB-VEN-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE vendor_id_code = new_code) INTO is_taken;
        IF NOT is_taken THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to safely generate unique Partner ID: LMB-PAR-000001
CREATE OR REPLACE FUNCTION public.generate_partner_id()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.partner_id_seq');
        new_code := 'LMB-PAR-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE partner_id_code = new_code) INTO is_taken;
        IF NOT is_taken THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to safely generate unique Team ID: LMB-TEAM-000001
CREATE OR REPLACE FUNCTION public.generate_team_id()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.team_id_seq');
        new_code := 'LMB-TEAM-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.teams WHERE team_code = new_code) INTO is_taken;
        IF NOT is_taken THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. TEAMS TABLE (Belongs to exactly one Vendor)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_code VARCHAR(30) NOT NULL UNIQUE,
    vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_teams_vendor_id ON public.teams(vendor_id);
CREATE INDEX IF NOT EXISTS idx_teams_leader_id ON public.teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_code ON public.teams(team_code);
CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(status);

DROP TRIGGER IF EXISTS set_teams_updated_at ON public.teams;
CREATE TRIGGER set_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. TEAM_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_in_team VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role_in_team IN ('leader', 'member')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_team_user UNIQUE (team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);

DROP TRIGGER IF EXISTS set_team_members_updated_at ON public.team_members;
CREATE TRIGGER set_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. INVITATIONS TABLE (Secure Vendor Invitations)
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('team_leader', 'team_member')),
    token VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_vendor_id ON public.invitations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invitations_team_id ON public.invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

DROP TRIGGER IF EXISTS set_invitations_updated_at ON public.invitations;
CREATE TRIGGER set_invitations_updated_at
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. UPDATE SUPABASE AUTH USER TRIGGER FOR PHASE 2 (Default to pending_approval)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    requested_role VARCHAR(50);
    target_role_id UUID;
    user_full_name TEXT;
    user_business_name TEXT;
    user_mobile TEXT;
    user_address TEXT;
    user_city TEXT;
    user_state TEXT;
    user_pincode TEXT;
    user_photo TEXT;
    user_dob DATE;
    user_gender TEXT;
    user_referral TEXT;
    user_reg_type VARCHAR(50);
    user_vendor_assoc UUID;
BEGIN
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    user_business_name := COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'company_name', '');
    user_mobile := COALESCE(NEW.raw_user_meta_data->>'mobile', NEW.raw_user_meta_data->>'phone', '');
    user_address := COALESCE(NEW.raw_user_meta_data->>'address', '');
    user_city := COALESCE(NEW.raw_user_meta_data->>'city', '');
    user_state := COALESCE(NEW.raw_user_meta_data->>'state', '');
    user_pincode := COALESCE(NEW.raw_user_meta_data->>'pincode', '');
    user_photo := COALESCE(NEW.raw_user_meta_data->>'profile_photo_url', '');
    user_gender := COALESCE(NEW.raw_user_meta_data->>'gender', '');
    user_referral := COALESCE(NEW.raw_user_meta_data->>'referral_code', '');
    user_reg_type := COALESCE(NEW.raw_user_meta_data->>'registration_type', 'independent');
    
    IF NEW.raw_user_meta_data->>'dob' IS NOT NULL AND NEW.raw_user_meta_data->>'dob' <> '' THEN
        BEGIN
            user_dob := (NEW.raw_user_meta_data->>'dob')::DATE;
        EXCEPTION WHEN OTHERS THEN
            user_dob := NULL;
        END;
    END IF;

    IF NEW.raw_user_meta_data->>'associated_vendor_id' IS NOT NULL AND NEW.raw_user_meta_data->>'associated_vendor_id' <> '' THEN
        BEGIN
            user_vendor_assoc := (NEW.raw_user_meta_data->>'associated_vendor_id')::UUID;
        EXCEPTION WHEN OTHERS THEN
            user_vendor_assoc := NULL;
        END;
    END IF;

    requested_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'independent_partner'));

    -- SECURITY: Public self-registration only allows 'vendor' or 'independent_partner'
    -- Admin or Super Admin roles can never be self-assigned!
    IF requested_role NOT IN ('vendor', 'independent_partner') THEN
        requested_role := 'independent_partner';
    END IF;

    -- Insert profile with pending_approval status
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        company_name,
        business_name,
        phone,
        mobile,
        address,
        city,
        state,
        pincode,
        profile_photo_url,
        dob,
        gender,
        referral_code,
        registration_type,
        associated_vendor_id,
        status
    )
    VALUES (
        NEW.id,
        NEW.email,
        user_full_name,
        user_business_name,
        user_business_name,
        user_mobile,
        user_mobile,
        user_address,
        user_city,
        user_state,
        user_pincode,
        user_photo,
        user_dob,
        user_gender,
        user_referral,
        user_reg_type,
        user_vendor_assoc,
        'pending_approval' -- Set to pending_approval for Phase 2 requirement!
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
        business_name = CASE WHEN profiles.business_name IS NULL OR profiles.business_name = '' THEN EXCLUDED.business_name ELSE profiles.business_name END,
        mobile = CASE WHEN profiles.mobile IS NULL OR profiles.mobile = '' THEN EXCLUDED.mobile ELSE profiles.mobile END,
        updated_at = TIMEZONE('utc', NOW());

    -- Assign role
    SELECT id INTO target_role_id FROM public.roles WHERE code = requested_role LIMIT 1;
    IF target_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.id, target_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
