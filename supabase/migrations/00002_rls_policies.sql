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

