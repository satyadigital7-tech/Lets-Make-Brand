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

