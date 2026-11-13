-- ==============================================================================
-- LMB PLATFORM: ALL-IN-ONE CONSOLIDATED MIGRATIONS (00001 through 00005)
-- Execute this script in Supabase SQL Editor or via psql CLI.
-- ==============================================================================

BEGIN;

-- Part 1: Initial Schema
\ir 00001_initial_schema.sql

-- Part 2: Initial Row Level Security Policies
\ir 00002_rls_policies.sql

-- Part 3: Seed Data
\ir 00003_seed_data.sql

-- Part 4: Phase 2 Organization & User Management Schema
\ir 00004_phase2_organization_schema.sql

-- Part 5: Phase 2 Row Level Security Policies
\ir 00005_phase2_rls_policies.sql

-- Part 6: Phase 3 Campaigns and Leads Schema
\ir 00006_phase3_campaigns_and_leads.sql

-- Part 7: Phase 3 Row Level Security Policies
\ir 00007_phase3_rls_policies.sql

COMMIT;
