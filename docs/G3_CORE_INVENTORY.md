# G3 — Production Source Inventory (partial: Core / shared target DB)

Date: 2026-11-08
Scope: Read-only metadata inspection of the production database used by `micro-business-suite` Vercel project (`ep-delicate-base-b31rx7ol`), which the owner has designated as the shared target DB.
Not in scope: Vercel env change, deploy, migration, data movement. No writes performed.

## Access
- Source: `DATABASE_URL` in `.env.local` (pooled host `ep-delicate-base-b31rx7ol-pooler...`, DB `neondb`, user `neondb_owner`).
- Mode: read-only SELECT on metadata + `pg_stat_user_tables`. No schema/data changes.

## Findings

### PostgreSQL version
- `PostgreSQL 18.6` (aarch64) — matches G2 target (18.6). No version mismatch vs rehearsal.

### Schemas
- `public`, `neon_auth`, `pg_catalog`, `information_schema`.
- `neon_auth` present (Neon-managed) — must be preserved; do not `DROP SCHEMA public CASCADE` blindly.

### Enums (public)
- **None.** No user-defined enums in `public`. (Core uses text/varchar for status-like fields, or enums elsewhere.)

### Tables (public): 54, all unprefixed (Core schema)
- Full list + row counts in § below. Only 5 tables have rows: `chart_of_accounts` (36), `companies` (3), `company_settings` (4), `services` (4), `users` (3). Everything else is 0 rows.
- **No `mbs_<module>_*` prefixed tables exist yet** in production. So the shared target DB currently has only Core (unprefixed) tables; module data is not present in this DB.

### Row counts (public)
| table | rows |
|---|---|
| accounts | 0 |
| activity_log | 0 |
| ai_alerts | 0 |
| assets | 0 |
| audit_logs | 0 |
| bank_accounts | 0 |
| bookings | 0 |
| branch_stock | 0 |
| branches | 0 |
| bridge_sync_log | 0 |
| categories | 0 |
| chart_of_accounts | 36 |
| ck_games | 0 |
| ck_sessions | 0 |
| ck_users | 0 |
| companies | 3 |
| company | 0 |
| company_module_settings | 0 |
| company_settings | 4 |
| contacts | 0 |
| document_patterns | 0 |
| expenses | 0 |
| fb_kots | 0 |
| fb_order_items | 0 |
| fb_orders | 0 |
| fb_tables | 0 |
| group_permissions | 0 |
| groups | 0 |
| integration_connections | 0 |
| invoice_items | 0 |
| invoices | 0 |
| journal_entries | 0 |
| loyalty_accounts | 0 |
| loyalty_transactions | 0 |
| payment_vouchers | 0 |
| payments | 0 |
| payroll_entries | 0 |
| product_categories | 0 |
| product_variants | 0 |
| products | 0 |
| promotions | 0 |
| quotation_items | 0 |
| quotations | 0 |
| receipts | 0 |
| recurring_invoice_items | 0 |
| recurring_invoices | 0 |
| reminders | 0 |
| services | 4 |
| subscription_events | 0 |
| subscription_invoices | 0 |
| user_groups | 0 |
| users | 3 |
| users_backup_1773898881424 | 0 |
| wht_records | 0 |

## Gap vs G3 full requirement (§6.3)

G3 requires production source inventory of **each of the 6 standalone modules** (Service, Retail, Rental, Pharmacy, Hotel, F&B): their own production DBs, table lists, enums, row counts, company mapping, and `store_settings` key inventory (§3.7).

**These are NOT accessible with current credentials.** The 6 modules are separate Vercel projects with their own `DATABASE_URL`s (per §2.1 local dev all point at `localhost:5432/menu_online`, but production URLs live in each module's Vercel project and are not present in this repository). Only the Core/shared target DB (`ep-delicate-base-b31rx7ol`) could be inspected.

### What is still needed from the owner to complete G3
1. Read-only connection (or run-and-paste results) for each module's production DB: `DATABASE_URL` (direct/non-pooled preferred) OR a read-only role.
2. Confirmation of each module's production `MBS_COMPANY_ID` (1/2/3/other) — §6.3 P3.
3. `SELECT DISTINCT key FROM store_settings` per module (§3.7) before designing backfill.
4. Confirmation whether production module DBs contain real customer data or are empty/scaffold (§6.3 P2/P5).

### Implications for G4 (production migration)
- Target shared DB has only Core tables (unprefixed) + no enums + `neon_auth`. Module prefixed tables do not exist yet → first deployment will `CREATE` them (no rename needed for an empty target, but **Core tables must not be touched**).
- Because Core tables are unprefixed and share names with module source tables (`users`, `categories`, `products`, `orders`, …), the migration must **never** run unprefixed module migrations on this DB. The prefixed migration set (G1b/G2) is required and was proven.
- `company_id` remap (§3.4/§5.4) likely not needed if target is empty and modules map to sample companies, but must be confirmed via G3 module inventory.

## Status
G3 **partial** (Core/shared target DB inventoried; 6 module source DBs not accessible). Awaiting owner to provide read-only access per the list above before G4.
No writes, env changes, or deploys performed.
