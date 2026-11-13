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
