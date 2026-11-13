# Lets Make Brand (LMB) - Production Deployment Guide

## 1. Production Architecture Overview

- **Production Domain:** `letsmakebrand.co.in`
- **Application Hosting:** Vercel (Next.js 16+ App Router, Node.js / Edge Runtime)
- **Database:** Supabase PostgreSQL 15+ (`https://nircczkfagypcxxxltso.supabase.co`)
- **Authentication:** Supabase Auth (JWT, Cookie session refresh, RLS session integration)
- **Storage:** Supabase Storage (Private buckets: `kyc-documents`, `support-attachments`)
- **SSL / TLS:** Managed via Let's Encrypt / Vercel Edge Network

---

## 2. DNS & Custom Domain Configuration

In your DNS Registrar / Cloudflare DNS Manager for **`letsmakebrand.co.in`**:

| Type | Name / Host | Target / Value | TTL | Proxy Status |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (or `letsmakebrand.co.in`) | `76.76.21.21` | Auto / 3600 | DNS Only (or Proxied) |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 3600 | DNS Only (or Proxied) |

---

## 3. Vercel Environment Variables Configuration

Set these variables in **Vercel Dashboard → Project Settings → Environment Variables**:

| Variable Name | Environment | Value Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | `https://nircczkfagypcxxxltso.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | `sb_publishable_uCI3BLY5QdJwPsIzh0l9WA_naFuM82n` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production, Preview | `sb_publishable_uCI3BLY5QdJwPsIzh0l9WA_naFuM82n` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (Secret) | `[SUPABASE_SERVICE_ROLE_SECRET_KEY]` (Never expose to client!) |
| `NEXT_PUBLIC_SITE_URL` | Production | `https://letsmakebrand.co.in` |
| `NODE_ENV` | Production | `production` |

---

## 4. Supabase Auth Configuration

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL:** `https://letsmakebrand.co.in`
- **Redirect URLs:**
  - `https://letsmakebrand.co.in/**`
  - `https://letsmakebrand.co.in/auth/callback`
  - `https://letsmakebrand.co.in/reset-password`
  - `http://localhost:3000/**` (for local development)

---

## 5. Storage Buckets Configuration

In **Supabase Dashboard → Storage → Buckets**:

1. **`kyc-documents`**:
   - Public: **FALSE** (Strictly Private)
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
   - Max file size: 10MB
2. **`support-attachments`**:
   - Public: **FALSE** (Strictly Private)
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `text/plain`
   - Max file size: 10MB

---

## 6. Pre-Flight Production Checklist

- [x] All 15 database migrations executed via `supabase/migrations/apply_migrations.sql`.
- [x] Row Level Security (RLS) enabled on all 20+ tables.
- [x] All 573 automated regression assertions passing (`pnpm test`).
- [x] Full production build verified (`pnpm build`).
- [x] Health check endpoint active at `/api/health`.
- [x] HTTP Security headers enforced in `vercel.json`.
- [x] Financial ledger reconciliation engine operational.
