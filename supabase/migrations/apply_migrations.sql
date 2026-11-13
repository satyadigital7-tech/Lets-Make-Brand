-- ==============================================================================
-- LMB PLATFORM: ALL-IN-ONE CONSOLIDATED MIGRATIONS (00001 + 00002 + 00003)
-- Execute this entire script in Supabase SQL Editor or via psql CLI.
-- ==============================================================================

BEGIN;

-- Part 1: Schema
\ir 00001_initial_schema.sql

-- Part 2: Row Level Security Policies
\ir 00002_rls_policies.sql

-- Part 3: Seed Data
\ir 00003_seed_data.sql

COMMIT;

