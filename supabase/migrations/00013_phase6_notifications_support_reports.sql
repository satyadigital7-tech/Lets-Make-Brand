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
