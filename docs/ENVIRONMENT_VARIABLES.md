# Lets Make Brand (LMB) - Environment Variables Specification

## 1. Overview & Security Mandate

This document specifies all environment variables used across local development, testing, preview, and production environments for the **Lets Make Brand (LMB)** platform.

> [!CAUTION]
> - Variables prefixed with `NEXT_PUBLIC_` are accessible on the client browser.
> - Variables without `NEXT_PUBLIC_` are strictly server-only runtime secrets.
> - **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to frontend components or public repositories.

---

## 2. Environment Variables Catalog

| Variable Name | Required | Scope | Description & Example Format |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Client & Server | The root HTTPS URL of your Supabase project.<br>`https://[project-ref].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Client & Server | The Supabase anonymous/publishable public key.<br>`sb_publishable_...` or JWT anon key. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Optional** | Client & Server | Alias for publishable key supported by newer Supabase projects.<br>`sb_publishable_...` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-Only (Secret) | High-privilege service-role key used for background routines and RLS bypass.<br>`eyJhbGciOiJIUzI1Ni...` |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Client & Server | Canonical root application URL used for email callbacks and tracking links.<br>Dev: `http://localhost:3000`<br>Prod: `https://letsmakebrand.co.in` |
| `NODE_ENV` | **Yes** | Server-Only | Node execution environment (`development`, `test`, `production`). |
| `RESEND_API_KEY` | Optional | Server-Only | Transactional email provider API key for out-of-band email notifications. |
| `SUPPORT_NOTIFICATION_EMAIL` | Optional | Server-Only | Staff email for escalation alerts (defaults to `support@letsmakebrand.co.in`). |

---

## 3. Template Configuration (`.env.example`)

```env
# Supabase Public Configuration (Accessible in browser and server)
NEXT_PUBLIC_SUPABASE_URL=https://placeholder-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_placeholder

# Supabase Server-Only Configuration (Never expose to client)
SUPABASE_SERVICE_ROLE_KEY=[SUPABASE_SERVICE_ROLE_SECRET_KEY]

# Application Settings
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```
