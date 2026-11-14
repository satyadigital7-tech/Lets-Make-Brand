-- ==============================================================================
-- MIGRATION: FIX APPROVAL QUEUE VISIBILITY, RLS RECURSION, & SUPER ADMIN
-- Run this directly in the Supabase SQL Editor if needed
-- ==============================================================================

-- 1. SECURITY DEFINER FUNCTIONS TO PREVENT RLS RECURSION (ERROR 42P17)
CREATE OR REPLACE FUNCTION public.is_team_member(check_team_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = check_team_id
      AND member_id = check_user_id
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_vendor(check_team_id UUID, check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = check_team_id
      AND vendor_id = check_user_id
  );
$$;

-- 2. FIX RECURSIVE POLICIES ON TEAMS AND TEAM_MEMBERS
DROP POLICY IF EXISTS "Team Members view their team" ON public.teams;
DROP POLICY IF EXISTS "Vendors manage members in own teams" ON public.team_members;
DROP POLICY IF EXISTS "Vendors can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view own team" ON public.teams;
DROP POLICY IF EXISTS "Vendors view own teams" ON public.teams;

-- Recreate non-recursive policies on teams
CREATE POLICY "Vendors view own teams"
ON public.teams FOR ALL
TO authenticated
USING (
  vendor_id = auth.uid() OR
  public.is_super_admin(auth.uid()) OR
  public.has_permission(auth.uid(), 'view_vendors')
);

CREATE POLICY "Team Members view their team"
ON public.teams FOR SELECT
TO authenticated
USING (
  public.is_team_member(id, auth.uid())
);

-- Recreate non-recursive policies on team_members
CREATE POLICY "Vendors manage members in own teams"
ON public.team_members FOR ALL
TO authenticated
USING (
  public.is_team_vendor(team_id, auth.uid()) OR
  public.is_super_admin(auth.uid()) OR
  public.has_permission(auth.uid(), 'manage_vendors')
);

CREATE POLICY "Members view own membership"
ON public.team_members FOR SELECT
TO authenticated
USING (
  member_id = auth.uid()
);

-- 3. ENSURE SUPER ADMIN USER HAS SUPER_ADMIN ROLE IN DATABASE
DO $$
DECLARE
  v_admin_uid UUID;
  v_super_admin_role_id UUID;
BEGIN
  SELECT id INTO v_super_admin_role_id FROM public.roles WHERE code = 'super_admin' LIMIT 1;
  
  SELECT id INTO v_admin_uid FROM auth.users WHERE email = 'admin@letsmakebrand.co.in' LIMIT 1;
  IF v_admin_uid IS NULL THEN
    SELECT id INTO v_admin_uid FROM public.profiles WHERE email = 'admin@letsmakebrand.co.in' LIMIT 1;
  END IF;

  IF v_admin_uid IS NOT NULL AND v_super_admin_role_id IS NOT NULL THEN
    UPDATE public.profiles
    SET status = 'active', full_name = 'Platform Super Admin'
    WHERE id = v_admin_uid;

    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (v_admin_uid, v_super_admin_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
END $$;

-- 4. UPDATE handle_new_auth_user() TO AUTOMATICALLY ASSIGN SUPER_ADMIN TO admin@letsmakebrand.co.in
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
    initial_status VARCHAR(50);
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

    IF LOWER(NEW.email) = 'admin@letsmakebrand.co.in' THEN
        requested_role := 'super_admin';
        initial_status := 'active';
        user_full_name := COALESCE(NULLIF(user_full_name, ''), 'Platform Super Admin');
    ELSE
        requested_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'independent_partner'));
        initial_status := 'pending_approval';

        IF requested_role NOT IN ('vendor', 'independent_partner') THEN
            requested_role := 'independent_partner';
        END IF;
    END IF;

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
        initial_status
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
        business_name = CASE WHEN profiles.business_name IS NULL OR profiles.business_name = '' THEN EXCLUDED.business_name ELSE profiles.business_name END,
        mobile = CASE WHEN profiles.mobile IS NULL OR profiles.mobile = '' THEN EXCLUDED.mobile ELSE profiles.mobile END,
        updated_at = TIMEZONE('utc', NOW());

    SELECT id INTO target_role_id FROM public.roles WHERE code = requested_role LIMIT 1;
    IF target_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.id, target_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. PERFORMANCE INDEXES FOR APPROVAL QUEUE
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
