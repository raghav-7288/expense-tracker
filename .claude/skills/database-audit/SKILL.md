---
name: database-audit
description: Generate and run a full production-readiness audit of the Supabase/PostgreSQL database. Use when the user asks to audit the database, verify DB production-readiness, check RLS/indexes/constraints/data integrity, or run /database-audit. Produces numbered SQL queries the user runs in the Supabase SQL Editor, then analyzes the pasted results and gives a production-readiness verdict.
---

# Skill: Database Audit

> Reusable, schema-agnostic PostgreSQL/Supabase production-readiness audit for the expense-tracker database.
> Generates numbered SQL queries → user runs them in the Supabase SQL Editor → paste results → this skill analyzes everything and returns a graded verdict.

## Purpose

Inspect every important aspect of the database without making assumptions:

1. Schema Validation (tables, columns, types, nullability, defaults, PKs, FKs, unique & check constraints)
2. Relationships (FK integrity, orphaned records, invalid references)
3. Row Level Security (enabled tables, policies, missing/permissive policies)
4. Indexes (all indexes, unindexed FKs, duplicates)
5. Data Validation (duplicates, empty required fields, invalid states)
6. Business Logic (income/expense totals, loan math, category totals)
7. Security (RLS gaps, permissive policies, ownership, SECURITY DEFINER functions)
8. Performance (row counts, sizes, seq vs index scans, unused indexes, vacuum health)
9. Migration Verification (applied migrations, functions, triggers, feature-specific checks)

## Core Rules

- **Never assume the schema.** Always run Query 1.1 first and tailor Sections 5–6 and 9 to the tables that actually exist.
- **Never modify data during an audit.** All generated queries are read-only (`SELECT` / catalog reads). Fixes are proposed separately.
- Group queries into the 9 numbered sections. Every query includes: number, purpose, SQL, ✅ expected, 🚩 problem indicator, and a 📋 Results placeholder.
- Generate all queries first. Do **not** analyze until the user pastes results back.
- Classify every deviation by severity: 🔴 Critical → 🟠 High → 🟡 Medium → 🟢 Low/Informational.
- Distinguish real problems from **known false positives** (see "Known False Positives" below) so the same non-issues are not re-flagged each run.

## How To Invoke

The user says things like: "audit the database", "is my DB production-ready", "run a database audit", or `/database-audit`.

## Workflow

### Step 1 — Create the audit file
Write a fresh audit document at the repo root:

```
DATABASE_AUDIT_<YYYY-MM-DD>.md
```

Populate it with the header, legend, and all 9 sections of queries (templates below), each with an empty `📋 Results:` fenced block for the user to paste into. Pre-fill Query 1.1 if the table list is already known from context.

### Step 2 — Hand off
Tell the user to run each query in the Supabase SQL Editor and paste output into the matching Results block, then return.

### Step 3 — Adapt (no assumptions)
Once Query 1.1 results are in, regenerate Sections 5, 6, and 9 so they only reference tables/columns that actually exist. If a new feature table appears (e.g. a future `budgets` table), add matching integrity/business-logic checks.

### Step 4 — Analyze
When results are pasted, walk every query. For each, compare to ✅/🚩. Record findings with root cause + fix. Cross-check the "Known False Positives" list before flagging.

### Step 5 — Verdict
Append an **Analysis & Verdict** section with: severity-ranked findings, a per-section checklist, strengths, and a final PRODUCTION-READY / NOT-READY call. Apply safe repo-side fixes (e.g. add a migration for a missing index, renumber a colliding migration) and give copy-paste SQL for anything that must run in the live DB.

## Query Catalog (templates)

> These are the canonical queries. Regenerate them each run; adapt table/column names in Sections 5–6 & 9 to the live schema.

### Section 1 — Schema Validation
- **1.1 List tables:** `SELECT table_name, table_type FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;`
- **1.2 Columns/types/nullability/defaults:** `information_schema.columns` filtered to `public`, ordered by `table_name, ordinal_position`.
- **1.3 Primary keys:** join `table_constraints`/`key_column_usage` where `constraint_type='PRIMARY KEY'`.
- **1.4 Tables missing PKs:** left-join tables to PK constraints, keep `NULL`.
- **1.5 Foreign keys:** `table_constraints`+`key_column_usage`+`constraint_column_usage`+`referential_constraints` (⚠️ see False Positive #1 — this hides FKs to `auth.users`).
- **1.6 Unique constraints:** `constraint_type='UNIQUE'`, `string_agg` the columns.
- **1.7 Check constraints:** `SELECT conrelid::regclass, conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE contype='c' AND connamespace='public'::regnamespace;`

### Section 1.5b — Definitive FK check (ALWAYS include)
`information_schema` cannot see cross-schema FKs to `auth.users`. Use this catalog query to prove `user_id` FKs and their `ON DELETE` rules:

```sql
SELECT
  cl.relname AS table_name,
  att.attname AS column_name,
  fns.nspname || '.' || fcl.relname AS references_table,
  con.conname AS constraint_name,
  CASE con.confdeltype
    WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'   WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT' END AS on_delete
FROM pg_constraint con
JOIN pg_class cl      ON cl.oid  = con.conrelid
JOIN pg_namespace ns  ON ns.oid  = cl.relnamespace
JOIN pg_class fcl     ON fcl.oid = con.confrelid
JOIN pg_namespace fns ON fns.oid = fcl.relnamespace
JOIN unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k.attnum
WHERE con.contype = 'f' AND ns.nspname = 'public'
ORDER BY cl.relname, att.attname;
```
✅ Expected: every `user_id` (and `profiles.id`) → `auth.users` with `on_delete = CASCADE`; optional refs `SET NULL`.

### Section 2 — Relationships (orphan checks)
One query per user-owned table: `LEFT JOIN auth.users` (or parent table) and keep rows where the parent `id IS NULL`. Cover transactions, loans, accounts, profiles, category refs, account refs, and every junction table (e.g. `loan_transactions`).

### Section 3 — Row Level Security
- **3.1** `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname='public';`
- **3.2** same, `WHERE rowsecurity=false`.
- **3.3** full `pg_policies` inventory (roles, cmd, qual, with_check).
- **3.4** RLS-enabled tables with **zero** policies (left join `pg_policies`, `HAVING COUNT=0`).

### Section 4 — Indexes
- **4.1** full `pg_indexes` list.
- **4.2** FK columns with no covering index (FK constraints not matched in `pg_indexes.indexdef`).
- **4.3** duplicate/redundant indexes.

### Section 5 — Data Validation (adapt to live tables)
Duplicates (transactions by user+date+amount+notes; categories by user+name+type; accounts by user+name); empty required fields; invalid domain states (e.g. loans where `outstanding > principal`, settled-but-nonzero, `principal <= 0`); orphaned junction rows.

### Section 6 — Business Logic (adapt to live tables)
Income vs expense totals per user; loan summary per user (`total_lent/borrowed`, `outstanding_*`, active/settled counts); repayment reconciliation (`principal - outstanding` vs `SUM(repayment txns)`); category totals (categorized + uncategorized = total); every `lent`/`borrowed` transaction must have a `loan_transactions` link.

### Section 7 — Security
- **7.1** RLS status via `pg_class.relrowsecurity`.
- **7.2** permissive policies (`qual='true' OR with_check='true'`).
- **7.3** table ownership (`pg_tables.tableowner`).
- **7.4** functions & `security_type` from `information_schema.routines`.

### Section 8 — Performance
- **8.1** row counts + sizes from `pg_stat_user_tables` + `pg_size_pretty`.
- **8.2** seq vs index scans + `idx_scan_pct`.
- **8.3** unused indexes (`pg_stat_user_indexes.idx_scan=0`, exclude `%_pkey`).
- **8.4** vacuum health (`n_dead_tup`, `dead_pct`, `last_vacuum`, `last_autovacuum`).

### Section 9 — Migration Verification (adapt to live features)
- **9.1** `SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;` (may error if applied by hand — see False Positive #6).
- **9.2** functions present (`information_schema.routines`).
- **9.3** triggers present (`information_schema.triggers`).
- **9.4+** feature-specific constraint/table checks (e.g. `transactions_type_check` includes new enum values; feature tables have expected columns).

## Severity Rubric

- 🔴 **Critical (block launch):** table with no PK; RLS disabled on a user-data table; a policy with bare `qual='true'`; confirmed orphaned/corrupt data; a missing FK that allows real orphans.
- 🟠 **High (verify before launch):** ambiguous FK/`ON DELETE` behavior; a `user_id` FK that can't be confirmed present; a business-logic reconciliation mismatch.
- 🟡 **Medium (fix soon):** unindexed FK on a growth table; migration numbering collision; missing migration tracking; a check constraint that should exist but doesn't.
- 🟢 **Low/Informational:** dead tuples at tiny scale; "unused" indexes on a small/new DB; dropped-column ordinal gaps; intentional defaults; deployed-but-unused feature tables.

## Known False Positives (do NOT re-flag)

1. **Query 1.5 hides `auth.users` FKs.** `information_schema.constraint_column_usage` omits cross-schema refs to the `auth`-owned table. Always confirm with **Section 1.5b**; if those pass, the `user_id` FKs are fine.
2. **`merged_categories` is a VIEW** — no PK/RLS of its own; it inherits RLS from `system_categories`/`user_categories`. Absence from RLS/PK lists is expected.
3. **`transactions.category_id` legacy column + ordinal-position gap** — leftover from the system/user category split and the `description→notes` merge. Harmless.
4. **`create_default_categories` absent** — correct for the system/user category architecture (defaults are shared `system_categories` rows, not per-user copies).
5. **`pg_trgm` functions** (`gtrgm_*`, `gin_trgm_*`, `similarity*`, `word_similarity*`, `set_limit`, `show_*`) — from the trigram extension backing the notes search index. Expected `INVOKER` functions.
6. **Query 9.1 error `supabase_migrations.schema_migrations does not exist`** — means migrations were applied manually in the SQL editor, not via the CLI. Ops note, not a runtime defect.
7. **Signup triggers missing from Query 9.3** — `handle_new_user` lives on `auth.users` (auth schema); a `public`-filtered trigger query won't show it. Verify via `SELECT tgname FROM pg_trigger WHERE tgrelid='auth.users'::regclass;`
8. **"Unused" indexes / high dead-tuple % on a tiny DB** — Postgres favors seq scans at low row counts and autovacuum hasn't crossed thresholds. Not actionable at small scale.
9. **`rls_auto_enable` event-trigger function** — intentional safety net that auto-enables RLS on new tables. Keep it.

## Expected-Healthy Baseline (this project)

Use as the reference for "correct":
- Base tables: `profiles, system_categories, user_categories, user_hidden_categories, transactions, accounts, loans, loan_transactions` (+ `merged_categories` VIEW).
- RLS enabled on all base tables; per-user `auth.uid()` policies for SELECT/INSERT/UPDATE/DELETE; `system_categories` is SELECT-only.
- `transactions_type_check` = `income|expense|lent|borrowed`; category type checks = `income|expense` only.
- FKs: all `user_id`/`profiles.id` → `auth.users` **CASCADE**; category/account refs on transactions **SET NULL**; junction FKs **CASCADE**.
- Custom functions: `handle_new_user`, `update_updated_at`, `get_balance_summary`, `get_account_balances` (+ `rls_auto_enable`).

## Output / Reporting Format

Append to the audit file:
1. **Overall Verdict** (one line: PRODUCTION-READY ✅ / NOT-READY ❌ + why).
2. Findings grouped by severity, each with: what was seen → root cause → fix (SQL or migration).
3. **Section checklist** (9 items, checked).
4. **Strengths** worth calling out.
5. **Final Verdict** with the exact remaining actions.

Also apply safe repo-side fixes directly:
- Add a migration (e.g. `NNN_audit_followups.sql`) for missing indexes/constraints.
- Renumber colliding migration files.
- Provide copy-paste SQL for anything that must run in the live database (since migrations here are applied by hand).

## Guardrails

- Read-only queries only; never `UPDATE`/`DELETE`/`DROP` in an audit query.
- Do not guess a verdict before results are pasted.
- Do not re-flag Known False Positives.
- Keep the report structured, severity-ordered, and concise.
- Respect project rules: never touch `vercel.json`; put new migrations in `supabase/migrations/`.

## Customizing This Skill

Edit this file to:
- Add queries for new tables/features (extend Sections 5, 6, 9).
- Add project-specific false positives as the schema evolves.
- Tighten severity thresholds or coverage targets.
- Change the audit file naming or add an automated `psql`/CI runner.

