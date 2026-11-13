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

