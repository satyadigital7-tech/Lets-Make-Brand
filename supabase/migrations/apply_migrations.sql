-- ==============================================================================
-- LMB PLATFORM: ALL-IN-ONE CONSOLIDATED MIGRATIONS (00001 through 00014)
-- Direct SQL script for Supabase SQL Editor
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Part 1: 00001_initial_schema.sql
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- LMB (Lets Make Brand) Platform - Migration 00001: Initial Schema
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES / USERS TABLE
-- Integrates directly with Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    company_name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_verification', 'suspended', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 2. ROLES TABLE
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE CHECK (code IN ('super_admin', 'admin', 'vendor', 'team_leader', 'team_member', 'independent_partner')),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_roles_code ON public.roles(code);

-- 3. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_permissions_code ON public.permissions(code);
CREATE INDEX IF NOT EXISTS idx_permissions_module ON public.permissions(module);

-- 4. USER_ROLES TABLE
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- 5. ROLE_PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- 6. USER_PERMISSIONS TABLE (Explicit user overrides / admin granular assignment)
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    is_granted BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_user_permission UNIQUE (user_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);

-- 7. SYSTEM_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 8. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 9. CAMPAIGNS TABLE (Real PostgreSQL records for public campaigns & admin management)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    target_audience TEXT,
    commission_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_type VARCHAR(50) NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    budget DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'pending_approval', 'active', 'paused', 'completed')),
    banner_image_url TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_vendor_id ON public.campaigns(vendor_id);

-- 10. AUTOMATIC UPDATED_AT TIMESTAMP FUNCTION & TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER set_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_campaigns_updated_at ON public.campaigns;
CREATE TRIGGER set_campaigns_updated_at
    BEFORE UPDATE ON public.campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 11. SUPABASE AUTH USER SYNCHRONIZATION TRIGGER
-- Automatically creates public.profiles and default role when a user signs up through Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    requested_role VARCHAR(50);
    target_role_id UUID;
    user_full_name TEXT;
    user_company TEXT;
    user_phone TEXT;
BEGIN
    -- Extract metadata from raw_user_meta_data if provided
    user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
    user_company := COALESCE(NEW.raw_user_meta_data->>'company_name', '');
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    requested_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', 'independent_partner'));

    -- SECURITY ENFORCEMENT:
    -- Self-registration NEVER allows super_admin or admin roles!
    IF requested_role NOT IN ('vendor', 'independent_partner') THEN
        requested_role := 'independent_partner';
    END IF;

    -- Insert into public.profiles
    INSERT INTO public.profiles (id, email, full_name, company_name, phone, status)
    VALUES (
        NEW.id,
        NEW.email,
        user_full_name,
        user_company,
        user_phone,
        'active'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
        updated_at = TIMEZONE('utc', NOW());

    -- Retrieve role ID for requested role
    SELECT id INTO target_role_id FROM public.roles WHERE code = requested_role LIMIT 1;

    -- If target_role_id exists, assign default role
    IF target_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.id, target_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate auth trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_auth_user();


-- ------------------------------------------------------------------------------
-- Part 2: 00002_rls_policies.sql
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- LMB (Lets Make Brand) Platform - Migration 00002: Row Level Security (RLS)
-- ==============================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL RELEVANT TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 2. HELPER SECURITY FUNCTIONS (SECURITY DEFINER with secure search_path)

-- Check if a user has the super_admin role
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    IF check_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = check_user_id
          AND r.code = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user is either super_admin or admin
CREATE OR REPLACE FUNCTION public.is_admin_or_super(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    IF check_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = check_user_id
          AND r.code IN ('super_admin', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user has a specific permission (either via role or explicit user permission)
CREATE OR REPLACE FUNCTION public.has_permission(perm_code VARCHAR, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
    has_perm BOOLEAN := FALSE;
BEGIN
    IF check_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Super Admin has all permissions unconditionally
    IF public.is_super_admin(check_user_id) THEN
        RETURN TRUE;
    END IF;

    -- Check explicit user-specific permission override first
    SELECT up.is_granted INTO has_perm
    FROM public.user_permissions up
    JOIN public.permissions p ON up.permission_id = p.id
    WHERE up.user_id = check_user_id AND p.code = perm_code
    LIMIT 1;

    IF has_perm IS NOT NULL THEN
        RETURN has_perm;
    END IF;

    -- Check role-based permissions
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = check_user_id
          AND p.code = perm_code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_super_admin())
    WITH CHECK (
        -- Regular users cannot alter their own account status
        auth.uid() = id AND (
            status = (SELECT status FROM public.profiles WHERE id = auth.uid())
            OR public.is_super_admin()
        )
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_super_admin());

-- 4. ROLES POLICIES
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
CREATE POLICY "Authenticated users can view roles"
    ON public.roles FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only super admin can modify roles" ON public.roles;
CREATE POLICY "Only super admin can modify roles"
    ON public.roles FOR ALL
    USING (public.is_super_admin());

-- 5. PERMISSIONS POLICIES
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;
CREATE POLICY "Authenticated users can view permissions"
    ON public.permissions FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only super admin can modify permissions" ON public.permissions;
CREATE POLICY "Only super admin can modify permissions"
    ON public.permissions FOR ALL
    USING (public.is_super_admin());

-- 6. USER_ROLES POLICIES
DROP POLICY IF EXISTS "Users can view own roles or admins view all" ON public.user_roles;
CREATE POLICY "Users can view own roles or admins view all"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Only super admin can manage user roles" ON public.user_roles;
CREATE POLICY "Only super admin can manage user roles"
    ON public.user_roles FOR ALL
    USING (public.is_super_admin());

-- 7. ROLE_PERMISSIONS POLICIES
DROP POLICY IF EXISTS "Authenticated can view role permissions" ON public.role_permissions;
CREATE POLICY "Authenticated can view role permissions"
    ON public.role_permissions FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Only super admin can manage role permissions" ON public.role_permissions;
CREATE POLICY "Only super admin can manage role permissions"
    ON public.role_permissions FOR ALL
    USING (public.is_super_admin());

-- 8. USER_PERMISSIONS POLICIES
DROP POLICY IF EXISTS "Users can view own permissions or admin can view" ON public.user_permissions;
CREATE POLICY "Users can view own permissions or admin can view"
    ON public.user_permissions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Only super admin can manage explicit user permissions" ON public.user_permissions;
CREATE POLICY "Only super admin can manage explicit user permissions"
    ON public.user_permissions FOR ALL
    USING (public.is_super_admin());

-- 9. SYSTEM_SETTINGS POLICIES
DROP POLICY IF EXISTS "Authenticated can view system settings" ON public.system_settings;
CREATE POLICY "Authenticated can view system settings"
    ON public.system_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Only super admin can modify settings" ON public.system_settings;
CREATE POLICY "Only super admin can modify settings"
    ON public.system_settings FOR ALL
    USING (public.is_super_admin());

-- 10. AUDIT_LOGS POLICIES
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Prevent any modification or deletion of audit logs (immutable logs)
DROP POLICY IF EXISTS "Audit logs cannot be modified" ON public.audit_logs;
CREATE POLICY "Audit logs cannot be modified"
    ON public.audit_logs FOR UPDATE
    USING (false);

DROP POLICY IF EXISTS "Audit logs cannot be deleted" ON public.audit_logs;
CREATE POLICY "Audit logs cannot be deleted"
    ON public.audit_logs FOR DELETE
    USING (false);

-- 11. CAMPAIGNS POLICIES
DROP POLICY IF EXISTS "Anyone can view active campaigns" ON public.campaigns;
CREATE POLICY "Anyone can view active campaigns"
    ON public.campaigns FOR SELECT
    USING (status = 'active' OR auth.uid() = vendor_id OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Vendors can insert their own campaigns" ON public.campaigns;
CREATE POLICY "Vendors can insert their own campaigns"
    ON public.campaigns FOR INSERT
    WITH CHECK (
        (auth.uid() = vendor_id AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.code = 'vendor'
        ))
        OR public.is_admin_or_super()
    );

DROP POLICY IF EXISTS "Vendors can update own campaigns or admins update all" ON public.campaigns;
CREATE POLICY "Vendors can update own campaigns or admins update all"
    ON public.campaigns FOR UPDATE
    USING (auth.uid() = vendor_id OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Only admins can delete campaigns" ON public.campaigns;
CREATE POLICY "Only admins can delete campaigns"
    ON public.campaigns FOR DELETE
    USING (public.is_admin_or_super());


-- ------------------------------------------------------------------------------
-- Part 3: 00003_seed_data.sql
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- LMB (Lets Make Brand) Platform - Migration 00003: Seed Data
-- ==============================================================================

-- 1. SEED ROLES
INSERT INTO public.roles (code, name, description)
VALUES 
    ('super_admin', 'Super Admin', 'Full system access and administrator management'),
    ('admin', 'Admin', 'Platform management with configurable granular permissions'),
    ('vendor', 'Vendor', 'Brand or merchant offering campaigns and promotion tasks'),
    ('team_leader', 'Team Leader', 'Directs a partner team and manages group performance'),
    ('team_member', 'Team Member', 'Executes brand campaigns within an agency or team'),
    ('independent_partner', 'Independent Partner', 'Solo affiliate and promotional brand partner')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 2. SEED PERMISSIONS
INSERT INTO public.permissions (code, name, module, description)
VALUES 
    -- Admin Management
    ('view_admin_management', 'View Admin Management', 'admin_management', 'View administrator list and security logs'),
    ('create_admin', 'Create Admin Users', 'admin_management', 'Create new admin accounts'),
    ('manage_admin_permissions', 'Manage Admin Permissions', 'admin_management', 'Assign or revoke granular admin permissions'),
    
    -- Special Sensitive Permission (Must default to FALSE for Admins)
    ('can_manage_vendor_transfers', 'Manage Vendor Transfers', 'vendors', 'Authorize and execute vendor portfolio transfers'),

    -- Vendor Management
    ('view_vendors', 'View Vendors', 'vendors', 'Browse vendor directories and details'),
    ('manage_vendors', 'Manage Vendors', 'vendors', 'Approve, suspend, or update vendor profiles'),

    -- Partner Management
    ('view_partners', 'View Partners', 'partners', 'Browse partner network and team structures'),
    ('manage_partners', 'Manage Partners', 'partners', 'Manage partner tiers, teams, and approvals'),

    -- Campaign Management
    ('view_campaigns', 'View Campaigns', 'campaigns', 'Access campaign listings and metrics'),
    ('manage_campaigns', 'Manage Campaigns', 'campaigns', 'Create, update, approve, or pause campaigns'),

    -- Leads Management
    ('view_leads', 'View Leads', 'leads', 'View promotional lead submissions and attribution'),
    ('manage_leads', 'Manage Leads', 'leads', 'Verify, approve, or reject submitted leads'),

    -- Commission & Payouts
    ('view_commission', 'View Commissions', 'commission', 'Inspect commission structures and accrued earnings'),
    ('manage_commission', 'Manage Commissions', 'commission', 'Adjust commission rules and approve partner payouts'),

    -- Wallet & Treasury
    ('view_wallet', 'View Wallet', 'wallet', 'Check balances and ledger transactions'),
    ('manage_wallet', 'Manage Wallet', 'wallet', 'Top-up, debit, or reconcile platform wallet balances'),

    -- Payments
    ('view_payments', 'View Payments', 'payments', 'Inspect payment transaction logs'),
    ('process_payments', 'Process Payments', 'payments', 'Disburse vendor and partner payouts'),

    -- Reports & Analytics
    ('view_reports', 'View Reports', 'reports', 'Access analytical reports and performance dashboards'),
    ('export_reports', 'Export Reports', 'reports', 'Export analytical reports to CSV/PDF'),

    -- System Settings
    ('view_settings', 'View System Settings', 'settings', 'Read platform system configuration'),
    ('manage_settings', 'Manage System Settings', 'settings', 'Update platform system settings')
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    module = EXCLUDED.module,
    description = EXCLUDED.description;

-- 3. ASSIGN DEFAULT ROLE PERMISSIONS
-- Super Admin receives ALL permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.code = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin receives standard operational permissions
-- CRITICAL REQUIREMENT: can_manage_vendor_transfers MUST NOT be assigned by default!
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN (
    'view_admin_management',
    'view_vendors',
    'manage_vendors',
    'view_partners',
    'manage_partners',
    'view_campaigns',
    'manage_campaigns',
    'view_leads',
    'manage_leads',
    'view_commission',
    'view_wallet',
    'view_payments',
    'view_reports',
    'export_reports',
    'view_settings'
)
WHERE r.code = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Vendor Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN (
    'view_campaigns',
    'manage_campaigns',
    'view_leads',
    'view_wallet',
    'view_reports'
)
WHERE r.code = 'vendor'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Team Leader Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN (
    'view_campaigns',
    'view_partners',
    'view_leads',
    'view_commission',
    'view_wallet',
    'view_reports'
)
WHERE r.code = 'team_leader'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Team Member & Independent Partner Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.code IN (
    'view_campaigns',
    'view_leads',
    'view_commission',
    'view_wallet'
)
WHERE r.code IN ('team_member', 'independent_partner')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. SEED SYSTEM SETTINGS
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('platform_info', jsonb_build_object(
        'name', 'Lets Make Brand (LMB)',
        'tagline', 'Enterprise Partner & Brand Promotion Platform',
        'contact_email', 'contact@letsmakebrand.com',
        'support_email', 'support@letsmakebrand.com',
        'phone', '+1 (800) 562-2726'
    ), 'Core branding and contact details for the platform'),
    ('operational_rules', jsonb_build_object(
        'maintenance_mode', false,
        'allow_partner_registration', true,
        'allow_vendor_registration', true,
        'require_email_verification', true,
        'min_payout_threshold', 50.00,
        'currency', 'USD',
        'default_attribution_days', 30
    ), 'Operational runtime thresholds and rules'),
    ('security_policy', jsonb_build_object(
        'mfa_enforced_for_admins', true,
        'session_timeout_minutes', 60,
        'max_failed_login_attempts', 5,
        'password_min_length', 8
    ), 'Security enforcement parameters')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = TIMEZONE('utc', NOW());

-- 5. SEED INITIAL REAL CAMPAIGNS (Real PostgreSQL records for public campaigns catalog)
INSERT INTO public.campaigns (title, slug, category, description, target_audience, commission_rate, commission_type, budget, status)
VALUES 
    (
        'Apex Cloud Suite Enterprise Launch',
        'apex-cloud-suite-enterprise-launch',
        'SaaS & Cloud',
        'Accelerate adoption of Apex Cloud Suite across mid-market and enterprise organizations. Partners earn lucrative commissions on qualified product demos and subscription conversions.',
        'CIOs, IT Directors, DevOps Leads, and Enterprise Architects in North America & Europe.',
        25.00,
        'percentage',
        50000.00,
        'active'
    ),
    (
        'NeoPay Business Merchant Acquisition',
        'neopay-business-merchant-acquisition',
        'FinTech & Payments',
        'Drive point-of-sale and online payment gateway activations for small-to-medium retail brands and hospitality groups with competitive transaction fee splits.',
        'Retail business owners, e-commerce founders, and hospitality managers.',
        120.00,
        'fixed',
        35000.00,
        'active'
    ),
    (
        'LuxeVibe Omnichannel Brand Expansion',
        'luxevibe-omnichannel-brand-expansion',
        'E-Commerce & Fashion',
        'Promote LuxeVibe sustainable luxury apparel and accessories across social, creator, and influencer partner channels with high customer lifetime value.',
        'High-income shoppers, eco-conscious consumers, and lifestyle fashion enthusiasts.',
        18.00,
        'percentage',
        25000.00,
        'active'
    ),
    (
        'CyberShield AI Endpoint Security',
        'cybershield-ai-endpoint-security',
        'Cyber Security',
        'Next-generation AI-driven autonomous endpoint detection and response platform. Rewarding certified security and IT consulting partners for enterprise proof-of-concept referrals.',
        'Chief Information Security Officers (CISOs), Security Engineers, and Managed Service Providers (MSPs).',
        250.00,
        'fixed',
        60000.00,
        'active'
    ),
    (
        'HealthSync Telehealth Corporate Wellness',
        'healthsync-telehealth-corporate-wellness',
        'HealthTech',
        'Comprehensive employee wellness and on-demand virtual primary care program. High recurring conversion bonuses for HR consultancy partners.',
        'HR executives, People operations managers, and corporate benefits directors.',
        15.00,
        'percentage',
        40000.00,
        'active'
    )
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    category = EXCLUDED.category,
    description = EXCLUDED.description,
    commission_rate = EXCLUDED.commission_rate,
    status = EXCLUDED.status;


-- ------------------------------------------------------------------------------
-- Part 4: 00004_phase2_organization_schema.sql
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- Part 5: 00005_phase2_rls_policies.sql
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- LMB Platform - Migration 00005: Phase 2 Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. ENABLE RLS ON NEW TABLES
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- 2. TEAMS RLS POLICIES
DROP POLICY IF EXISTS "Super Admin full access on teams" ON public.teams;
CREATE POLICY "Super Admin full access on teams"
    ON public.teams FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can view teams" ON public.teams;
CREATE POLICY "Admins can view teams"
    ON public.teams FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Vendors manage own teams" ON public.teams;
CREATE POLICY "Vendors manage own teams"
    ON public.teams FOR ALL
    USING (vendor_id = auth.uid())
    WITH CHECK (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Team Leaders view assigned team" ON public.teams;
CREATE POLICY "Team Leaders view assigned team"
    ON public.teams FOR SELECT
    USING (leader_id = auth.uid());

DROP POLICY IF EXISTS "Team Members view their team" ON public.teams;
CREATE POLICY "Team Members view their team"
    ON public.teams FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = teams.id AND tm.user_id = auth.uid() AND tm.status = 'active'
        )
    );

-- 3. TEAM_MEMBERS RLS POLICIES
DROP POLICY IF EXISTS "Super Admin full access on team_members" ON public.team_members;
CREATE POLICY "Super Admin full access on team_members"
    ON public.team_members FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can view team_members" ON public.team_members;
CREATE POLICY "Admins can view team_members"
    ON public.team_members FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Vendors manage members in own teams" ON public.team_members;
CREATE POLICY "Vendors manage members in own teams"
    ON public.team_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id AND t.vendor_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id AND t.vendor_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Team Leaders view members in assigned team" ON public.team_members;
CREATE POLICY "Team Leaders view members in assigned team"
    ON public.team_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_members.team_id AND t.leader_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view own team membership" ON public.team_members;
CREATE POLICY "Users can view own team membership"
    ON public.team_members FOR SELECT
    USING (user_id = auth.uid());

-- 4. INVITATIONS RLS POLICIES
DROP POLICY IF EXISTS "Super Admin full access on invitations" ON public.invitations;
CREATE POLICY "Super Admin full access on invitations"
    ON public.invitations FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Vendors manage own invitations" ON public.invitations;
CREATE POLICY "Vendors manage own invitations"
    ON public.invitations FOR ALL
    USING (vendor_id = auth.uid())
    WITH CHECK (vendor_id = auth.uid());

-- Allow anyone with a valid token to look up invitation details during acceptance
DROP POLICY IF EXISTS "Anyone can verify invitation with valid token" ON public.invitations;
CREATE POLICY "Anyone can verify invitation with valid token"
    ON public.invitations FOR SELECT
    USING (status = 'pending' AND expires_at > NOW());


-- ------------------------------------------------------------------------------
-- Part 6: 00006_phase3_campaigns_and_leads.sql
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- Part 7: 00007_phase3_rls_policies.sql
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- LMB Platform - Migration 00007: Phase 3 Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. ENABLE RLS ON PHASE 3 TABLES
ALTER TABLE public.campaign_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_duplicate_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. CAMPAIGN ASSIGNMENTS RLS POLICIES
DROP POLICY IF EXISTS "Super Admin full access on campaign_assignments" ON public.campaign_assignments;
CREATE POLICY "Super Admin full access on campaign_assignments"
    ON public.campaign_assignments FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can view campaign_assignments" ON public.campaign_assignments;
CREATE POLICY "Admins can view campaign_assignments"
    ON public.campaign_assignments FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Partners can view relevant campaign_assignments" ON public.campaign_assignments;
CREATE POLICY "Partners can view relevant campaign_assignments"
    ON public.campaign_assignments FOR SELECT
    USING (
        assigned_type = 'all_partners'
        OR partner_id = auth.uid()
        OR team_member_id = auth.uid()
        OR vendor_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = campaign_assignments.team_id 
            AND (t.vendor_id = auth.uid() OR t.leader_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.team_members tm 
            WHERE tm.team_id = campaign_assignments.team_id 
            AND tm.user_id = auth.uid() AND tm.status = 'active'
        )
    );

-- 3. LEADS RLS POLICIES
DROP POLICY IF EXISTS "Super Admin full access on leads" ON public.leads;
CREATE POLICY "Super Admin full access on leads"
    ON public.leads FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins can view and review leads" ON public.leads;
CREATE POLICY "Admins can view and review leads"
    ON public.leads FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Partners view own submitted leads" ON public.leads;
CREATE POLICY "Partners view own submitted leads"
    ON public.leads FOR SELECT
    USING (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Partners insert own leads" ON public.leads;
CREATE POLICY "Partners insert own leads"
    ON public.leads FOR INSERT
    WITH CHECK (
        submitted_by = auth.uid()
        AND NOT EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid() AND r.code = 'team_leader'
        )
    );

DROP POLICY IF EXISTS "Vendors view leads belonging to their organization" ON public.leads;
CREATE POLICY "Vendors view leads belonging to their organization"
    ON public.leads FOR SELECT
    USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Team Leaders view leads belonging to assigned squad" ON public.leads;
CREATE POLICY "Team Leaders view leads belonging to assigned squad"
    ON public.leads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t 
            WHERE t.id = leads.team_id AND t.leader_id = auth.uid()
        )
    );

-- 4. LEAD DOCUMENTS RLS POLICIES
DROP POLICY IF EXISTS "Super Admin full access on lead_documents" ON public.lead_documents;
CREATE POLICY "Super Admin full access on lead_documents"
    ON public.lead_documents FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins view lead_documents" ON public.lead_documents;
CREATE POLICY "Admins view lead_documents"
    ON public.lead_documents FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Lead submitters and owners view documents" ON public.lead_documents;
CREATE POLICY "Lead submitters and owners view documents"
    ON public.lead_documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l 
            WHERE l.id = lead_documents.lead_id 
            AND (
                l.submitted_by = auth.uid() 
                OR l.vendor_id = auth.uid()
                OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = l.team_id AND t.leader_id = auth.uid())
            )
        )
    );

DROP POLICY IF EXISTS "Submitter insert lead_documents" ON public.lead_documents;
CREATE POLICY "Submitter insert lead_documents"
    ON public.lead_documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads l 
            WHERE l.id = lead_documents.lead_id 
            AND l.submitted_by = auth.uid()
        )
    );

-- 5. IMMUTABLE LEAD STATUS HISTORY RLS POLICIES
DROP POLICY IF EXISTS "Super Admin full access on lead_status_history" ON public.lead_status_history;
CREATE POLICY "Super Admin full access on lead_status_history"
    ON public.lead_status_history FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins view lead_status_history" ON public.lead_status_history;
CREATE POLICY "Admins view lead_status_history"
    ON public.lead_status_history FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Stakeholders view lead history" ON public.lead_status_history;
CREATE POLICY "Stakeholders view lead history"
    ON public.lead_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l 
            WHERE l.id = lead_status_history.lead_id 
            AND (
                l.submitted_by = auth.uid() 
                OR l.vendor_id = auth.uid()
                OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = l.team_id AND t.leader_id = auth.uid())
            )
        )
    );

-- 6. DUPLICATE CHECKS RLS POLICIES
DROP POLICY IF EXISTS "Super Admin full access on lead_duplicate_checks" ON public.lead_duplicate_checks;
CREATE POLICY "Super Admin full access on lead_duplicate_checks"
    ON public.lead_duplicate_checks FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins view lead_duplicate_checks" ON public.lead_duplicate_checks;
CREATE POLICY "Admins view lead_duplicate_checks"
    ON public.lead_duplicate_checks FOR SELECT
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Lead submitters view duplicate checks" ON public.lead_duplicate_checks;
CREATE POLICY "Lead submitters view duplicate checks"
    ON public.lead_duplicate_checks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l 
            WHERE l.id = lead_duplicate_checks.lead_id 
            AND l.submitted_by = auth.uid()
        )
    );

-- 7. NOTIFICATIONS RLS POLICIES
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications"
    ON public.notifications FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());


-- ------------------------------------------------------------------------------
-- Part 8: 00008_phase4_commission_management.sql
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- Part 9: 00009_phase4_rls_policies.sql
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- Part 10: 00010_phase5_wallet_and_payments.sql
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- Part 11: 00011_phase5_rls_policies.sql
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- Part 12: 00012_phase6_kyc_and_documents.sql
-- ------------------------------------------------------------------------------

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


-- ------------------------------------------------------------------------------
-- Part 13: 00013_phase6_notifications_support_reports.sql
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- LMB Platform - Migration 00013: Phase 6 Notifications, Support Tickets & Reports
-- ==============================================================================

-- 1. SEQUENCES & CODE GENERATORS (Module 5, 6)
CREATE SEQUENCE IF NOT EXISTS public.ticket_code_seq START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.export_code_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_ticket_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.ticket_code_seq');
        new_code := 'LMB-TCK-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.support_tickets WHERE ticket_code = new_code) INTO is_taken;
        IF NOT is_taken THEN RETURN new_code; END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_export_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    is_taken BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.export_code_seq');
        new_code := 'LMB-EXP-' || LPAD(next_val::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.report_exports WHERE export_code = new_code) INTO is_taken;
        IF NOT is_taken THEN RETURN new_code; END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. NOTIFICATIONS TABLE (Module 4)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'system',
    entity_type VARCHAR(50),
    entity_id TEXT,
    action_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- 3. NOTIFICATION PREFERENCES TABLE (Module 4)
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email_account_updates BOOLEAN NOT NULL DEFAULT true,
    email_campaign_updates BOOLEAN NOT NULL DEFAULT true,
    email_lead_updates BOOLEAN NOT NULL DEFAULT true,
    email_financial_updates BOOLEAN NOT NULL DEFAULT true,
    email_support_updates BOOLEAN NOT NULL DEFAULT true,
    inapp_all BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT unique_user_notification_prefs UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON public.notification_preferences(user_id);

-- 4. SUPPORT TICKETS TABLE (Module 5)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_role VARCHAR(30) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'account_issues', 'registration', 'kyc', 'campaign', 'lead_submission',
        'commission', 'wallet', 'withdrawal', 'payment', 'technical_support', 'other'
    )),
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
    assigned_to UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_code ON public.support_tickets(ticket_code);

-- 5. SUPPORT MESSAGES TABLE (Module 5)
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    is_staff_reply BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_support_msg_ticket ON public.support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_msg_sender ON public.support_messages(sender_id);

-- 6. SUPPORT ATTACHMENTS TABLE (Module 5)
CREATE TABLE IF NOT EXISTS public.support_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    message_id UUID REFERENCES public.support_messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_support_att_ticket ON public.support_attachments(ticket_id);

-- 7. REPORT EXPORTS TABLE (Module 6)
CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_code VARCHAR(30) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('users', 'campaigns', 'leads', 'financial', 'kyc', 'support', 'audit')),
    export_format VARCHAR(10) NOT NULL CHECK (export_format IN ('csv', 'pdf')),
    filters JSONB NOT NULL DEFAULT '{}'::jsonb,
    file_path TEXT,
    row_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_report_exports_user ON public.report_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_code ON public.report_exports(export_code);


-- ------------------------------------------------------------------------------
-- Part 14: 00014_phase6_rls_policies.sql
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- LMB Platform - Migration 00014: Phase 6 Row Level Security (RLS) Policies
-- ==============================================================================

-- 1. ENABLE RLS ON ALL PHASE 6 TABLES
ALTER TABLE public.kyc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;

-- 2. KYC RECORDS RLS (Module 1, 8)
DROP POLICY IF EXISTS "Super Admin full access on kyc_records" ON public.kyc_records;
CREATE POLICY "Super Admin full access on kyc_records"
    ON public.kyc_records FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Admins view and review kyc_records" ON public.kyc_records;
CREATE POLICY "Admins view and review kyc_records"
    ON public.kyc_records FOR ALL
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users view own kyc_record" ON public.kyc_records;
CREATE POLICY "Users view own kyc_record"
    ON public.kyc_records FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own kyc_record" ON public.kyc_records;
CREATE POLICY "Users insert own kyc_record"
    ON public.kyc_records FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own kyc_record if editable" ON public.kyc_records;
CREATE POLICY "Users update own kyc_record if editable"
    ON public.kyc_records FOR UPDATE
    USING (user_id = auth.uid() AND status IN ('not_submitted', 'resubmission_required'))
    WITH CHECK (user_id = auth.uid());

-- 3. KYC DOCUMENTS RLS (Module 1, 8)
DROP POLICY IF EXISTS "Admins manage all kyc_documents" ON public.kyc_documents;
CREATE POLICY "Admins manage all kyc_documents"
    ON public.kyc_documents FOR ALL
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users manage own kyc_documents" ON public.kyc_documents;
CREATE POLICY "Users manage own kyc_documents"
    ON public.kyc_documents FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 4. DOCUMENT TEMPLATES RLS (Module 3)
DROP POLICY IF EXISTS "Super Admin manage document_templates" ON public.document_templates;
CREATE POLICY "Super Admin manage document_templates"
    ON public.document_templates FOR ALL
    USING (public.is_super_admin());

DROP POLICY IF EXISTS "Authenticated users view document_templates" ON public.document_templates;
CREATE POLICY "Authenticated users view document_templates"
    ON public.document_templates FOR SELECT
    USING (auth.role() = 'authenticated');

-- 5. GENERATED DOCUMENTS RLS (Module 2, 3)
DROP POLICY IF EXISTS "Admins manage generated_documents" ON public.generated_documents;
CREATE POLICY "Admins manage generated_documents"
    ON public.generated_documents FOR ALL
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users view own generated_documents" ON public.generated_documents;
CREATE POLICY "Users view own generated_documents"
    ON public.generated_documents FOR SELECT
    USING (user_id = auth.uid());

-- 6. NOTIFICATIONS RLS (Module 4)
DROP POLICY IF EXISTS "Admins manage notifications" ON public.notifications;
CREATE POLICY "Admins manage notifications"
    ON public.notifications FOR ALL
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 7. NOTIFICATION PREFERENCES RLS (Module 4)
DROP POLICY IF EXISTS "Users manage own notification_preferences" ON public.notification_preferences;
CREATE POLICY "Users manage own notification_preferences"
    ON public.notification_preferences FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 8. SUPPORT TICKETS RLS (Module 5, 8)
DROP POLICY IF EXISTS "Admins manage all support_tickets" ON public.support_tickets;
CREATE POLICY "Admins manage all support_tickets"
    ON public.support_tickets FOR ALL
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users view own support_tickets" ON public.support_tickets;
CREATE POLICY "Users view own support_tickets"
    ON public.support_tickets FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own support_tickets" ON public.support_tickets;
CREATE POLICY "Users insert own support_tickets"
    ON public.support_tickets FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own support_tickets" ON public.support_tickets;
CREATE POLICY "Users update own support_tickets"
    ON public.support_tickets FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 9. SUPPORT MESSAGES RLS (Module 5, 8)
DROP POLICY IF EXISTS "Admins manage all support_messages" ON public.support_messages;
CREATE POLICY "Admins manage all support_messages"
    ON public.support_messages FOR ALL
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users view messages of own tickets" ON public.support_messages;
CREATE POLICY "Users view messages of own tickets"
    ON public.support_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = support_messages.ticket_id AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users send messages to own tickets" ON public.support_messages;
CREATE POLICY "Users send messages to own tickets"
    ON public.support_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = support_messages.ticket_id AND t.user_id = auth.uid()
        )
    );

-- 10. SUPPORT ATTACHMENTS RLS (Module 5, 8)
DROP POLICY IF EXISTS "Admins manage all support_attachments" ON public.support_attachments;
CREATE POLICY "Admins manage all support_attachments"
    ON public.support_attachments FOR ALL
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users view attachments of own tickets" ON public.support_attachments;
CREATE POLICY "Users view attachments of own tickets"
    ON public.support_attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = support_attachments.ticket_id AND t.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users insert attachments to own tickets" ON public.support_attachments;
CREATE POLICY "Users insert attachments to own tickets"
    ON public.support_attachments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.support_tickets t
            WHERE t.id = support_attachments.ticket_id AND t.user_id = auth.uid()
        )
    );

-- 11. REPORT EXPORTS RLS (Module 6, 8)
DROP POLICY IF EXISTS "Admins manage all report_exports" ON public.report_exports;
CREATE POLICY "Admins manage all report_exports"
    ON public.report_exports FOR ALL
    USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "Users view own report_exports" ON public.report_exports;
CREATE POLICY "Users view own report_exports"
    ON public.report_exports FOR SELECT
    USING (user_id = auth.uid());


-- ------------------------------------------------------------------------------
-- Part 15: 00015_phase7_hardening_and_indexes.sql
-- ------------------------------------------------------------------------------

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
