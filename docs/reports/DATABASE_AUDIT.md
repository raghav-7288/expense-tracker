# DATABASE_AUDIT.md — Expense Tracker

> Complete backend audit: schema, RLS, security, performance, and data integrity.  
> Performed July 26, 2026.

---

## Summary

| Metric | Value |
|--------|-------|
| Tables audited | 6 (profiles, system_categories, user_categories, user_hidden_categories, transactions, accounts) |
| Migrations reviewed | 7 |
| Services audited | 4 (transactions, accounts, categories, profiles) |
| Issues found | 14 |
| Issues fixed | 3 (safe, no schema changes) |
| Recommendations | 11 (require migration or architectural decisions) |

---

## Schema Review

### Tables

| Table | Rows (typical) | RLS | Indexes | Constraints |
|-------|---------------|-----|---------|-------------|
| `profiles` | 1 per user | ✅ CRUD user-scoped | 1 (email) | currency max 5 chars |
| `system_categories` | ~13 global | ✅ SELECT only (authenticated) | 0 (small table) | name max 100, hex color regex |
| `user_categories` | 0-50 per user | ✅ CRUD user-scoped | 3 (user_id, type, active partial) | name max 100, soft-delete |
| `user_hidden_categories` | 0-13 per user | ✅ SELECT/INSERT/DELETE | 0 (small table) | composite PK (user_id, category_id) |
| `transactions` | 10-10000+ per user | ✅ CRUD user-scoped | 7 (user_id, date, type, category FKs, account) | amount > 0, type CHECK, notes max 2000 |
| `accounts` | 0-10 per user | ✅ CRUD user-scoped | 2 (user_id, active partial) | type CHECK, name/color constraints |

### Relationships

```
profiles.id ← auth.users.id (trigger: handle_new_user)
transactions.user_id → profiles.id
transactions.system_category_id → system_categories.id
transactions.user_category_id → user_categories.id
transactions.account_id → accounts.id (ON DELETE SET NULL)
user_categories.user_id → profiles.id
user_hidden_categories.user_id → profiles.id
user_hidden_categories.category_id → system_categories.id
accounts.user_id → profiles.id
```

### Indexes (All Tables Combined)

| Index | Table | Columns | Type |
|-------|-------|---------|------|
| idx_profiles_email | profiles | email | B-tree |
| idx_categories_user_id | categories (legacy) | user_id | B-tree |
| idx_categories_type | categories (legacy) | type | B-tree |
| idx_transactions_user_id | transactions | user_id | B-tree |
| idx_transactions_user_date | transactions | user_id, date | Composite |
| idx_transactions_category | transactions | category_id | B-tree |
| idx_transactions_type | transactions | type | B-tree |
| idx_transactions_system_category | transactions | system_category_id | B-tree |
| idx_transactions_user_category | transactions | user_category_id | B-tree |
| idx_transactions_account | transactions | account_id | B-tree |
| idx_transactions_user_type_date | transactions | user_id, type, date | Composite |
| idx_user_categories_user_id | user_categories | user_id | B-tree |
| idx_user_categories_type | user_categories | type | B-tree |
| idx_user_categories_active | user_categories | user_id (WHERE deleted_at IS NULL) | Partial |
| idx_user_categories_active_type | user_categories | user_id, type (WHERE deleted_at IS NULL) | Partial composite |
| idx_accounts_user_id | accounts | user_id | B-tree |
| idx_accounts_user_active | accounts | user_id (WHERE is_active = true) | Partial |

### Constraints

| Table | Constraint | Type |
|-------|-----------|------|
| transactions | `amount > 0` | CHECK |
| transactions | `type IN ('income', 'expense')` | CHECK |
| transactions | `notes max 2000 chars` | CHECK (length) |
| profiles | `currency max 5 chars` | CHECK (length) |
| system_categories | `name max 100 chars` | CHECK |
| user_categories | `name max 100 chars` | CHECK |
| all color fields | `^#[0-9a-fA-F]{6}$` | CHECK (regex) |
| accounts | `type IN (checking, savings, ...)` | CHECK |

---

## RLS Policy Review

### ✅ All Policies Are User-Scoped

Every table uses `auth.uid() = user_id` (or `auth.uid() = id` for profiles) for all operations. No cross-user data access is possible.

### Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | ✅ own | ✅ own id | ✅ own | ✅ own |
| system_categories | ✅ authenticated | ❌ blocked | ❌ blocked | ❌ blocked |
| user_categories | ✅ own | ✅ own | ✅ own | ✅ own (soft) |
| user_hidden_categories | ✅ own | ✅ own | N/A | ✅ own |
| transactions | ✅ own | ✅ own | ✅ own | ✅ own |
| accounts | ✅ own | ✅ own | ✅ own | ✅ own |

### Security Assessment: **PASS**
- No service-role key exposed to client
- All writes go through RLS-protected PostgREST
- System categories are read-only (immutable)
- Soft-delete on user categories preserves referential integrity

---

## Issues Found

### Fixed (Safe Changes)

#### 1. `useRecentTransactions` — Fetches ALL Transactions Then Slices (Performance)

**File:** `src/hooks/useDashboard.ts`  
**Issue:** Called `getTransactions(user.id, { sort_by: 'date', sort_order: 'desc' })` without limit, returning the user's entire transaction history, then sliced to 5 in JavaScript.  
**Impact:** On a user with 5000 transactions, this fetches 5000 rows + joined categories just to show 5.  
**Fix:** Added `limit` parameter to `TransactionFilters` interface and applied `.limit(n)` in the PostgREST query. `useRecentTransactions(5)` now fetches exactly 5 rows server-side.

#### 2. `updateProfile` — No Field Whitelist (Security)

**File:** `src/services/profiles.ts`  
**Issue:** Passed the entire `UpdateProfileInput` object directly to Supabase `.update()`. If the type was widened or a caller passed extra fields, unexpected columns could be written.  
**Impact:** Low (TypeScript prevents this at compile time, RLS prevents unauthorized writes). Defense-in-depth fix.  
**Fix:** Explicitly whitelist `full_name`, `avatar_url`, `currency` before passing to update.

#### 3. Test Update — Mock Aligned with Server-Side Limit

**File:** `tests/hooks/useDashboard.test.tsx`  
**Issue:** Test expected client-side slicing; updated to verify server-side `limit` parameter is passed correctly.

---

### Recommendations (Require Migration or Architecture Decisions)

#### 4. `useDashboardStats` — Fetches Entire Transaction History (High Impact)

**File:** `src/hooks/useDashboard.ts` (lines 19-22)  
**Issue:** Calls `getTransactions(user.id)` without filters to compute all-time `totalBalance`. This loads ALL transactions with joined category data.  
**Recommendation:** Create a server-side function or view:
```sql
CREATE OR REPLACE FUNCTION get_balance_summary(uid UUID)
RETURNS TABLE(total_income DECIMAL, total_expenses DECIMAL, monthly_income DECIMAL, monthly_expenses DECIMAL)
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN type='income' THEN amount END), 0),
    COALESCE(SUM(CASE WHEN type='expense' THEN amount END), 0),
    COALESCE(SUM(CASE WHEN type='income' AND date >= date_trunc('month', NOW()) THEN amount END), 0),
    COALESCE(SUM(CASE WHEN type='expense' AND date >= date_trunc('month', NOW()) THEN amount END), 0)
  FROM transactions WHERE user_id = uid;
$$ LANGUAGE sql SECURITY DEFINER;
```

#### 5. `getAllAccountBalances` — N+1 Query & Race Condition (High Impact)

**File:** `src/services/accounts.ts` (lines 107-148)  
**Issue:** Fetches all accounts, then ALL user transactions, then groups in JavaScript. Between the two queries, new transactions could be inserted (stale balance).  
**Recommendation:** Replace with single aggregation query:
```sql
SELECT a.*, 
  COALESCE(SUM(CASE WHEN t.type='income' THEN t.amount END), 0) as total_income,
  COALESCE(SUM(CASE WHEN t.type='expense' THEN t.amount END), 0) as total_expenses
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id
WHERE a.user_id = $1 AND a.is_active = true
GROUP BY a.id
ORDER BY a.sort_order;
```

#### 6. Missing Trigram Index for ILIKE Search (Medium Impact)

**File:** `src/services/transactions.ts` (line 88)  
**Issue:** `query.ilike('notes', '%sanitized%')` performs a sequential scan on the `notes` column (up to 2000 chars per row) without a GIN trigram index.  
**Recommendation:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_transactions_notes_trgm ON transactions USING gin (notes gin_trgm_ops);
```

#### 7. `resolveCategoryColumns` — Sequential Queries Without Error Propagation (Medium)

**File:** `src/services/transactions.ts` (lines 128-146)  
**Issue:** Makes a query to `system_categories` to check if a category ID is system or user. If the query fails silently (network error), it defaults to `user_category_id` without validation.  
**Recommendation:** Add error handling:
```typescript
const { data: sysCat, error } = await supabase...
if (error) return { system_category_id: null, user_category_id: null, category_id: categoryId };
```

#### 8. CSV Import — No Duplicate Detection (Low Impact)

**File:** `src/components/transactions/CSVImportModal.tsx` (lines 187-208)  
**Issue:** Imports transactions sequentially without checking for duplicates. Re-importing the same CSV creates duplicate records.  
**Recommendation:** Add deduplication check (date + amount + notes hash) before insert, or mark imported batches with a `batch_id`.

#### 9. CSV Import — No Rate Limiting (Low Impact)

**File:** `src/components/transactions/CSVImportModal.tsx`  
**Issue:** Imports rows in a sequential loop without batch size limits. A 10,000-row CSV would make 10,000 individual INSERT requests.  
**Recommendation:** Batch inserts using `.insert([...rows])` (Supabase supports array inserts up to ~1000 rows per request).

#### 10. Missing Index: `transactions(user_id, account_id)` Composite

**Issue:** `getAllAccountBalances` filters by `user_id` and groups by `account_id`, but no composite index covers both efficiently.  
**Recommendation:**
```sql
CREATE INDEX idx_transactions_user_account ON transactions(user_id, account_id) WHERE account_id IS NOT NULL;
```

#### 11. `getMonthlyStats` — Returns Raw Rows Instead of Aggregation (Low Impact)

**File:** `src/services/transactions.ts` (lines 202-214)  
**Issue:** Fetches all transactions for a year and aggregates in JavaScript.  
**Recommendation:** Use SQL aggregation:
```sql
SELECT date_trunc('month', date) AS month, type, SUM(amount)
FROM transactions WHERE user_id = $1 AND date BETWEEN $2 AND $3
GROUP BY month, type;
```

#### 12. Orphaned Records — Legacy `categories` Table

**Issue:** Migration 002 created `system_categories` and `user_categories` but the legacy `categories` table still exists with data. Old FK from `transactions.category_id` was dropped in migration 004, but the table remains.  
**Recommendation:** Drop the legacy `categories` table in a future migration after verifying no queries reference it.

#### 13. Cache Invalidation — Analytics Query Key Scope

**File:** `src/lib/queryKeys.ts`  
**Issue:** `queryKeys.analytics.all` includes `userId` but transaction mutations invalidate with `['analytics'] as const` (no userId). This works because TanStack Query prefix-matches, but it's inconsistent.  
**Recommendation:** Standardize: mutations should invalidate `queryKeys.analytics.all(user?.id)`.

#### 14. Account Deletion — Transactions Become Unassigned

**Issue:** `accounts.account_id` has `ON DELETE SET NULL`. When an account is deleted, transactions lose their account association permanently with no audit trail.  
**Recommendation:** Consider soft-delete for accounts (already have `is_active` flag) or store account name snapshot in transaction before nullifying FK.

---

## Security Assessment

| Category | Status | Notes |
|----------|--------|-------|
| Authentication | ✅ | Supabase Auth with email/password + Google OAuth |
| Authorization (RLS) | ✅ | All tables user-scoped, system categories read-only |
| Input Validation | ✅ | Zod schemas on forms, DB constraints on columns |
| SQL Injection | ✅ | PostgREST parameterized queries, UUID regex validation |
| XSS | ✅ | React DOM escaping, no `dangerouslySetInnerHTML` |
| CSRF | ✅ | Supabase uses JWT Bearer tokens (not cookies) |
| Service Role Key | ✅ | Only anon key exposed to client |
| Rate Limiting | ⚠️ | No app-level rate limiting on CSV import |
| Field Injection | ✅ | Fixed: profile update now whitelists fields |

---

## Performance Assessment

| Query Pattern | Current | Recommended | Impact |
|--------------|---------|-------------|--------|
| Dashboard stats | Fetch ALL transactions | SQL SUM aggregation | -95% data transfer |
| Recent transactions | Fetch ALL, slice 5 | **FIXED: Server LIMIT** | -99% data transfer |
| Account balances | Fetch ALL txns, group in JS | SQL GROUP BY + JOIN | -90% data transfer |
| Monthly chart | Fetch year's raw rows | SQL GROUP BY month | -80% data transfer |
| Notes search | Sequential scan (ILIKE) | Trigram GIN index | 10-100x faster |
| CSV import | 1 INSERT per row | Batch INSERT (1000/batch) | -99% HTTP overhead |

---

## Data Integrity

| Check | Status | Notes |
|-------|--------|-------|
| Referential integrity | ✅ | FK constraints on all relationships |
| Orphan protection | ✅ | ON DELETE SET NULL / soft-delete |
| Amount validation | ✅ | `amount > 0` CHECK constraint |
| Type validation | ✅ | `type IN ('income','expense')` CHECK |
| Color validation | ✅ | Hex regex CHECK on all color fields |
| Text length limits | ✅ | CHECK constraints on name/notes/currency |
| Soft-delete integrity | ✅ | `deleted_at` + partial indexes exclude deleted rows |
| Duplicate prevention | ⚠️ | No unique constraint on transaction content (by design) |

---

## Build Health After Audit

| Check | Status |
|-------|--------|
| TypeScript | ✅ 0 errors |
| ESLint | ✅ 0 errors |
| Tests | ✅ 964/964 pass |
| Production build | ✅ Successful |

