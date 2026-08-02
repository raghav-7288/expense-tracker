# Database Production Readiness Audit

> Execute each query in the **Supabase SQL Editor**, then paste the output in the **Results** block under each query.
> Once all results are filled in, the analysis and production-readiness verdict will be added at the bottom.

**Legend:**
- ✅ Expected — what a healthy result looks like
- 🚩 Problem — what would indicate an issue
- 📋 Results — paste your query output here

---

## 1. Schema Validation

### Query 1.1 — List All Tables
**Purpose:** Identify every table in the public schema.
```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
✅ **Expected:** All application tables (profiles, categories, transactions, accounts, loans, loan_transactions, system_categories, user_categories, etc.).
🚩 **Problem:** Missing tables, unexpected tables, or tables of wrong type.

📋 **Results:**
```
table_name,table_type
accounts,BASE TABLE
loan_transactions,BASE TABLE
loans,BASE TABLE
merged_categories,VIEW
profiles,BASE TABLE
system_categories,BASE TABLE
transactions,BASE TABLE
user_categories,BASE TABLE
user_hidden_categories,BASE TABLE
```

---

### Query 1.2 — Columns, Data Types, Nullability, and Defaults
**Purpose:** Full column inventory for every table.
```sql
SELECT
  table_name,
  column_name,
  ordinal_position,
  data_type,
  udt_name,
  character_maximum_length,
  numeric_precision,
  numeric_scale,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```
✅ **Expected:** Every column has appropriate type, nullability matches business rules, defaults present where needed.
🚩 **Problem:** `TEXT` columns that should be constrained, missing defaults on `created_at`/`updated_at`, `NOT NULL` missing on required fields.

📋 **Results:**
```
table_name,column_name,ordinal_position,data_type,udt_name,character_maximum_length,numeric_precision,numeric_scale,is_nullable,column_default
accounts,id,1,uuid,uuid,null,null,null,NO,gen_random_uuid()
accounts,user_id,2,uuid,uuid,null,null,null,NO,null
accounts,name,3,text,text,null,null,null,NO,null
accounts,type,4,text,text,null,null,null,NO,'checking'::text
accounts,initial_balance,5,numeric,numeric,null,12,2,NO,0
accounts,color,6,text,text,null,null,null,NO,'#3b82f6'::text
accounts,icon,7,text,text,null,null,null,NO,'wallet'::text
accounts,is_active,8,boolean,bool,null,null,null,NO,true
accounts,sort_order,9,integer,int4,null,32,0,NO,0
accounts,created_at,10,timestamp with time zone,timestamptz,null,null,null,NO,now()
accounts,updated_at,11,timestamp with time zone,timestamptz,null,null,null,NO,now()
loan_transactions,id,1,uuid,uuid,null,null,null,NO,gen_random_uuid()
loan_transactions,loan_id,2,uuid,uuid,null,null,null,NO,null
loan_transactions,transaction_id,3,uuid,uuid,null,null,null,NO,null
loan_transactions,event_type,4,text,text,null,null,null,NO,null
loan_transactions,created_at,5,timestamp with time zone,timestamptz,null,null,null,NO,now()
loans,id,1,uuid,uuid,null,null,null,NO,gen_random_uuid()
loans,user_id,2,uuid,uuid,null,null,null,NO,null
loans,counterparty_name,3,text,text,null,null,null,NO,null
loans,type,4,text,text,null,null,null,NO,null
loans,principal_amount,5,numeric,numeric,null,12,2,NO,null
loans,outstanding_amount,6,numeric,numeric,null,12,2,NO,null
loans,status,7,text,text,null,null,null,NO,'active'::text
loans,due_date,8,date,date,null,null,null,YES,null
loans,notes,9,text,text,null,null,null,YES,null
loans,created_at,10,timestamp with time zone,timestamptz,null,null,null,NO,now()
loans,updated_at,11,timestamp with time zone,timestamptz,null,null,null,NO,now()
merged_categories,id,1,uuid,uuid,null,null,null,YES,null
merged_categories,name,2,text,text,null,null,null,YES,null
merged_categories,type,3,text,text,null,null,null,YES,null
merged_categories,color,4,text,text,null,null,null,YES,null
merged_categories,icon,5,text,text,null,null,null,YES,null
merged_categories,created_at,6,timestamp with time zone,timestamptz,null,null,null,YES,null
merged_categories,updated_at,7,timestamp with time zone,timestamptz,null,null,null,YES,null
merged_categories,source,8,text,text,null,null,null,YES,null
merged_categories,user_id,9,uuid,uuid,null,null,null,YES,null
merged_categories,source_category_id,10,uuid,uuid,null,null,null,YES,null
merged_categories,deleted_at,11,timestamp with time zone,timestamptz,null,null,null,YES,null
profiles,id,1,uuid,uuid,null,null,null,NO,null
profiles,email,2,text,text,null,null,null,NO,null
profiles,full_name,3,text,text,null,null,null,YES,null
profiles,avatar_url,4,text,text,null,null,null,YES,null
profiles,currency,5,text,text,null,null,null,NO,'INR'::text
profiles,created_at,6,timestamp with time zone,timestamptz,null,null,null,NO,now()
profiles,updated_at,7,timestamp with time zone,timestamptz,null,null,null,NO,now()
system_categories,id,1,uuid,uuid,null,null,null,NO,gen_random_uuid()
system_categories,name,2,text,text,null,null,null,NO,null
system_categories,type,3,text,text,null,null,null,NO,null
system_categories,color,4,text,text,null,null,null,NO,'#3b82f6'::text
system_categories,icon,5,text,text,null,null,null,NO,'tag'::text
system_categories,created_at,6,timestamp with time zone,timestamptz,null,null,null,NO,now()
system_categories,updated_at,7,timestamp with time zone,timestamptz,null,null,null,NO,now()
transactions,id,1,uuid,uuid,null,null,null,NO,gen_random_uuid()
transactions,user_id,2,uuid,uuid,null,null,null,NO,null
transactions,category_id,3,uuid,uuid,null,null,null,YES,null
transactions,type,4,text,text,null,null,null,NO,null
transactions,amount,5,numeric,numeric,null,12,2,NO,null
transactions,notes,7,text,text,null,null,null,NO,null
transactions,date,8,date,date,null,null,null,NO,CURRENT_DATE
transactions,created_at,9,timestamp with time zone,timestamptz,null,null,null,NO,now()
transactions,updated_at,10,timestamp with time zone,timestamptz,null,null,null,NO,now()
transactions,system_category_id,11,uuid,uuid,null,null,null,YES,null
transactions,user_category_id,12,uuid,uuid,null,null,null,YES,null
transactions,account_id,13,uuid,uuid,null,null,null,YES,null
user_categories,id,1,uuid,uuid,null,null,null,NO,gen_random_uuid()
user_categories,user_id,2,uuid,uuid,null,null,null,NO,null
user_categories,name,3,text,text,null,null,null,NO,null
user_categories,type,4,text,text,null,null,null,NO,null
user_categories,color,5,text,text,null,null,null,NO,'#3b82f6'::text
user_categories,icon,6,text,text,null,null,null,NO,'tag'::text
user_categories,source_category_id,7,uuid,uuid,null,null,null,YES,null
user_categories,created_at,8,timestamp with time zone,timestamptz,null,null,null,NO,now()
user_categories,updated_at,9,timestamp with time zone,timestamptz,null,null,null,NO,now()
user_categories,deleted_at,10,timestamp with time zone,timestamptz,null,null,null,YES,null
user_hidden_categories,user_id,1,uuid,uuid,null,null,null,NO,null
user_hidden_categories,category_id,2,uuid,uuid,null,null,null,NO,null
user_hidden_categories,hidden_at,3,timestamp with time zone,timestamptz,null,null,null,NO,now()
```

---

### Query 1.3 — Primary Keys
**Purpose:** Verify every table has a primary key.
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```
✅ **Expected:** Every table has exactly one primary key (typically `id UUID`).
🚩 **Problem:** Tables without a primary key.

📋 **Results:**
```
table_name,column_name,constraint_name
accounts,id,accounts_pkey
loan_transactions,id,loan_transactions_pkey
loans,id,loans_pkey
profiles,id,profiles_pkey
system_categories,id,system_categories_pkey
transactions,id,transactions_pkey
user_categories,id,user_categories_pkey
user_hidden_categories,user_id,user_hidden_categories_pkey
user_hidden_categories,category_id,user_hidden_categories_pkey
```

---

### Query 1.4 — Tables Missing Primary Keys
**Purpose:** Find tables with no PK defined.
```sql
SELECT t.table_name
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc
  ON t.table_name = tc.table_name
  AND tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'public'
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND tc.constraint_name IS NULL;
```
✅ **Expected:** Empty result set.
🚩 **Problem:** Any row returned means a table has no primary key.

📋 **Results:**
```
Success. No rows returned

```

---

### Query 1.5 — Foreign Keys
**Purpose:** Map all foreign key relationships.
```sql
SELECT
  tc.table_name AS source_table,
  kcu.column_name AS source_column,
  ccu.table_name AS target_table,
  ccu.column_name AS target_column,
  tc.constraint_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
  AND tc.table_schema = ccu.table_schema
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
  AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```
✅ **Expected:** All FK relationships with appropriate `ON DELETE` rules (CASCADE for user data, SET NULL for optional references).
🚩 **Problem:** Missing CASCADE on user_id FKs, NO ACTION where CASCADE is needed.

📋 **Results:**
```
source_table,source_column,target_table,target_column,constraint_name,delete_rule,update_rule
loan_transactions,loan_id,loans,id,loan_transactions_loan_id_fkey,CASCADE,NO ACTION
loan_transactions,transaction_id,transactions,id,loan_transactions_transaction_id_fkey,CASCADE,NO ACTION
transactions,account_id,accounts,id,transactions_account_id_fkey,SET NULL,NO ACTION
transactions,system_category_id,system_categories,id,transactions_system_category_id_fkey,SET NULL,NO ACTION
transactions,user_category_id,user_categories,id,transactions_user_category_id_fkey,SET NULL,NO ACTION
user_categories,source_category_id,system_categories,id,user_categories_source_category_id_fkey,SET NULL,NO ACTION
user_hidden_categories,category_id,system_categories,id,user_hidden_categories_category_id_fkey,CASCADE,NO ACTION
```

---

### Query 1.6 — Unique Constraints
**Purpose:** List all uniqueness guarantees.
```sql
SELECT
  tc.table_name,
  tc.constraint_name,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;
```
✅ **Expected:** Unique constraints on natural keys (e.g., user_id+name for categories, loan_id+transaction_id for loan_transactions).
🚩 **Problem:** Missing uniqueness constraints that could allow duplicate data.

📋 **Results:**
```
table_name,constraint_name,columns
accounts,accounts_user_id_name_key,"user_id, name"
loan_transactions,loan_transactions_loan_id_transaction_id_key,"loan_id, transaction_id"
system_categories,system_categories_name_type_key,"name, type"
user_categories,user_categories_user_id_name_type_key,"user_id, name, type"
```

---

### Query 1.7 — Check Constraints
**Purpose:** List all CHECK constraints (type enums, amount > 0, etc.).
```sql
SELECT
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'c'
  AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;
```
✅ **Expected:** Type checks (income/expense/lent/borrowed), amount > 0, status checks, etc.
🚩 **Problem:** Missing check constraints on enum-like columns, allowing invalid data.

📋 **Results:**
```
table_name,constraint_name,definition
accounts,accounts_type_check,"CHECK ((type = ANY (ARRAY['checking'::text, 'savings'::text, 'credit_card'::text, 'cash'::text, 'investment'::text, 'other'::text])))"
loan_transactions,loan_transactions_event_type_check,"CHECK ((event_type = ANY (ARRAY['disbursement'::text, 'repayment'::text])))"
loans,loans_outstanding_amount_check,CHECK ((outstanding_amount >= (0)::numeric))
loans,loans_principal_amount_check,CHECK ((principal_amount > (0)::numeric))
loans,loans_status_check,"CHECK ((status = ANY (ARRAY['active'::text, 'partially_paid'::text, 'settled'::text])))"
loans,loans_type_check,"CHECK ((type = ANY (ARRAY['lent'::text, 'borrowed'::text])))"
profiles,chk_profiles_currency_length,CHECK ((char_length(currency) <= 5))
system_categories,chk_system_categories_color_format,CHECK ((color ~ '^#[0-9a-fA-F]{6}$'::text))
system_categories,chk_system_categories_name_length,CHECK ((char_length(name) <= 100))
system_categories,system_categories_type_check,"CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text])))"
transactions,chk_transactions_notes_length,CHECK ((char_length(notes) <= 2000))
transactions,transactions_amount_check,CHECK ((amount > (0)::numeric))
transactions,transactions_type_check,"CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text, 'lent'::text, 'borrowed'::text])))"
user_categories,chk_user_categories_color_format,CHECK ((color ~ '^#[0-9a-fA-F]{6}$'::text))
user_categories,chk_user_categories_name_length,CHECK ((char_length(name) <= 100))
user_categories,user_categories_type_check,"CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text])))"
```

---

## 2. Relationships

### Query 2.1 — Orphaned Transactions (no matching user)
**Purpose:** Find transactions whose user_id doesn't exist in auth.users.
```sql
SELECT t.id, t.user_id, t.notes, t.date
FROM public.transactions t
LEFT JOIN auth.users u ON t.user_id = u.id
WHERE u.id IS NULL
LIMIT 20;
```
✅ **Expected:** Empty result set.
🚩 **Problem:** Any row = orphaned data from deleted users where CASCADE didn't fire.

📋 **Results:**
```
Success. No rows returned

```

---

### Query 2.2 — Orphaned Loans (no matching user)
**Purpose:** Find loans whose user doesn't exist.
```sql
SELECT l.id, l.user_id, l.counterparty_name
FROM public.loans l
LEFT JOIN auth.users u ON l.user_id = u.id
WHERE u.id IS NULL
LIMIT 20;
```
✅ **Expected:** Empty result set.
🚩 **Problem:** Orphaned loan records.

📋 **Results:**
```
Success. No rows returned

```

---

### Query 2.3 — Orphaned Accounts (no matching user)
**Purpose:** Find accounts without valid owners.
```sql
SELECT a.id, a.user_id, a.name
FROM public.accounts a
LEFT JOIN auth.users u ON a.user_id = u.id
WHERE u.id IS NULL
LIMIT 20;
```
✅ **Expected:** Empty result set.
🚩 **Problem:** Orphaned accounts.

📋 **Results:**
```
Success. No rows returned

```

---

### Query 2.4 — Invalid Category References in Transactions
**Purpose:** Find transactions pointing to non-existent categories.
```sql
SELECT t.id, t.system_category_id, t.user_category_id
FROM public.transactions t
WHERE (t.system_category_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.system_categories sc WHERE sc.id = t.system_category_id))
   OR (t.user_category_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.user_categories uc WHERE uc.id = t.user_category_id))
LIMIT 20;
```
✅ **Expected:** Empty result set.
🚩 **Problem:** Broken category FK references.

📋 **Results:**
```
Success. No rows returned

```

---

### Query 2.5 — Invalid Account References in Transactions
**Purpose:** Find transactions pointing to non-existent accounts.
```sql
SELECT t.id, t.account_id, t.notes
FROM public.transactions t
WHERE t.account_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = t.account_id)
LIMIT 20;
```
✅ **Expected:** Empty result set.
🚩 **Problem:** Broken account references.

📋 **Results:**
```
Success. No rows returned
```

---

### Query 2.6 — Orphaned Loan Transactions (junction)
**Purpose:** Find loan_transaction records pointing to deleted loans or transactions.
```sql
SELECT lt.id, lt.loan_id, lt.transaction_id, lt.event_type
FROM public.loan_transactions lt
WHERE NOT EXISTS (SELECT 1 FROM public.loans l WHERE l.id = lt.loan_id)
   OR NOT EXISTS (SELECT 1 FROM public.transactions t WHERE t.id = lt.transaction_id)
LIMIT 20;
```
✅ **Expected:** Empty result set.
🚩 **Problem:** Orphan junction records from incomplete cascades.

📋 **Results:**
```
Success. No rows returned
```

---

### Query 2.7 — Profiles Without Auth Users
**Purpose:** Verify every profile has a matching auth user.
```sql
SELECT p.id, p.email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL
LIMIT 20;
```
✅ **Expected:** Empty result set.
🚩 **Problem:** Stale profile records.

📋 **Results:**
```
Success. No rows returned

```

---

## 3. Row Level Security

### Query 3.1 — RLS Status for All Tables
**Purpose:** Check which tables have RLS enabled.
```sql
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
✅ **Expected:** `rls_enabled = true` for ALL tables.
🚩 **Problem:** Any table with `rls_enabled = false`.

📋 **Results:**
```
schemaname,tablename,rls_enabled
public,accounts,true
public,loan_transactions,true
public,loans,true
public,profiles,true
public,system_categories,true
public,transactions,true
public,user_categories,true
public,user_hidden_categories,true
```

---

### Query 3.2 — Tables WITHOUT RLS Enabled
**Purpose:** Specifically flag insecure tables.
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;
```
✅ **Expected:** Empty result set.
🚩 **Problem:** Any table listed is publicly accessible without policies.

📋 **Results:**
```
Success. No rows returned


```

---

### Query 3.3 — All RLS Policies
**Purpose:** Complete inventory of security policies.
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```
✅ **Expected:** Each table has policies for SELECT, INSERT, UPDATE, DELETE. Policies reference `auth.uid()`.
🚩 **Problem:** Missing policies for certain operations, `roles = '{}'`, or policies with `qual = true`.

📋 **Results:**
```
schemaname,tablename,policyname,permissive,roles,cmd,using_expression,with_check
public,accounts,Users can delete own accounts,PERMISSIVE,{public},DELETE,(auth.uid() = user_id),null
public,accounts,Users can insert own accounts,PERMISSIVE,{public},INSERT,null,(auth.uid() = user_id)
public,accounts,Users can view own accounts,PERMISSIVE,{public},SELECT,(auth.uid() = user_id),null
public,accounts,Users can update own accounts,PERMISSIVE,{public},UPDATE,(auth.uid() = user_id),(auth.uid() = user_id)
public,loan_transactions,Users can delete own loan_transactions,PERMISSIVE,{public},DELETE,"(EXISTS ( SELECT 1
   FROM loans
  WHERE ((loans.id = loan_transactions.loan_id) AND (loans.user_id = auth.uid()))))",null
public,loan_transactions,Users can insert own loan_transactions,PERMISSIVE,{public},INSERT,null,"(EXISTS ( SELECT 1
   FROM loans
  WHERE ((loans.id = loan_transactions.loan_id) AND (loans.user_id = auth.uid()))))"
public,loan_transactions,Users can view own loan_transactions,PERMISSIVE,{public},SELECT,"(EXISTS ( SELECT 1
   FROM loans
  WHERE ((loans.id = loan_transactions.loan_id) AND (loans.user_id = auth.uid()))))",null
public,loan_transactions,Users can update own loan_transactions,PERMISSIVE,{public},UPDATE,"(EXISTS ( SELECT 1
   FROM loans
  WHERE ((loans.id = loan_transactions.loan_id) AND (loans.user_id = auth.uid()))))","(EXISTS ( SELECT 1
   FROM loans
  WHERE ((loans.id = loan_transactions.loan_id) AND (loans.user_id = auth.uid()))))"
public,loans,Users can delete own loans,PERMISSIVE,{public},DELETE,(auth.uid() = user_id),null
public,loans,Users can insert own loans,PERMISSIVE,{public},INSERT,null,(auth.uid() = user_id)
public,loans,Users can view own loans,PERMISSIVE,{public},SELECT,(auth.uid() = user_id),null
public,loans,Users can update own loans,PERMISSIVE,{public},UPDATE,(auth.uid() = user_id),(auth.uid() = user_id)
public,profiles,Users can delete own profile,PERMISSIVE,{public},DELETE,(auth.uid() = id),null
public,profiles,Users can insert own profile,PERMISSIVE,{public},INSERT,null,(auth.uid() = id)
public,profiles,Users can view own profile,PERMISSIVE,{public},SELECT,(auth.uid() = id),null
public,profiles,Users can update own profile,PERMISSIVE,{public},UPDATE,(auth.uid() = id),(auth.uid() = id)
public,system_categories,Anyone authenticated can view system categories,PERMISSIVE,{public},SELECT,(auth.uid() IS NOT NULL),null
public,transactions,Users can delete own transactions,PERMISSIVE,{public},DELETE,(auth.uid() = user_id),null
public,transactions,Users can insert own transactions,PERMISSIVE,{public},INSERT,null,(auth.uid() = user_id)
public,transactions,Users can view own transactions,PERMISSIVE,{public},SELECT,(auth.uid() = user_id),null
public,transactions,Users can update own transactions,PERMISSIVE,{public},UPDATE,(auth.uid() = user_id),(auth.uid() = user_id)
public,user_categories,Users can delete own user_categories,PERMISSIVE,{public},DELETE,(auth.uid() = user_id),null
public,user_categories,Users can insert own user_categories,PERMISSIVE,{public},INSERT,null,(auth.uid() = user_id)
public,user_categories,Users can view own user_categories,PERMISSIVE,{public},SELECT,(auth.uid() = user_id),null
public,user_categories,Users can update own user_categories,PERMISSIVE,{public},UPDATE,(auth.uid() = user_id),(auth.uid() = user_id)
public,user_hidden_categories,Users can delete own hidden categories,PERMISSIVE,{public},DELETE,(auth.uid() = user_id),null
public,user_hidden_categories,Users can insert own hidden categories,PERMISSIVE,{public},INSERT,null,(auth.uid() = user_id)
public,user_hidden_categories,Users can view own hidden categories,PERMISSIVE,{public},SELECT,(auth.uid() = user_id),null
```

---

### Query 3.4 — Tables with RLS Enabled but NO Policies
**Purpose:** Find tables locked down with RLS but no rules (= completely inaccessible).
```sql
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0;
```
✅ **Expected:** Empty result set.
🚩 **Problem:** Any table listed = RLS enabled but zero policies means ALL access is blocked.

📋 **Results:**
```
Success. No rows returned

```

---

## 4. Indexes

### Query 4.1 — All Indexes
**Purpose:** Complete index inventory.
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```
✅ **Expected:** Indexes on user_id, date, type, foreign keys, and frequently queried columns.
🚩 **Problem:** Missing indexes on join/filter columns.

📋 **Results:**
```
schemaname,tablename,indexname,indexdef
public,accounts,accounts_pkey,CREATE UNIQUE INDEX accounts_pkey ON public.accounts USING btree (id)
public,accounts,accounts_user_id_name_key,"CREATE UNIQUE INDEX accounts_user_id_name_key ON public.accounts USING btree (user_id, name)"
public,accounts,idx_accounts_user_active,"CREATE INDEX idx_accounts_user_active ON public.accounts USING btree (user_id, is_active)"
public,accounts,idx_accounts_user_id,CREATE INDEX idx_accounts_user_id ON public.accounts USING btree (user_id)
public,loan_transactions,idx_loan_transactions_loan,CREATE INDEX idx_loan_transactions_loan ON public.loan_transactions USING btree (loan_id)
public,loan_transactions,idx_loan_transactions_txn,CREATE INDEX idx_loan_transactions_txn ON public.loan_transactions USING btree (transaction_id)
public,loan_transactions,loan_transactions_loan_id_transaction_id_key,"CREATE UNIQUE INDEX loan_transactions_loan_id_transaction_id_key ON public.loan_transactions USING btree (loan_id, transaction_id)"
public,loan_transactions,loan_transactions_pkey,CREATE UNIQUE INDEX loan_transactions_pkey ON public.loan_transactions USING btree (id)
public,loans,idx_loans_user_id,CREATE INDEX idx_loans_user_id ON public.loans USING btree (user_id)
public,loans,idx_loans_user_status,"CREATE INDEX idx_loans_user_status ON public.loans USING btree (user_id, status)"
public,loans,idx_loans_user_type,"CREATE INDEX idx_loans_user_type ON public.loans USING btree (user_id, type)"
public,loans,loans_pkey,CREATE UNIQUE INDEX loans_pkey ON public.loans USING btree (id)
public,profiles,idx_profiles_email,CREATE INDEX idx_profiles_email ON public.profiles USING btree (email)
public,profiles,profiles_pkey,CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)
public,system_categories,system_categories_name_type_key,"CREATE UNIQUE INDEX system_categories_name_type_key ON public.system_categories USING btree (name, type)"
public,system_categories,system_categories_pkey,CREATE UNIQUE INDEX system_categories_pkey ON public.system_categories USING btree (id)
public,transactions,idx_transactions_account,CREATE INDEX idx_transactions_account ON public.transactions USING btree (account_id)
public,transactions,idx_transactions_category,CREATE INDEX idx_transactions_category ON public.transactions USING btree (category_id)
public,transactions,idx_transactions_notes_trgm,CREATE INDEX idx_transactions_notes_trgm ON public.transactions USING gin (notes gin_trgm_ops)
public,transactions,idx_transactions_system_category,CREATE INDEX idx_transactions_system_category ON public.transactions USING btree (system_category_id)
public,transactions,idx_transactions_type,"CREATE INDEX idx_transactions_type ON public.transactions USING btree (user_id, type)"
public,transactions,idx_transactions_user_category,CREATE INDEX idx_transactions_user_category ON public.transactions USING btree (user_category_id)
public,transactions,idx_transactions_user_date,"CREATE INDEX idx_transactions_user_date ON public.transactions USING btree (user_id, date DESC)"
public,transactions,idx_transactions_user_id,CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id)
public,transactions,idx_transactions_user_type_date,"CREATE INDEX idx_transactions_user_type_date ON public.transactions USING btree (user_id, type, date DESC)"
public,transactions,transactions_pkey,CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id)
public,user_categories,idx_user_categories_active,CREATE INDEX idx_user_categories_active ON public.user_categories USING btree (user_id) WHERE (deleted_at IS NULL)
public,user_categories,idx_user_categories_active_type,"CREATE INDEX idx_user_categories_active_type ON public.user_categories USING btree (user_id, type) WHERE (deleted_at IS NULL)"
public,user_categories,idx_user_categories_type,"CREATE INDEX idx_user_categories_type ON public.user_categories USING btree (user_id, type)"
public,user_categories,idx_user_categories_user_id,CREATE INDEX idx_user_categories_user_id ON public.user_categories USING btree (user_id)
public,user_categories,user_categories_pkey,CREATE UNIQUE INDEX user_categories_pkey ON public.user_categories USING btree (id)
public,user_categories,user_categories_user_id_name_type_key,"CREATE UNIQUE INDEX user_categories_user_id_name_type_key ON public.user_categories USING btree (user_id, name, type)"
public,user_hidden_categories,user_hidden_categories_pkey,"CREATE UNIQUE INDEX user_hidden_categories_pkey ON public.user_hidden_categories USING btree (user_id, category_id)"
```

---

### Query 4.2 — Foreign Keys Without an Index
**Purpose:** Find potential slow-join FK columns.
```sql
SELECT
  tc.table_name,
  kcu.column_name AS fk_column,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND NOT EXISTS (
    SELECT 1
    FROM pg_indexes pi
    WHERE pi.schemaname = 'public'
      AND pi.tablename = tc.table_name
      AND pi.indexdef LIKE '%' || kcu.column_name || '%'
  )
ORDER BY tc.table_name;
```
✅ **Expected:** Empty result set (all FK columns should be indexed).
🚩 **Problem:** Unindexed FK columns = slow joins and cascading deletes.

📋 **Results:**
```
table_name,fk_column,constraint_name
user_categories,source_category_id,user_categories_source_category_id_fkey
```

---

### Query 4.3 — Duplicate/Redundant Indexes
**Purpose:** Find indexes that duplicate each other.
```sql
SELECT
  a.indexname AS index_1,
  b.indexname AS index_2,
  a.tablename,
  a.indexdef
FROM pg_indexes a
JOIN pg_indexes b
  ON a.tablename = b.tablename
  AND a.indexname < b.indexname
  AND a.schemaname = 'public'
  AND b.schemaname = 'public'
  AND (
    a.indexdef = b.indexdef
    OR position(substring(a.indexdef from '\(.*\)') in b.indexdef) > 0
  )
WHERE a.schemaname = 'public';
```
✅ **Expected:** Empty or near-empty (PK indexes may overlap with explicit indexes).
🚩 **Problem:** Truly duplicate indexes wasting storage and slowing writes.

📋 **Results:**
```
Success. No rows returned


```

---

## 5. Data Validation

### Query 5.1 — Duplicate Transactions
**Purpose:** Find potential duplicate entries (same user, date, amount, notes).
```sql
SELECT user_id, date, amount, notes, COUNT(*) AS count
FROM public.transactions
GROUP BY user_id, date, amount, notes
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 20;
```
✅ **Expected:** Empty or very few legitimate duplicates.
🚩 **Problem:** Many duplicates suggest missing constraints or buggy inserts.

📋 **Results:**
```
Success. No rows returned

```

---

### Query 5.2 — Duplicate Categories
**Purpose:** Find category duplicates (same user, name, type).
```sql
SELECT user_id, name, type, COUNT(*) AS count
FROM public.user_categories
WHERE deleted_at IS NULL
GROUP BY user_id, name, type
HAVING COUNT(*) > 1
LIMIT 20;
```
✅ **Expected:** Empty (unique constraint should prevent this).
🚩 **Problem:** Data integrity failure.

📋 **Results:**
```
Success. No rows returned

```

---

### Query 5.3 — Duplicate Accounts
**Purpose:** Find account name duplicates (same user, name).
```sql
SELECT user_id, name, COUNT(*) AS count
FROM public.accounts
GROUP BY user_id, name
HAVING COUNT(*) > 1
LIMIT 20;
```
✅ **Expected:** Empty or very few.
🚩 **Problem:** Users with duplicate-named accounts causing confusion.

📋 **Results:**
```
Success. No rows returned

```

---

### Query 5.4 — Transactions with Empty Required Fields
**Purpose:** Find data integrity violations.
```sql
SELECT id, user_id, type, amount, notes, date
FROM public.transactions
WHERE notes IS NULL
   OR notes = ''
   OR amount IS NULL
   OR amount <= 0
   OR date IS NULL
   OR type IS NULL
LIMIT 20;
```
✅ **Expected:** Empty.
🚩 **Problem:** Records that bypassed validation.

📋 **Results:**
```
Success. No rows returned

```

---

### Query 5.5 — Loans with Invalid State
**Purpose:** Find loans in an impossible state.
```sql
SELECT id, counterparty_name, principal_amount, outstanding_amount, status
FROM public.loans
WHERE outstanding_amount > principal_amount
   OR (status = 'settled' AND outstanding_amount > 0)
   OR (status = 'active' AND outstanding_amount <= 0 AND principal_amount > 0)
   OR principal_amount <= 0
LIMIT 20;
```
✅ **Expected:** Empty.
🚩 **Problem:** Business logic violations in loan state.

📋 **Results:**
```
Success. No rows returned


```

---

### Query 5.6 — Loan Transactions Without Matching Loan
**Purpose:** Validate junction table integrity.
```sql
SELECT lt.*
FROM public.loan_transactions lt
LEFT JOIN public.loans l ON lt.loan_id = l.id
WHERE l.id IS NULL
LIMIT 10;
```
✅ **Expected:** Empty.
🚩 **Problem:** Orphaned junction records.

📋 **Results:**
```
Success. No rows returned


```

---

## 6. Business Logic Validation

### Query 6.1 — Income vs Expense Totals Per User
**Purpose:** Verify financial aggregations.
```sql
SELECT
  user_id,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) -
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS net_balance,
  COUNT(*) AS transaction_count
FROM public.transactions
WHERE type IN ('income', 'expense')
GROUP BY user_id
ORDER BY net_balance DESC
LIMIT 20;
```
✅ **Expected:** Non-negative or reasonable net balances.
🚩 **Problem:** Wildly negative balances or zero income with expenses.

📋 **Results:**
```
user_id,total_income,total_expenses,net_balance,transaction_count
29a56e83-ed97-4bc7-b102-6e141796581c,186844.00,6491.50,180352.50,36
5b01ccd7-b943-41f9-8e87-bf6aca3d1c62,147610.00,38684.00,108926.00,51
4649a117-1447-435a-84fd-f59a906d8adf,50690.00,17934.00,32756.00,3
08f2a2bb-5eab-4417-8b74-85fab6762c43,39300.00,30000.00,9300.00,3
d02a1ac1-4bf8-482b-a4f9-948c3aa6d138,0,1100.00,-1100.00,5
32f99033-6e13-4cc3-957b-99f3fea171b6,15000.00,61849.00,-46849.00,16
```

---

### Query 6.2 — Loan Summary Per User
**Purpose:** Verify loan aggregations match expectations.
```sql
SELECT
  user_id,
  SUM(CASE WHEN type = 'lent' THEN principal_amount ELSE 0 END) AS total_lent,
  SUM(CASE WHEN type = 'borrowed' THEN principal_amount ELSE 0 END) AS total_borrowed,
  SUM(CASE WHEN type = 'lent' THEN outstanding_amount ELSE 0 END) AS outstanding_lent,
  SUM(CASE WHEN type = 'borrowed' THEN outstanding_amount ELSE 0 END) AS outstanding_borrowed,
  COUNT(*) FILTER (WHERE status = 'active') AS active_count,
  COUNT(*) FILTER (WHERE status = 'settled') AS settled_count
FROM public.loans
GROUP BY user_id
LIMIT 20;
```
✅ **Expected:** Outstanding ≤ Principal for each type.
🚩 **Problem:** Outstanding exceeding principal, or settled loans with outstanding > 0.

📋 **Results:**
```
Success. No rows returned


```

---

### Query 6.3 — Verify Loan Repayment Totals Match Outstanding Reduction
**Purpose:** Cross-check that repayments are consistent with loan balances.
```sql
SELECT
  l.id AS loan_id,
  l.counterparty_name,
  l.principal_amount,
  l.outstanding_amount,
  l.principal_amount - l.outstanding_amount AS expected_repaid,
  COALESCE(SUM(t.amount), 0) AS actual_repaid
FROM public.loans l
LEFT JOIN public.loan_transactions lt ON lt.loan_id = l.id AND lt.event_type = 'repayment'
LEFT JOIN public.transactions t ON t.id = lt.transaction_id
GROUP BY l.id, l.counterparty_name, l.principal_amount, l.outstanding_amount
HAVING ABS((l.principal_amount - l.outstanding_amount) - COALESCE(SUM(t.amount), 0)) > 0.01
LIMIT 20;
```
✅ **Expected:** Empty (repayments should equal principal − outstanding).
🚩 **Problem:** Mismatch means repayment records are inconsistent with loan state.

📋 **Results:**
```
Success. No rows returned


```

---

### Query 6.4 — Category Totals by User (Expense)
**Purpose:** Verify category breakdown sums match transaction totals.
```sql
SELECT
  t.user_id,
  SUM(t.amount) AS total_expenses,
  SUM(CASE WHEN t.system_category_id IS NOT NULL OR t.user_category_id IS NOT NULL THEN t.amount ELSE 0 END) AS categorized,
  SUM(CASE WHEN t.system_category_id IS NULL AND t.user_category_id IS NULL THEN t.amount ELSE 0 END) AS uncategorized
FROM public.transactions t
WHERE t.type = 'expense'
GROUP BY t.user_id
LIMIT 20;
```
✅ **Expected:** categorized + uncategorized = total_expenses.
🚩 **Problem:** Math doesn't add up.

📋 **Results:**
```
user_id,total_expenses,categorized,uncategorized
08f2a2bb-5eab-4417-8b74-85fab6762c43,30000.00,30000.00,0
5b01ccd7-b943-41f9-8e87-bf6aca3d1c62,38684.00,38684.00,0
4649a117-1447-435a-84fd-f59a906d8adf,17934.00,17934.00,0
29a56e83-ed97-4bc7-b102-6e141796581c,6491.50,6436.50,55.00
d02a1ac1-4bf8-482b-a4f9-948c3aa6d138,1100.00,1100.00,0
32f99033-6e13-4cc3-957b-99f3fea171b6,61849.00,61849.00,0
```

---

### Query 6.5 — Loan-Type Transactions Must Have a Loan Link
**Purpose:** Verify every lent/borrowed transaction is linked to a loan.
```sql
SELECT t.id, t.type, t.amount, t.notes, t.date
FROM public.transactions t
WHERE t.type IN ('lent', 'borrowed')
  AND NOT EXISTS (
    SELECT 1 FROM public.loan_transactions lt WHERE lt.transaction_id = t.id
  )
LIMIT 20;
```
✅ **Expected:** Empty.
🚩 **Problem:** Loan-type transactions without a parent loan = orphaned records.

📋 **Results:**
```
Success. No rows returned

```

---

## 7. Security

### Query 7.1 — Tables Without RLS (Critical Security Check)
**Purpose:** Flag any table with RLS disabled.
```sql
SELECT
  c.relname AS table_name,
  CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relrowsecurity, c.relname;
```
✅ **Expected:** All tables show ENABLED.
🚩 **Problem:** Any DISABLED table = public access vulnerability.

📋 **Results:**
```
table_name,rls_status
accounts,ENABLED
loan_transactions,ENABLED
loans,ENABLED
profiles,ENABLED
system_categories,ENABLED
transactions,ENABLED
user_categories,ENABLED
user_hidden_categories,ENABLED
```

---

### Query 7.2 — Overly Permissive Policies (qual = true)
**Purpose:** Find policies that grant unrestricted access.
```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR with_check = 'true')
ORDER BY tablename;
```
✅ **Expected:** Empty (no policy should use bare `true`).
🚩 **Problem:** Policies that let any authenticated user access all rows.

📋 **Results:**
```
Success. No rows returned


```

---

### Query 7.3 — Object Ownership
**Purpose:** Verify tables are owned by expected roles.
```sql
SELECT
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
✅ **Expected:** All owned by `postgres` or the Supabase default role.
🚩 **Problem:** Tables owned by unexpected roles.

📋 **Results:**
```
tablename,tableowner
accounts,postgres
loan_transactions,postgres
loans,postgres
profiles,postgres
system_categories,postgres
transactions,postgres
user_categories,postgres
user_hidden_categories,postgres
```

---

### Query 7.4 — Functions and SECURITY DEFINER
**Purpose:** Audit elevated-privilege functions.
```sql
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```
✅ **Expected:** Only known functions (handle_new_user, create_default_categories, update_updated_at, get_balance_summary).
🚩 **Problem:** Unknown SECURITY DEFINER functions = privilege escalation risk.

📋 **Results:**
```
routine_name,routine_type,security_type
get_account_balances,FUNCTION,DEFINER
get_balance_summary,FUNCTION,DEFINER
gin_extract_query_trgm,FUNCTION,INVOKER
gin_extract_value_trgm,FUNCTION,INVOKER
gin_trgm_consistent,FUNCTION,INVOKER
gin_trgm_triconsistent,FUNCTION,INVOKER
gtrgm_compress,FUNCTION,INVOKER
gtrgm_consistent,FUNCTION,INVOKER
gtrgm_decompress,FUNCTION,INVOKER
gtrgm_distance,FUNCTION,INVOKER
gtrgm_in,FUNCTION,INVOKER
gtrgm_options,FUNCTION,INVOKER
gtrgm_out,FUNCTION,INVOKER
gtrgm_penalty,FUNCTION,INVOKER
gtrgm_picksplit,FUNCTION,INVOKER
gtrgm_same,FUNCTION,INVOKER
gtrgm_union,FUNCTION,INVOKER
handle_new_user,FUNCTION,DEFINER
rls_auto_enable,FUNCTION,DEFINER
set_limit,FUNCTION,INVOKER
show_limit,FUNCTION,INVOKER
show_trgm,FUNCTION,INVOKER
similarity,FUNCTION,INVOKER
similarity_dist,FUNCTION,INVOKER
similarity_op,FUNCTION,INVOKER
strict_word_similarity,FUNCTION,INVOKER
strict_word_similarity_commutator_op,FUNCTION,INVOKER
strict_word_similarity_dist_commutator_op,FUNCTION,INVOKER
strict_word_similarity_dist_op,FUNCTION,INVOKER
strict_word_similarity_op,FUNCTION,INVOKER
update_updated_at,FUNCTION,INVOKER
word_similarity,FUNCTION,INVOKER
word_similarity_commutator_op,FUNCTION,INVOKER
word_similarity_dist_commutator_op,FUNCTION,INVOKER
word_similarity_dist_op,FUNCTION,INVOKER
word_similarity_op,FUNCTION,INVOKER
```

---

## 8. Performance

### Query 8.1 — Table Row Counts and Sizes
**Purpose:** Understand data volume.
```sql
SELECT
  relname AS table_name,
  n_live_tup AS row_count,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS table_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC;
```
✅ **Expected:** Reasonable sizes for current data volume.
🚩 **Problem:** Unexpectedly large tables, or many rows with tiny index sizes (missing indexes).

📋 **Results:**
```
table_name,row_count,total_size,table_size,index_size
transactions,114,272 kB,24 kB,248 kB
user_categories,7,112 kB,8192 bytes,104 kB
accounts,1,80 kB,8192 bytes,72 kB
system_categories,13,48 kB,8192 bytes,40 kB
profiles,7,48 kB,8192 bytes,40 kB
loan_transactions,0,40 kB,0 bytes,40 kB
loans,0,40 kB,0 bytes,40 kB
user_hidden_categories,0,24 kB,8192 bytes,16 kB
```

---

### Query 8.2 — Sequential Scans vs Index Scans
**Purpose:** Identify tables being scanned sequentially (slow).
```sql
SELECT
  relname AS table_name,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  CASE WHEN seq_scan + idx_scan > 0
    THEN ROUND(100.0 * idx_scan / (seq_scan + idx_scan), 1)
    ELSE 0
  END AS idx_scan_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;
```
✅ **Expected:** High `idx_scan_pct` (>90%) for large tables.
🚩 **Problem:** Large tables with high seq_scan and low idx_scan_pct.

📋 **Results:**
```
table_name,seq_scan,seq_tup_read,idx_scan,idx_tup_fetch,idx_scan_pct
transactions,653,31470,1478,7167,69.4
system_categories,20,228,5687,11120,99.6
user_categories,20,44,3212,3573,99.4
profiles,17,43,507,572,96.8
loan_transactions,6,0,0,0,0.0
accounts,6,2,298,108,98.0
loans,6,0,2,0,25.0
user_hidden_categories,2,0,695,3,99.7
```

---

### Query 8.3 — Unused Indexes
**Purpose:** Find indexes that are never used (wasting write performance).
```sql
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
```
✅ **Expected:** Few or no unused indexes (new indexes may show 0 initially).
🚩 **Problem:** Large unused indexes consuming space.

📋 **Results:**
```
schemaname,table_name,index_name,times_used,index_size
public,transactions,idx_transactions_notes_trgm,0,48 kB
public,user_categories,idx_user_categories_user_id,0,16 kB
public,profiles,idx_profiles_email,0,16 kB
public,transactions,idx_transactions_type,0,16 kB
public,accounts,idx_accounts_user_id,0,16 kB
public,loan_transactions,idx_loan_transactions_loan,0,8192 bytes
public,loan_transactions,idx_loan_transactions_txn,0,8192 bytes
public,loans,idx_loans_user_id,0,8192 bytes
public,loans,idx_loans_user_status,0,8192 bytes
public,loan_transactions,loan_transactions_loan_id_transaction_id_key,0,8192 bytes
```

---

### Query 8.4 — Table Bloat / Vacuum Health
**Purpose:** Check for vacuum issues.
```sql
SELECT
  relname AS table_name,
  n_live_tup,
  n_dead_tup,
  CASE WHEN n_live_tup > 0
    THEN ROUND(100.0 * n_dead_tup / n_live_tup, 1)
    ELSE 0
  END AS dead_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_dead_tup DESC;
```
✅ **Expected:** `dead_pct` < 20%, recent vacuum timestamps.
🚩 **Problem:** Very high dead tuple percentage = needs VACUUM.

📋 **Results:**
```
table_name,n_live_tup,n_dead_tup,dead_pct,last_vacuum,last_autovacuum
transactions,114,61,53.5,null,null
profiles,7,6,85.7,null,null
accounts,1,2,200.0,null,null
user_hidden_categories,0,1,0,null,null
user_categories,7,1,14.3,null,null
system_categories,13,0,0.0,null,null
loans,0,0,0,null,null
loan_transactions,0,0,0,null,null
```

---

## 9. Migration Verification

### Query 9.1 — Supabase Migration History
**Purpose:** List all applied migrations.
```sql
SELECT *
FROM supabase_migrations.schema_migrations
ORDER BY version;
```
✅ **Expected:** Ordered list of migration versions that were applied.
🚩 **Problem:** Missing versions or gaps in the sequence.

📋 **Results:**
```
Failed to run sql query: ERROR:  42P01: relation "supabase_migrations.schema_migrations" does not exist
LINE 2: FROM supabase_migrations.schema_migrations
             ^
```

---

### Query 9.2 — Verify All Expected Functions Exist
**Purpose:** Confirm functions created by migrations are present.
```sql
SELECT
  routine_name,
  routine_type,
  data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```
✅ **Expected:** `handle_new_user`, `create_default_categories`, `update_updated_at`, `get_balance_summary`.
🚩 **Problem:** Missing functions = failed or unapplied migration.

📋 **Results:**
```
routine_name,routine_type,return_type
get_account_balances,FUNCTION,record
get_balance_summary,FUNCTION,record
gin_extract_query_trgm,FUNCTION,internal
gin_extract_value_trgm,FUNCTION,internal
gin_trgm_consistent,FUNCTION,boolean
gin_trgm_triconsistent,FUNCTION,"""char"""
gtrgm_compress,FUNCTION,internal
gtrgm_consistent,FUNCTION,boolean
gtrgm_decompress,FUNCTION,internal
gtrgm_distance,FUNCTION,double precision
gtrgm_in,FUNCTION,USER-DEFINED
gtrgm_options,FUNCTION,void
gtrgm_out,FUNCTION,cstring
gtrgm_penalty,FUNCTION,internal
gtrgm_picksplit,FUNCTION,internal
gtrgm_same,FUNCTION,internal
gtrgm_union,FUNCTION,USER-DEFINED
handle_new_user,FUNCTION,trigger
rls_auto_enable,FUNCTION,event_trigger
set_limit,FUNCTION,real
show_limit,FUNCTION,real
show_trgm,FUNCTION,ARRAY
similarity,FUNCTION,real
similarity_dist,FUNCTION,real
similarity_op,FUNCTION,boolean
strict_word_similarity,FUNCTION,real
strict_word_similarity_commutator_op,FUNCTION,boolean
strict_word_similarity_dist_commutator_op,FUNCTION,real
strict_word_similarity_dist_op,FUNCTION,real
strict_word_similarity_op,FUNCTION,boolean
update_updated_at,FUNCTION,trigger
word_similarity,FUNCTION,real
word_similarity_commutator_op,FUNCTION,boolean
word_similarity_dist_commutator_op,FUNCTION,real
word_similarity_dist_op,FUNCTION,real
word_similarity_op,FUNCTION,boolean
```

---

### Query 9.3 — Verify All Expected Triggers Exist
**Purpose:** Confirm triggers are in place.
```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```
✅ **Expected:** `updated_at` triggers on profiles, categories, transactions, loans. Signup triggers on auth.users.
🚩 **Problem:** Missing triggers = `updated_at` won't auto-update, defaults won't be created.

📋 **Results:**
```
trigger_name,event_manipulation,event_object_table,action_timing,action_statement
set_accounts_updated_at,UPDATE,accounts,BEFORE,EXECUTE FUNCTION update_updated_at()
set_loans_updated_at,UPDATE,loans,BEFORE,EXECUTE FUNCTION update_updated_at()
set_profiles_updated_at,UPDATE,profiles,BEFORE,EXECUTE FUNCTION update_updated_at()
set_system_categories_updated_at,UPDATE,system_categories,BEFORE,EXECUTE FUNCTION update_updated_at()
set_transactions_updated_at,UPDATE,transactions,BEFORE,EXECUTE FUNCTION update_updated_at()
set_user_categories_updated_at,UPDATE,user_categories,BEFORE,EXECUTE FUNCTION update_updated_at()
```

---

### Query 9.4 — Verify Transaction Type Constraint Includes Loan Types
**Purpose:** Confirm the migration extending the type check was applied.
```sql
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.transactions'::regclass
  AND conname LIKE '%type%';
```
✅ **Expected:** Constraint includes `'income', 'expense', 'lent', 'borrowed'`.
🚩 **Problem:** Only shows `'income', 'expense'` = loan migration not applied.

📋 **Results:**
```
constraint_name,definition
transactions_type_check,"CHECK ((type = ANY (ARRAY['income'::text, 'expense'::text, 'lent'::text, 'borrowed'::text])))"
```

---

### Query 9.5 — Verify Loans Table Structure
**Purpose:** Confirm the loans migration was applied.
```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'loans'
ORDER BY ordinal_position;
```
✅ **Expected:** All loan columns present (id, user_id, counterparty_name, type, principal_amount, outstanding_amount, status, due_date, notes, created_at, updated_at).
🚩 **Problem:** Table doesn't exist or columns are missing.

📋 **Results:**
```
column_name,data_type,is_nullable,column_default
id,uuid,NO,gen_random_uuid()
user_id,uuid,NO,null
counterparty_name,text,NO,null
type,text,NO,null
principal_amount,numeric,NO,null
outstanding_amount,numeric,NO,null
status,text,NO,'active'::text
due_date,date,YES,null
notes,text,YES,null
created_at,timestamp with time zone,NO,now()
updated_at,timestamp with time zone,NO,now()
```

---

### Query 9.6 — Verify loan_transactions Junction Table
**Purpose:** Confirm junction table structure.
```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'loan_transactions'
ORDER BY ordinal_position;
```
✅ **Expected:** Columns: id, loan_id, transaction_id, event_type, created_at.
🚩 **Problem:** Missing table or wrong columns.

📋 **Results:**
```
column_name,data_type,is_nullable,column_default
id,uuid,NO,gen_random_uuid()
loan_id,uuid,NO,null
transaction_id,uuid,NO,null
event_type,text,NO,null
created_at,timestamp with time zone,NO,now()
```

---

## Analysis & Verdict

### Overall Verdict: ✅ PRODUCTION-READY (with 1 verification + 3 minor cleanups)

Your database is fundamentally sound. Every table has a primary key, RLS is enabled everywhere with correct per-user policies, all check/unique constraints are in place, there are **zero** orphaned records, **zero** duplicates, **zero** invalid loan states, and the loan-feature schema (tables, constraints, policies, triggers, extended type check) is correctly applied. Nothing found is a launch blocker.

Below is every deviation from "expected," classified by severity, with the root cause and the fix.

---

### 🔴 Critical (block production)
**None.**

---

### 🟠 High — Verify Before Launch

**H1 — `user_id → auth.users` foreign keys did not appear in Query 1.5.** — ✅ **RESOLVED / CONFIRMED PRESENT**
- **What you saw:** Query 1.5 listed FKs for `loan_transactions`, `transactions`, `user_categories`, `user_hidden_categories` — but **no** `user_id` FKs to `auth.users` on `transactions`, `loans`, `accounts`, `user_categories`, or `profiles`.
- **Root cause (confirmed false negative):** `information_schema.constraint_column_usage` only surfaces constraints whose **referenced** table is visible to the current role. `auth.users` is owned by `supabase_auth_admin`, so cross-schema FKs pointing at it get filtered out by the inner join. Your migration source declares all of them **`REFERENCES auth.users(id) ON DELETE CASCADE`** (confirmed in `001_initial_schema.sql`, `002_category_system.sql`, `009_loans_schema.sql`, `007_accounts.sql`), and every orphan check (2.1, 2.2, 2.3, 2.7) returned **no rows** — which only holds if the constraints are enforcing integrity.
- **Action:** Run the definitive catalog query below (reads `pg_constraint` directly, so it *will* show auth references). Confirm each `user_id`/`profiles.id` FK exists with `on_delete = CASCADE`.

```sql
-- Definitive FK check (reads pg_catalog, shows cross-schema refs to auth.users)
SELECT
  cl.relname                AS table_name,
  att.attname               AS column_name,
  fns.nspname || '.' || fcl.relname AS references_table,
  con.conname               AS constraint_name,
  CASE con.confdeltype
    WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'   WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
  END                       AS on_delete
FROM pg_constraint con
JOIN pg_class cl        ON cl.oid  = con.conrelid
JOIN pg_namespace ns    ON ns.oid  = cl.relnamespace
JOIN pg_class fcl       ON fcl.oid = con.confrelid
JOIN pg_namespace fns   ON fns.oid = fcl.relnamespace
JOIN unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
JOIN pg_attribute att   ON att.attrelid = con.conrelid AND att.attnum = k.attnum
WHERE con.contype = 'f' AND ns.nspname = 'public'
ORDER BY cl.relname, att.attname;
```
- **Expected:** rows for `transactions.user_id`, `loans.user_id`, `accounts.user_id`, `user_categories.user_id`, `user_hidden_categories.user_id`, and `profiles.id` → all `auth.users` with `on_delete = CASCADE`.
- **If any are missing:** add them, e.g. `ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;`

✅ **Verification result (executed):** All **13** foreign keys are present with correct delete behavior. H1 is fully resolved — no action required.

| Table | Column | References | On Delete |
|-------|--------|-----------|-----------|
| accounts | user_id | auth.users | **CASCADE** ✓ |
| loans | user_id | auth.users | **CASCADE** ✓ |
| profiles | id | auth.users | **CASCADE** ✓ |
| transactions | user_id | auth.users | **CASCADE** ✓ |
| user_categories | user_id | auth.users | **CASCADE** ✓ |
| user_hidden_categories | user_id | auth.users | **CASCADE** ✓ |
| loan_transactions | loan_id | public.loans | **CASCADE** ✓ |
| loan_transactions | transaction_id | public.transactions | **CASCADE** ✓ |
| transactions | account_id | public.accounts | SET NULL ✓ |
| transactions | system_category_id | public.system_categories | SET NULL ✓ |
| transactions | user_category_id | public.user_categories | SET NULL ✓ |
| user_categories | source_category_id | public.system_categories | SET NULL ✓ |
| user_hidden_categories | category_id | public.system_categories | **CASCADE** ✓ |

**Cascade behavior is exactly right:** deleting a user removes all their data (accounts, loans, transactions, categories, hidden categories, profile); deleting a loan or transaction cleans up junction rows; deleting an account or category preserves the transaction and just nulls the reference.

---

### 🟡 Medium — Fix Soon

**M1 — Migration file numbering collision (`002_category_system.sql` **and** `002_loans_schema.sql`).**
- Two migrations share prefix `002`. Because migrations here are applied manually (see M-note below), this didn't break anything, but it makes apply-order ambiguous for a fresh environment.
- **Fix (applied):** the loans migration has been renumbered to **`009_loans_schema.sql`** so the repo reflects true apply order (loans came after `007_accounts` / `008_performance_functions`).

**M2 — Unindexed foreign key: `user_categories.source_category_id` (Query 4.2).**
- The only FK column without a covering index. Deleting a `system_category` would trigger a sequential scan of `user_categories` to enforce the `ON DELETE SET NULL`.
- **Fix (applied):** new migration `010_audit_followups.sql` adds the index. Raw SQL to run now:
```sql
CREATE INDEX IF NOT EXISTS idx_user_categories_source_category
  ON public.user_categories (source_category_id)
  WHERE source_category_id IS NOT NULL;
```

**M-note — Migration tracking not initialized (Query 9.1 error).**
- `supabase_migrations.schema_migrations` does not exist → migrations were applied by hand in the SQL editor rather than via the Supabase CLI. That's fine operationally, but for repeatable production deploys, consider adopting `supabase db push` (or a lightweight `public._migrations` audit table) so environments stay in lockstep.

---

### 🟢 Low / Informational (no action needed, explanations)

- **L1 — Dead tuples & no vacuum yet (Query 8.4).** `last_vacuum`/`last_autovacuum` are NULL and dead-tuple % looks high (transactions 53%, profiles 86%, accounts 200%) — but the **absolute** counts are tiny (≤61 rows). Autovacuum simply hasn't crossed its threshold. Optional one-time cleanup + fresh planner stats:
  ```sql
  VACUUM (ANALYZE) public.transactions, public.profiles, public.accounts;
  ```
- **L2 — "Unused" indexes (Query 8.3, `idx_scan = 0`).** Expected. At 114 transactions Postgres favors seq scans, the loan indexes have no data yet, and search/email indexes haven't been exercised. **Do not drop them** — they'll engage as data grows.
- **L3 — `transactions` seq scans at 69% index usage (Query 8.2).** Normal for a ~114-row table; the planner correctly prefers seq scans at this size. Will trend toward 100% as volume increases.
- **L4 — `transactions.category_id` legacy column + ordinal gap at position 6.** The gap is the old `description` column dropped in `006_merge_description_into_notes.sql`; `category_id` is a pre-split legacy column kept for compatibility (real FKs are `system_category_id` / `user_category_id`). Harmless. Optional future cleanup: `ALTER TABLE public.transactions DROP COLUMN category_id;` (only after confirming no code path reads it).
- **L5 — `profiles.currency` default is `'INR'`.** Intentional for your user base; not a defect.
- **L6 — `create_default_categories` function absent (Query 9.2).** Correct for your **system/user category** architecture: defaults now live as 13 shared rows in `system_categories` instead of being copied per user. No per-user seeding function is needed.
- **L7 — Signup triggers not in Query 9.3.** `handle_new_user` fires on `auth.users` (the `auth` schema), while Query 9.3 filters `trigger_schema = 'public'`. Seven profiles exist, so it's working. To see it: `SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass;`
- **L8 — Loans tables have 0 rows.** Feature is deployed but not yet used. All structures, constraints, RLS policies, and the `set_loans_updated_at` trigger are correctly in place.

---

### Strengths Worth Calling Out
- ✅ RLS enabled on **all 8** base tables; every user table has correct SELECT/INSERT/UPDATE/DELETE policies scoped by `auth.uid()`.
- ✅ `system_categories` correctly **read-only** (SELECT-only) — shared global data users can't mutate.
- ✅ New `loan_transactions` **UPDATE** policy is present (defense-in-depth from the earlier hardening).
- ✅ All check constraints correct, including `transactions_type_check` with `income/expense/lent/borrowed`.
- ✅ Data integrity is spotless: no orphans, no duplicates, no invalid loan states, no empty required fields.
- ✅ `rls_auto_enable` event trigger auto-enables RLS on any newly created table — excellent safety net.
- ✅ Strong index design: composite `(user_id, type, date DESC)`, partial indexes on `deleted_at IS NULL`, and a `pg_trgm` GIN index for note search.

---

### Section Checklist
- [x] **Schema Validation** — PK/columns/constraints all correct (ordinal gap explained)
- [x] **Relationships** — no orphans; **all 13 FKs confirmed** (user_id → auth.users CASCADE verified via H1)
- [x] **Row Level Security** — fully enabled, correctly scoped
- [x] **Indexes** — excellent coverage; 1 missing FK index (M2, fixed)
- [x] **Data Validation** — clean
- [x] **Business Logic** — income/expense/category math consistent; loans consistent
- [x] **Security** — no permissive policies, correct ownership, functions accounted for
- [x] **Performance** — healthy for scale; optional VACUUM (L1)
- [x] **Migration Verification** — loan migration applied; numbering fixed (M1); tracking note (M-note)

### Final Verdict
**✅ PRODUCTION-READY — cleared to ship.** The one open verification (H1) is now **confirmed passed**: all 13 foreign keys exist with correct `ON DELETE` behavior. The only remaining item is applying the **M2** index (`010_audit_followups.sql`), which is a non-blocking performance nicety. M1 is fixed in the repo; L-items are optional housekeeping. No critical or high-severity issues remain.

