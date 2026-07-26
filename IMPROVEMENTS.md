# IMPROVEMENTS.md — Expense Tracker

> Prioritized roadmap of improvements across UX, features, performance, security, accessibility, maintainability, and scalability.  
> Last updated: July 26, 2026.

---

## High Priority

### 1. Server-Side Dashboard Aggregation
**Category:** Performance  
**Impact:** ⭐⭐⭐⭐⭐ | **Effort:** 2 days

- Create PL/SQL function `get_balance_summary(uid)` that returns `total_income`, `total_expenses`, `monthly_income`, `monthly_expenses` in a single query
- Eliminates fetching entire transaction history (~80-95% data reduction)
- Users with 5000+ transactions currently wait 2-5s for dashboard load

### 2. Recurring Transactions
**Category:** Feature  
**Impact:** ⭐⭐⭐⭐⭐ | **Effort:** 3 days

- Add `recurrence_rule` (RRULE format) and `next_occurrence_date` to transactions
- UI: toggle in TransactionForm + dedicated "Recurring" tab
- Auto-generate upcoming instances on dashboard load
- Covers 80%+ of users' monthly bills (rent, subscriptions, salary)

### 3. Budgets & Spending Alerts
**Category:** Feature  
**Impact:** ⭐⭐⭐⭐ | **Effort:** 3 days

- New `budgets` table: `user_id`, `category_id`, `amount`, `period` (monthly/weekly)
- Dashboard widget showing budget progress bars per category
- Toast notification when spending exceeds threshold (80%, 100%)
- Analytics comparison: budget vs. actual

### 4. Batch CSV Import
**Category:** Performance  
**Impact:** ⭐⭐⭐⭐ | **Effort:** 0.5 days

- Replace sequential single-row inserts with batched `.insert([...rows])` (up to 1000 per request)
- Current: 500 rows = 500 HTTP requests (~30s)
- After: 500 rows = 1 HTTP request (~1s)
- Add duplicate detection (hash of date + amount + notes)

### 5. Full-Text Search with Trigram Index
**Category:** Performance  
**Impact:** ⭐⭐⭐⭐ | **Effort:** 0.5 days

- Enable `pg_trgm` extension and create GIN index on `transactions.notes`
- Current ILIKE search does full table scan on 2000-char text fields
- After: 10-100x faster search with fuzzy matching support

### 6. Account Balance SQL Aggregation
**Category:** Performance  
**Impact:** ⭐⭐⭐⭐ | **Effort:** 1 day

- Replace N+1 fetch pattern with single `GROUP BY account_id, type` JOIN query
- Eliminates race condition between account and transaction fetches
- Reduces memory usage (no JS-side grouping of all transactions)

---

## Medium Priority

### 7. Multi-Currency Transaction Support
**Category:** Feature  
**Impact:** ⭐⭐⭐⭐ | **Effort:** 2 days

- Add `original_currency`, `fx_rate`, `converted_amount` to transactions
- Currency selector per transaction (defaults to profile currency)
- Dashboard totals always in home currency
- Useful for travelers and users with international accounts

### 8. Transaction Splitting
**Category:** Feature  
**Impact:** ⭐⭐⭐ | **Effort:** 2 days

- Allow splitting one transaction across multiple categories
- New `transaction_splits` table: `parent_id`, `category_id`, `amount`
- UI: "Split" button on transaction detail → allocate percentages
- Common use: grocery receipt split between Food/Household

### 9. Smart Category Suggestions
**Category:** UX  
**Impact:** ⭐⭐⭐ | **Effort:** 1.5 days

- Client-side fuzzy matching based on transaction description history
- "Starbucks" → automatically suggests "Coffee" category
- Reduces manual selection by ~60% for returning users
- No ML backend needed — simple frequency-based matching

### 10. Analytics Lazy-Loading (Intersection Observer)
**Category:** Performance  
**Impact:** ⭐⭐⭐ | **Effort:** 1 day

- AnalyticsPage renders 15+ chart components on mount
- Wrap below-fold sections with IntersectionObserver
- Load charts only when user scrolls to them
- Reduces initial render by ~50% (8 charts above fold → 3)

### 11. Virtual Scrolling for Large Transaction Lists
**Category:** Performance  
**Impact:** ⭐⭐⭐ | **Effort:** 1.5 days

- Add `react-window` for transaction lists >200 rows
- Current: renders all rows (potential jank at 1000+)
- After: renders only visible rows (constant 60fps)

### 12. Offline Support with Sync Queue
**Category:** UX  
**Impact:** ⭐⭐⭐ | **Effort:** 3 days

- Add IndexedDB cache for transaction drafts
- Queue mutations when offline, replay on reconnect
- Show "offline" indicator in header
- Users can track expenses anywhere (airplane, subway)

### 13. Advanced Filters & Saved Presets
**Category:** Feature  
**Impact:** ⭐⭐⭐ | **Effort:** 2 days

- Amount range filter (min/max slider)
- "Uncategorized only" quick filter
- Saved filter presets ("Monthly bills", "Entertainment")
- New `saved_filters` table with user-defined names

### 14. Soft Delete for Accounts
**Category:** Data Integrity  
**Impact:** ⭐⭐⭐ | **Effort:** 1 day

- Replace hard delete (`ON DELETE SET NULL`) with `deleted_at` soft delete
- Preserve account name/color on historical transactions
- Add "Archived Accounts" section on Accounts page
- Already have `is_active` flag — extend to full soft-delete pattern

---

## Low Priority

### 15. Color-Blind Accessible Charts
**Category:** Accessibility  
**Impact:** ⭐⭐ | **Effort:** 1 day

- Add patterns/hatching to pie chart segments
- Ensure all charts have text legend with amounts (not color alone)
- Affects ~8% of male users with color vision deficiency

### 16. Screen Reader Amount Formatting
**Category:** Accessibility  
**Impact:** ⭐⭐ | **Effort:** 0.5 days

- Add `aria-label` to formatted currency displays
- "$1,234.56" should read as "one thousand two hundred thirty four dollars and 56 cents"
- Use `Intl.NumberFormat` with `style: 'currency'` for proper vocalization

### 17. Keyboard Navigation for Transaction Table
**Category:** Accessibility  
**Impact:** ⭐⭐ | **Effort:** 1 day

- Add `aria-rowindex` attributes to table rows
- Arrow key navigation between rows
- Enter to open edit modal, Delete for confirmation
- Tab focuses action buttons within row

### 18. Undo/Redo for Destructive Actions
**Category:** UX  
**Impact:** ⭐⭐ | **Effort:** 2 days

- Show "Undo" toast for 5s after delete operations
- Implement command pattern with undo stack
- Covers: delete transaction, delete account, delete category

### 19. Swipe Gestures for Mobile Navigation
**Category:** UX (Mobile)  
**Impact:** ⭐⭐ | **Effort:** 1 day

- Swipe right to go back (match native iOS behavior)
- Swipe left on transaction row to reveal delete action
- Add `react-swipeable` for gesture detection

### 20. Transaction Audit Log
**Category:** Maintainability  
**Impact:** ⭐⭐ | **Effort:** 2 days

- PostgreSQL trigger-based audit log for all transaction changes
- Records: who, what, when, old_value, new_value
- Useful for debugging and dispute resolution
- Table: `audit_log(table_name, record_id, action, old_data, new_data, user_id, timestamp)`

---

## Quick Wins (< 4 hours each)

| # | Improvement | Category | Effort |
|---|-------------|----------|--------|
| 1 | Add composite index `idx_transactions_user_account` | Performance | 30 min |
| 2 | Drop legacy `categories` table | Maintainability | 30 min |
| 3 | Fix analytics cache key scoping (add userId) | Performance | 1 hour |
| 4 | Add rate limiting to CSV import (1 per 5 min) | Security | 2 hours |
| 5 | Add `aria-label` to currency amounts | Accessibility | 2 hours |
| 6 | Add filename timestamp to CSV exports | UX | 30 min |
| 7 | Show transaction count in page header | UX | 1 hour |
| 8 | Add "Duplicate" action to transaction row | UX | 2 hours |
| 9 | Keyboard shortcut: `N` to create new transaction | UX | 1 hour |
| 10 | Add loading skeleton to Account page | UX | 1 hour |

---

## Long-term Ideas (Future Roadmap)

### Bank Integration (Plaid / TrueLayer)
- Auto-import transactions from bank accounts
- Eliminates manual data entry for 80%+ of transactions
- Requires financial data partnership and compliance (PCI-DSS considerations)
- **Effort:** 1-2 weeks | **Impact:** Transformative for product

### Receipt OCR Scanning
- Snap photo of receipt → auto-extract amount, date, merchant
- Use Tesseract.js (client-side) or AWS Textract (server-side)
- **Effort:** 2-3 days | **Impact:** Major UX improvement for cash transactions

### Expense Sharing / Multi-User Accounts
- Split expenses with roommates, partners, or teams
- New tables: `account_members`, `expense_splits`, `settlements`
- Social features: request payment, track who owes whom
- **Effort:** 1-2 weeks | **Impact:** Expands TAM to shared-living users

### AI-Powered Insights
- Natural language queries: "How much did I spend on food last quarter?"
- Anomaly detection: "You spent 3x more on dining this month"
- Forecasting: "At this rate, you'll exceed your budget by the 25th"
- **Effort:** 1 week (with LLM API) | **Impact:** Premium differentiation

### Real-Time Multi-Device Sync
- Supabase Realtime subscriptions for instant cross-device updates
- Conflict resolution for simultaneous edits
- **Effort:** 2-3 days | **Impact:** Essential for multi-device users

### Mobile Native App (React Native)
- Share 70% of business logic with web app
- Push notifications for budget alerts and recurring reminders
- Offline-first architecture with sync
- **Effort:** 2-4 weeks | **Impact:** Large user acquisition channel

### Data Visualization Dashboard Builder
- Drag-and-drop widget arrangement
- Custom charts (user picks X/Y axes, filters)
- Embeddable widgets for personal websites/blogs
- **Effort:** 2 weeks | **Impact:** Power user differentiation

---

## Priority Execution Order

```
Sprint 1 (Week 1-2):
  → Quick Wins #1-5 (indexes, cache fix, rate limit)
  → Batch CSV Import (#4)
  → Full-text search index (#5)

Sprint 2 (Week 3-4):
  → Dashboard SQL aggregation (#1)
  → Account balance aggregation (#6)
  → Analytics lazy-loading (#10)

Sprint 3 (Week 5-6):
  → Recurring transactions (#2)
  → Smart category suggestions (#9)

Sprint 4 (Week 7-8):
  → Budgets & alerts (#3)
  → Advanced filters & presets (#13)

Sprint 5 (Week 9-10):
  → Multi-currency (#7)
  → Transaction splitting (#8)
  → Accessibility fixes (#15-17)
```

---

## Metrics to Track

| Metric | Current | Target |
|--------|---------|--------|
| Dashboard load time (P95) | ~2s (estimated) | < 500ms |
| Transaction search latency | ~500ms (table scan) | < 50ms (indexed) |
| CSV import (500 rows) | ~30s | < 2s |
| Test coverage | 84.39% | > 90% |
| Lighthouse Performance | Unknown | > 90 |
| Bundle size (gzipped) | 139KB main | < 120KB |
| Time to Interactive | Unknown | < 2s |

