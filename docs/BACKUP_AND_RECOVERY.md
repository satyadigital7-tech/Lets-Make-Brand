# Lets Make Brand (LMB) - Disaster Recovery, Backup & Storage Runbook

## 1. Overview & Service Level Objectives (SLO)

This document establishes the enterprise disaster recovery and backup operational procedures for the **Lets Make Brand (LMB) Partner & Brand Promotion Platform** running on **Supabase PostgreSQL 15+** and **Supabase Storage**.

| Objective | Target | Description |
| :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | **< 1 Hour** | Maximum acceptable data loss window during a severe incident. |
| **RTO (Recovery Time Objective)** | **< 30 Minutes** | Maximum allowable downtime before full service restoration. |
| **Storage RPO** | **< 4 Hours** | Maximum sync latency for KYC documents and support attachments. |
| **Backup Retention** | **30 Days / 12 Months** | 30 days daily snapshots, 12 monthly immutable compliance archives. |

---

## 2. PostgreSQL Database Backup Procedures

### 2.1 Automated Continuous Backups (Supabase WAL-G)
- **Point-in-Time Recovery (PITR):** Supabase continuous write-ahead log (WAL) archiving allows restoring the PostgreSQL cluster to any precise second within the retention window.
- **Automated Snapshots:** Nightly physical snapshots captured automatically at `02:00 UTC`.

### 2.2 Manual Logical Backups via `pg_dump`
To create an offline encrypted SQL dump before major schema migrations or production releases:

```bash
# 1. Export database credentials
export DB_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# 2. Execute pg_dump with custom compression format
pg_dump \
  --dbname="$DB_URL" \
  --format=custom \
  --file="lmb_backup_$(date +%Y%m%d_%H%M%S).dump" \
  --no-owner \
  --no-privileges \
  --verbose

# 3. Generate SHA-256 Checksum for tamper verification
sha256sum lmb_backup_*.dump > lmb_backup_checksum.txt
```

---

## 3. Storage Bucket Backup Procedures (Private Assets)

> [!WARNING]
> Standard database backups (`pg_dump`) **DO NOT** contain uploaded binary files from Supabase Storage buckets (`kyc-documents`, `support-attachments`). Storage buckets must be backed up independently.

### 3.1 Supabase Storage S3-Compatible Sync
Supabase Storage exposes an S3-compatible API. Automated cron jobs sync private buckets to encrypted cold storage (AWS S3 Glacier or GCP Cloud Storage):

```bash
# Set Supabase S3 endpoint and credentials
export AWS_ACCESS_KEY_ID="[SUPABASE_PROJECT_REF]"
export AWS_SECRET_ACCESS_KEY="[SUPABASE_SERVICE_ROLE_KEY]"
export AWS_ENDPOINT_URL="https://[PROJECT_REF].supabase.co/storage/v1/s3"

# Sync KYC documents to cold backup
aws s3 sync s3://kyc-documents s3://lmb-backup-vault/kyc-documents/ \
  --delete \
  --sse aws:kms

# Sync Support attachments to cold backup
aws s3 sync s3://support-attachments s3://lmb-backup-vault/support-attachments/ \
  --delete \
  --sse aws:kms
```

---

## 4. Disaster Recovery & Restoration Procedures

### 4.1 Restoring Database from Logical Dump
When restoring to a fresh or recovered Supabase project:

1. **Verify Checksum:**
   ```bash
   sha256sum -c lmb_backup_checksum.txt
   ```
2. **Execute `pg_restore`:**
   ```bash
   pg_restore \
     --dbname="$TARGET_DB_URL" \
     --clean \
     --if-exists \
     --no-owner \
     --no-privileges \
     --verbose "lmb_backup.dump"
   ```
3. **Execute Post-Restore Schema Verification:**
   ```bash
   node scripts/verify-supabase-connection.mjs
   ```

### 4.2 Storage Bucket Restoration
```bash
# Restore assets from cold backup back into Supabase Storage
aws s3 sync s3://lmb-backup-vault/kyc-documents/ s3://kyc-documents/ \
  --endpoint-url="https://[TARGET_PROJECT_REF].supabase.co/storage/v1/s3"
```

---

## 5. Post-Restoration Integrity Verification Checklist

- [ ] Execute `SELECT check_system_financial_integrity();` in PostgreSQL to confirm 0 negative wallet balances.
- [ ] Confirm RLS is enabled: `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`.
- [ ] Verify Supabase Auth user table mapping (`auth.users` -> `public.profiles`).
- [ ] Verify signed URL resolution for KYC documents: `/api/storage/kyc-documents/[path]`.
- [ ] Check API Health status: `curl https://letsmakebrand.co.in/api/health`.
