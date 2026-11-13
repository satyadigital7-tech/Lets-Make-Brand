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

