# Module Migration Runbook (shared PostgreSQL)

Applies to Core and the six modules that share one PostgreSQL database:
**Neon = Dev**, **Supabase = Production**.

Related: [SHARED_DB_DATA_PRESERVATION_PLAN.md](./SHARED_DB_DATA_PRESERVATION_PLAN.md) §4.4 (role/ownership),
§2.6.3 (failed migrations), [HANDOFF.md](./HANDOFF.md) §13.

> **Status:** written 2026-11-11 after the `mbs_retail_tenant_isolation` failure on Dev
> (`P3018 / 42501 must be owner of table mbs_retail_users`). It records the procedure that
> was verified to work end-to-end on all six modules.

---

## 0. Invariants (do not shortcut these)

1. **Ownership invariant** — every `mbs_<module>_*` table is owned by `mbs_<module>_migrator`,
   never by the database owner. DDL must run **as that role**.
2. **Runtime role is separate** — `mbs_<module>_app` gets DML only. It must never own a table.
3. **One transaction per migration** — the whole `migration.sql` either applies or does not.
4. **Ledger is recorded only after the SQL succeeded** — `prisma migrate resolve --applied`
   never comes first.
5. **Production requires a backup plus explicit owner approval.** Dev does not.

Check the current state at any time:

```sql
SELECT tableowner, count(*)
FROM pg_tables WHERE tablename LIKE 'mbs\_%'
GROUP BY 1 ORDER BY 1;

SELECT migration_name, finished_at IS NOT NULL AS applied, rolled_back_at IS NOT NULL AS rolled_back
FROM _prisma_migrations ORDER BY started_at;
```

`prisma migrate status` reporting *"The migrations from the database are not found locally"*
for other modules is **expected** — the ledger is shared and each repo only carries its own
folder. Do not try to "fix" that.

---

## 1. Find what is pending

```bash
cd <repo>
DIRECT_URL="$MIGRATOR_URL" DATABASE_URL="$POOLED_URL" npx prisma migrate status
```

Pending migrations must be applied in **folder-name order** (Prisma's order).

---

## 2. Preferred path: connect as the module migrator

If you hold `mbs_<module>_migrator` credentials for the target database:

```bash
DIRECT_URL="postgresql://mbs_<module>_migrator:<password>@<host>/<db>?sslmode=require" \
DATABASE_URL="$POOLED_URL" \
npx prisma migrate deploy
```

That is the whole procedure — `prisma migrate deploy` already runs one transaction per
migration and records the ledger itself. Then continue at **step 5**.

No migrator credential is stored anywhere in the repositories. Guess nothing: ask the owner.

---

## 3. Fallback path: temporary role hand-off

Use only when the migrator password is unavailable. The database owner cannot `SET ROLE` to a
module migrator by default (membership is granted with `ADMIN` but not `SET`/`INHERIT`), so
grant `SET` temporarily, run, then take it back.

```sql
-- once, as the database owner
GRANT mbs_<module>_migrator TO <db_owner> WITH SET TRUE, INHERIT FALSE;
```

Run the migration SQL as the migrator, inside one transaction:

```bash
psql "$MIGRATOR_URL" -v ON_ERROR_STOP=1 \
  -c "BEGIN" \
  -c "SET LOCAL ROLE mbs_<module>_migrator" \
  -f prisma/migrations/<migration_name>/migration.sql \
  -c "COMMIT"
```

`ON_ERROR_STOP=1` plus `BEGIN/COMMIT` in a single psql session means a failing statement aborts
the transaction. Nothing is half-applied.

Record the ledger **after** the commit succeeded:

```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="<owner approval text>" \
DIRECT_URL="$MIGRATOR_URL" DATABASE_URL="$POOLED_URL" \
npx prisma migrate resolve --applied <migration_name>
```

Take the temporary grant back:

```sql
REVOKE SET OPTION FOR mbs_<module>_migrator FROM <db_owner>;
```

`GRANT ... WITH SET TRUE, INHERIT FALSE` adds a second membership row; after the `REVOKE` it
remains as an all-false row. That is harmless. The original `ADMIN` membership is unchanged —
verify with:

```sql
SELECT r.rolname, am.admin_option, am.inherit_option, am.set_option
FROM pg_auth_members am
JOIN pg_roles r ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
WHERE m.rolname = current_user AND r.rolname LIKE 'mbs\_%';
```

Expected afterwards: `admin_option = t`, `inherit_option = f`, `set_option = f`, and
`SET ROLE mbs_<module>_migrator` answers `permission denied`.

---

## 4. Exercising `SET ROLE` is not the same as being the owner

`SET ROLE` changes the *current* role for that session, so `CREATE`/`ALTER` objects are owned by
the migrator and ownership checks pass. It does **not** change the connecting user in logs or in
`prisma`'s own connection. That is why the ledger step is run separately.

---

## 5. Grant the runtime role (easy to forget)

A table created by a migration gets **no** default privileges from the database owner, because
default ACLs are per creating role. Without this step the app starts failing with
`permission denied for table ...` while every health check still says `ok`.

```sql
BEGIN;
SET LOCAL ROLE mbs_<module>_migrator;
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables
           WHERE schemaname = 'public' AND tablename LIKE 'mbs_<module>\_%'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO mbs_<module>_app', t);
  END LOOP;
  FOR t IN SELECT sequencename FROM pg_sequences
           WHERE schemaname = 'public' AND sequencename LIKE 'mbs_<module>\_%'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO mbs_<module>_app', t);
  END LOOP;
END $$;
COMMIT;
```

Verify:

```sql
SELECT table_name, grantee, string_agg(DISTINCT privilege_type, ',' ORDER BY privilege_type)
FROM information_schema.role_table_grants
WHERE table_name LIKE 'mbs\_%\_shops' AND grantee LIKE 'mbs\_%\_app'
GROUP BY 1, 2 ORDER BY 1;
```

---

## 6. When a migration fails — stop, do not resolve

The rule from §2.6.3 stands:

1. **Stop.** Do not touch other modules.
2. **Capture** the migration name, `P3018`/SQLSTATE, and the exact failing statement.
3. **Inspect partial DDL** — Prisma wraps a migration in a transaction, so a clean failure leaves
   nothing behind; verify rather than assume.
4. **Report** to the owner with the error and the proposed fix.
5. **Never** run `prisma migrate resolve --rolled-back` or `--applied` on your own.
   A `rolled-back` row is a decision, not a cleanup step.

A failed run whose transaction rolled back means the ledger row is the only trace. Leave it and
ask.

---

## 7. Naming convention

Every migration folder must be prefixed with the module: `mbs_<module>_<what_it_does>`.

An unprefixed migration (for example `20261111052224_add_priority_to_maintenance`) still works,
but it breaks the ledger convention and cannot be filtered per module. If one slips in **before
Production**, rename the folder and update the Dev ledger row to match:

```sql
UPDATE _prisma_migrations
SET migration_name = 'mbs_<module>_<new_name>'
WHERE migration_name = '<old_name>';
```

The checksum is taken from the file contents, so a rename alone does not invalidate it.
After the rename, run `npx prisma migrate status` and expect no pending/failed lines.

---

## 8. Post-migration check

```bash
DIRECT_URL="$MIGRATOR_URL" DATABASE_URL="$POOLED_URL" npx prisma migrate status
```

Clean output means: no "not yet been applied", no "have failed", and `migrations found in
prisma/migrations` equals the module's applied rows.
