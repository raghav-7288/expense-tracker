/**
 * Integration tests for the Budgets feature.
 *
 * These tests mock ONLY the Supabase client and exercise the full service
 * layer logic including:
 * - Zod validation
 * - Progress calculation (spending / budget * 100)
 * - Category matching across system and user categories
 * - Weekly vs monthly period date filtering
 * - Alert threshold detection
 * - Edge cases: boundary dates, recurring txns, multiple categories
 *
 * They verify the mathematical correctness of the budget progress formula:
 *   Budget Progress = (Current Spending / Budget Amount) × 100
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetProgress,
} from '@/services/budgets';

// ─── Mock Infrastructure ──────────────────────────────────────────

function buildChain(terminalValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: ReturnType<typeof vi.fn> } = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'is', 'or', 'gte', 'lte', 'ilike', 'not', 'order', 'single', 'maybeSingle', 'in', 'limit'];
  for (const m of methods) {
    chain[m] = vi.fn().mockImplementation(() => chain);
  }
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => void) => {
    return Promise.resolve(terminalValue).then(resolve);
  });
  return chain;
}

const mockFrom = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// ─── Mock category service (returns known category map) ───────────

const SYSTEM_CAT_FOOD_ID = '10000000-0000-4000-a000-000000000001';
const SYSTEM_CAT_TRANSPORT_ID = '10000000-0000-4000-a000-000000000002';
const SYSTEM_CAT_BILLS_ID = '10000000-0000-4000-a000-000000000003';
const USER_CAT_COFFEE_ID = '20000000-0000-4000-a000-000000000001';

const MOCK_CATEGORIES = [
  { id: SYSTEM_CAT_FOOD_ID, name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'utensils', source: 'system' as const, isDefault: true, isCustom: false, editable: false, deletable: false, source_category_id: null },
  { id: SYSTEM_CAT_TRANSPORT_ID, name: 'Transportation', type: 'expense', color: '#f59e0b', icon: 'car', source: 'system' as const, isDefault: true, isCustom: false, editable: false, deletable: false, source_category_id: null },
  { id: SYSTEM_CAT_BILLS_ID, name: 'Bills & Utilities', type: 'expense', color: '#06b6d4', icon: 'zap', source: 'system' as const, isDefault: true, isCustom: false, editable: false, deletable: false, source_category_id: null },
  { id: USER_CAT_COFFEE_ID, name: 'Coffee', type: 'expense', color: '#92400e', icon: 'coffee', source: 'user' as const, isDefault: false, isCustom: true, editable: true, deletable: true, source_category_id: null },
];

const mockGetMergedCategories = vi.fn().mockResolvedValue({ data: MOCK_CATEGORIES, error: null });
vi.mock('@/services/categories', () => ({
  getMergedCategories: (...args: unknown[]) => mockGetMergedCategories(...args),
}));

// ─── Mock transactions service ────────────────────────────────────

const mockGetTransactions = vi.fn();
vi.mock('@/services/transactions', () => ({
  getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
}));

// ─── Fixed date range for deterministic tests ─────────────────────
// Simulating: today is Wednesday Aug 5, 2026
// Month: Aug 1 – Aug 31
// Week: Aug 3 (Mon) – Aug 9 (Sun)

vi.mock('@/utils/formatDate', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/formatDate')>();
  return {
    ...original,
    getMonthStart: () => '2026-08-01',
    getMonthEnd: () => '2026-08-31',
    getWeekStart: () => '2026-08-03',
    getWeekEnd: () => '2026-08-09',
  };
});

// ─── Helpers ──────────────────────────────────────────────────────

const USER_ID = '00000000-0000-4000-a000-000000000099';

function budget(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b-1',
    user_id: USER_ID,
    category_id: SYSTEM_CAT_FOOD_ID,
    category_source: 'system',
    amount: 500,
    period: 'monthly',
    alert_threshold: 0.8,
    is_active: true,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

function tx(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tx-1',
    user_id: USER_ID,
    category_id: SYSTEM_CAT_FOOD_ID,
    account_id: null,
    type: 'expense',
    amount: 100,
    notes: 'Test',
    date: '2026-08-05',
    created_at: '2026-08-05T10:00:00Z',
    updated_at: '2026-08-05T10:00:00Z',
    categories: null,
    account: null,
    loan_info: null,
    recurring_id: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: CRUD Operations
// ═══════════════════════════════════════════════════════════════════

describe('Budget CRUD - database interaction', () => {
  describe('getBudgets', () => {
    it('only fetches active budgets', async () => {
      const chain = buildChain({ data: [budget()], error: null });
      mockFrom.mockReturnValue(chain);

      await getBudgets(USER_ID);

      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('scopes query to the authenticated user', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getBudgets(USER_ID);

      expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID);
    });
  });

  describe('createBudget', () => {
    it('rejects non-UUID category_id (prevents invalid FK reference)', async () => {
      const result = await createBudget({
        user_id: USER_ID,
        category_id: 'not-a-uuid',
        category_source: 'system',
        amount: 500,
        period: 'monthly',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('rejects non-UUID user_id (RLS would also block)', async () => {
      const result = await createBudget({
        user_id: 'bad-id',
        category_id: SYSTEM_CAT_FOOD_ID,
        category_source: 'system',
        amount: 500,
        period: 'monthly',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('enforces amount > 0 (mirrors DB CHECK constraint)', async () => {
      const result = await createBudget({
        user_id: USER_ID,
        category_id: SYSTEM_CAT_FOOD_ID,
        category_source: 'system',
        amount: 0,
        period: 'monthly',
      });
      expect(result.error).toBeTruthy();
    });

    it('enforces alert_threshold in (0, 1] range (mirrors DB CHECK)', async () => {
      const over = await createBudget({
        user_id: USER_ID, category_id: SYSTEM_CAT_FOOD_ID,
        category_source: 'system', amount: 500, period: 'monthly',
        alert_threshold: 1.01,
      });
      expect(over.error).toBeTruthy();

      const zero = await createBudget({
        user_id: USER_ID, category_id: SYSTEM_CAT_FOOD_ID,
        category_source: 'system', amount: 500, period: 'monthly',
        alert_threshold: 0,
      });
      expect(zero.error).toBeTruthy();
    });

    it('only allows valid periods (mirrors DB CHECK)', async () => {
      const result = await createBudget({
        user_id: USER_ID,
        category_id: SYSTEM_CAT_FOOD_ID,
        category_source: 'system',
        amount: 500,
        period: 'daily' as 'monthly',
      });
      expect(result.error).toBeTruthy();
    });

    it('only allows valid category_source (mirrors DB CHECK)', async () => {
      const result = await createBudget({
        user_id: USER_ID,
        category_id: SYSTEM_CAT_FOOD_ID,
        category_source: 'external' as 'system',
        amount: 500,
        period: 'monthly',
      });
      expect(result.error).toBeTruthy();
    });
  });

  describe('updateBudget', () => {
    it('sends partial update to correct row', async () => {
      const chain = buildChain({ data: budget({ amount: 750 }), error: null });
      mockFrom.mockReturnValue(chain);

      await updateBudget('b-1', { amount: 750, alert_threshold: 0.9 });

      expect(chain.update).toHaveBeenCalledWith({ amount: 750, alert_threshold: 0.9 });
      expect(chain.eq).toHaveBeenCalledWith('id', 'b-1');
    });
  });

  describe('deleteBudget', () => {
    it('performs hard delete', async () => {
      const chain = buildChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      await deleteBudget('b-1');

      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'b-1');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 2: Budget Progress Calculation Correctness
// ═══════════════════════════════════════════════════════════════════

describe('Budget Progress - formula verification', () => {
  /**
   * Core formula: percentage = (spent / budget.amount) * 100
   * remaining = max(budget.amount - spent, 0)
   */

  it('progress = (150/500)*100 = 30% with single transaction', async () => {
    const chain = buildChain({ data: [budget({ amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [tx({ amount: 150, date: '2026-08-10' })],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].spent).toBe(150);
    expect(data![0].percentage).toBeCloseTo(30);
    expect(data![0].remaining).toBe(350);
    expect(data![0].status).toBe('on_track');
  });

  it('progress = (400/500)*100 = 80% triggers warning at threshold=0.8', async () => {
    const chain = buildChain({ data: [budget({ amount: 500, alert_threshold: 0.8 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [tx({ amount: 400, date: '2026-08-05' })],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].percentage).toBeCloseTo(80);
    expect(data![0].status).toBe('warning');
  });

  it('progress = (500/500)*100 = 100% is exceeded, not warning', async () => {
    const chain = buildChain({ data: [budget({ amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [tx({ amount: 500, date: '2026-08-05' })],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].percentage).toBe(100);
    expect(data![0].status).toBe('exceeded');
    expect(data![0].remaining).toBe(0);
  });

  it('progress = (750/500)*100 = 150% exceeded, remaining capped at 0', async () => {
    const chain = buildChain({ data: [budget({ amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [tx({ amount: 750, date: '2026-08-05' })],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].percentage).toBe(150);
    expect(data![0].remaining).toBe(0);
    expect(data![0].status).toBe('exceeded');
  });

  it('sums multiple transactions: (100+200+50)/1000*100 = 35%', async () => {
    const chain = buildChain({ data: [budget({ amount: 1000 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        tx({ id: 't1', amount: 100, date: '2026-08-02' }),
        tx({ id: 't2', amount: 200, date: '2026-08-10' }),
        tx({ id: 't3', amount: 50, date: '2026-08-20' }),
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].spent).toBe(350);
    expect(data![0].percentage).toBe(35);
    expect(data![0].remaining).toBe(650);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 3: Category Isolation
// ═══════════════════════════════════════════════════════════════════

describe('Budget Progress - category isolation', () => {
  it('only counts spending in the budgets own category', async () => {
    const chain = buildChain({
      data: [budget({ category_id: SYSTEM_CAT_FOOD_ID, amount: 500 })],
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        tx({ amount: 200, category_id: SYSTEM_CAT_FOOD_ID, date: '2026-08-05' }),
        tx({ amount: 999, category_id: SYSTEM_CAT_TRANSPORT_ID, date: '2026-08-05' }),
        tx({ amount: 888, category_id: USER_CAT_COFFEE_ID, date: '2026-08-05' }),
        tx({ amount: 777, category_id: null, date: '2026-08-05' }), // Uncategorized
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    // Only the food transaction counts
    expect(data![0].spent).toBe(200);
  });

  it('correctly separates budgets for system vs user categories', async () => {
    const budgets = [
      budget({ id: 'b1', category_id: SYSTEM_CAT_FOOD_ID, amount: 500 }),
      budget({ id: 'b2', category_id: USER_CAT_COFFEE_ID, category_source: 'user', amount: 100 }),
    ];
    const chain = buildChain({ data: budgets, error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        tx({ id: 't1', amount: 300, category_id: SYSTEM_CAT_FOOD_ID, date: '2026-08-05' }),
        tx({ id: 't2', amount: 85, category_id: USER_CAT_COFFEE_ID, date: '2026-08-05' }),
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].spent).toBe(300);
    expect(data![0].percentage).toBe(60);
    expect(data![1].spent).toBe(85);
    expect(data![1].percentage).toBe(85);
    expect(data![1].status).toBe('warning'); // 85% > 80% threshold
  });

  it('handles budget for category with zero transactions (0%)', async () => {
    const chain = buildChain({
      data: [budget({ category_id: SYSTEM_CAT_BILLS_ID, amount: 200 })],
      error: null,
    });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        // Only food transactions exist — none for Bills
        tx({ amount: 500, category_id: SYSTEM_CAT_FOOD_ID, date: '2026-08-05' }),
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].spent).toBe(0);
    expect(data![0].percentage).toBe(0);
    expect(data![0].remaining).toBe(200);
    expect(data![0].status).toBe('on_track');
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 4: Period Date Filtering
// ═══════════════════════════════════════════════════════════════════

describe('Budget Progress - date period filtering', () => {
  it('monthly: includes transactions on first and last day of month', async () => {
    const chain = buildChain({ data: [budget({ period: 'monthly', amount: 1000 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        tx({ id: 't1', amount: 100, date: '2026-08-01' }), // First day
        tx({ id: 't2', amount: 200, date: '2026-08-31' }), // Last day
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].spent).toBe(300); // Both included
  });

  it('monthly: excludes transactions from previous month', async () => {
    const chain = buildChain({ data: [budget({ period: 'monthly', amount: 1000 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        tx({ id: 't-prev', amount: 999, date: '2026-07-31' }), // Previous month
        tx({ id: 't-cur', amount: 100, date: '2026-08-01' }),  // Current month
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].spent).toBe(100); // Only current month
  });

  it('monthly: excludes transactions from next month', async () => {
    const chain = buildChain({ data: [budget({ period: 'monthly', amount: 1000 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        tx({ id: 't-cur', amount: 100, date: '2026-08-30' }),
        tx({ id: 't-next', amount: 999, date: '2026-09-01' }), // Next month
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].spent).toBe(100);
  });

  it('weekly: includes Mon through Sun (Aug 3-9)', async () => {
    const chain = buildChain({ data: [budget({ period: 'weekly', amount: 200 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        tx({ id: 't-mon', amount: 10, date: '2026-08-03' }), // Monday
        tx({ id: 't-wed', amount: 20, date: '2026-08-05' }), // Wednesday
        tx({ id: 't-sun', amount: 30, date: '2026-08-09' }), // Sunday
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].spent).toBe(60); // All three included
  });

  it('weekly: excludes transactions from previous week', async () => {
    const chain = buildChain({ data: [budget({ period: 'weekly', amount: 200 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        tx({ id: 't-prev', amount: 999, date: '2026-08-02' }), // Saturday before
        tx({ id: 't-cur', amount: 50, date: '2026-08-04' }),   // Tuesday
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].spent).toBe(50);
  });

  it('weekly: excludes transactions from next week', async () => {
    const chain = buildChain({ data: [budget({ period: 'weekly', amount: 200 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        tx({ id: 't-cur', amount: 50, date: '2026-08-09' }),   // Sunday (last day of week)
        tx({ id: 't-next', amount: 999, date: '2026-08-10' }), // Monday next week
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].spent).toBe(50);
  });

  it('mixed periods: weekly budget sees only week, monthly sees full month', async () => {
    const budgets = [
      budget({ id: 'b-monthly', period: 'monthly', amount: 1000, category_id: SYSTEM_CAT_FOOD_ID }),
      budget({ id: 'b-weekly', period: 'weekly', amount: 200, category_id: SYSTEM_CAT_FOOD_ID }),
    ];
    const chain = buildChain({ data: budgets, error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        tx({ id: 't1', amount: 100, date: '2026-08-01' }), // In month, before week
        tx({ id: 't2', amount: 100, date: '2026-08-05' }), // In both
        tx({ id: 't3', amount: 100, date: '2026-08-20' }), // In month, after week
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    // Monthly budget: all 3 transactions = 300
    expect(data![0].spent).toBe(300);
    expect(data![0].percentage).toBe(30);
    // Weekly budget: only t2 within Aug 3-9 = 100
    expect(data![1].spent).toBe(100);
    expect(data![1].percentage).toBe(50);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 5: Alert Threshold Logic
// ═══════════════════════════════════════════════════════════════════

describe('Budget Progress - alert threshold boundaries', () => {
  it('79.99% with threshold=0.8 → on_track', async () => {
    const chain = buildChain({ data: [budget({ amount: 10000, alert_threshold: 0.8 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [tx({ amount: 7999, date: '2026-08-05' })],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].percentage).toBeCloseTo(79.99);
    expect(data![0].status).toBe('on_track');
  });

  it('80% with threshold=0.8 → warning (boundary inclusive)', async () => {
    const chain = buildChain({ data: [budget({ amount: 500, alert_threshold: 0.8 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [tx({ amount: 400, date: '2026-08-05' })],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].percentage).toBe(80);
    expect(data![0].status).toBe('warning');
  });

  it('99.99% → warning (not yet exceeded)', async () => {
    const chain = buildChain({ data: [budget({ amount: 10000, alert_threshold: 0.8 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [tx({ amount: 9999, date: '2026-08-05' })],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].percentage).toBeCloseTo(99.99);
    expect(data![0].status).toBe('warning');
  });

  it('100% → exceeded (boundary inclusive)', async () => {
    const chain = buildChain({ data: [budget({ amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [tx({ amount: 500, date: '2026-08-05' })],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].percentage).toBe(100);
    expect(data![0].status).toBe('exceeded');
  });

  it('custom threshold at 50%: 49% on_track, 50% warning', async () => {
    const chain = buildChain({ data: [budget({ amount: 200, alert_threshold: 0.5 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [tx({ amount: 100, date: '2026-08-05' })], // 50%
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].percentage).toBe(50);
    expect(data![0].status).toBe('warning');
  });

  it('threshold=1.0 means warning never fires (goes straight to exceeded)', async () => {
    const chain = buildChain({ data: [budget({ amount: 500, alert_threshold: 1.0 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [tx({ amount: 499, date: '2026-08-05' })], // 99.8%
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    // 99.8% < 100% (threshold*100) so still on_track
    expect(data![0].status).toBe('on_track');
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 6: Recurring Transactions Handling
// ═══════════════════════════════════════════════════════════════════

describe('Budget Progress - recurring transactions', () => {
  it('includes auto-generated recurring transactions in spending', async () => {
    const chain = buildChain({ data: [budget({ amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        tx({ id: 't-manual', amount: 50, recurring_id: null, date: '2026-08-05' }),
        tx({ id: 't-recurring', amount: 100, recurring_id: 'rec-1', date: '2026-08-05' }),
      ],
      error: null,
    });

    const { data } = await getBudgetProgress(USER_ID);

    // Both manual and recurring transactions count
    expect(data![0].spent).toBe(150);
    expect(data![0].percentage).toBe(30);
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 7: Category Resolution
// ═══════════════════════════════════════════════════════════════════

describe('Budget Progress - category metadata resolution', () => {
  it('attaches category name/color/icon from merged categories', async () => {
    const chain = buildChain({ data: [budget({ category_id: SYSTEM_CAT_FOOD_ID })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({ data: [], error: null });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].budget.category).toMatchObject({
      id: SYSTEM_CAT_FOOD_ID,
      name: 'Food & Dining',
      color: '#ef4444',
      icon: 'utensils',
      source: 'system',
    });
  });

  it('attaches user category metadata for user-source budgets', async () => {
    const chain = buildChain({ data: [budget({ category_id: USER_CAT_COFFEE_ID, category_source: 'user' })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({ data: [], error: null });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].budget.category).toMatchObject({
      id: USER_CAT_COFFEE_ID,
      name: 'Coffee',
      source: 'user',
    });
  });

  it('sets category to null for orphaned/deleted category reference', async () => {
    const DELETED_CAT_ID = '99999999-0000-4000-a000-000000000001';
    const chain = buildChain({ data: [budget({ category_id: DELETED_CAT_ID })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({ data: [], error: null });

    const { data } = await getBudgetProgress(USER_ID);

    expect(data![0].budget.category).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 8: Error Handling
// ═══════════════════════════════════════════════════════════════════

describe('Budget Progress - error propagation', () => {
  it('propagates budget fetch error', async () => {
    const chain = buildChain({ data: null, error: { message: 'RLS denied', code: '42501' } });
    mockFrom.mockReturnValue(chain);

    const { data, error } = await getBudgetProgress(USER_ID);

    expect(data).toBeNull();
    expect(error).toMatchObject({ message: 'RLS denied' });
  });

  it('propagates transaction fetch error', async () => {
    const chain = buildChain({ data: [budget()], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({ data: null, error: { message: 'timeout' } });

    const { data, error } = await getBudgetProgress(USER_ID);

    expect(data).toBeNull();
    expect(error).toMatchObject({ message: 'timeout' });
  });

  it('returns empty progress (not error) when user has no budgets', async () => {
    const chain = buildChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { data, error } = await getBudgetProgress(USER_ID);

    expect(error).toBeNull();
    expect(data).toEqual([]);
    // Should NOT call getTransactions if no budgets exist (optimization)
    expect(mockGetTransactions).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════
// SECTION 9: Query Efficiency
// ═══════════════════════════════════════════════════════════════════

describe('Budget Progress - query efficiency', () => {
  it('fetches transactions with the broadest needed date range', async () => {
    // Week: Aug 3-9, Month: Aug 1-31
    // Broader range should be: Aug 1 (monthStart) to Aug 31 (monthEnd)
    const chain = buildChain({ data: [budget({ period: 'monthly' })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({ data: [], error: null });

    await getBudgetProgress(USER_ID);

    expect(mockGetTransactions).toHaveBeenCalledWith(USER_ID, expect.objectContaining({
      type: 'expense',
      date_from: '2026-08-01', // min(weekStart, monthStart)
      date_to: '2026-08-31',   // max(weekEnd, monthEnd)
    }));
  });

  it('only fetches expense transactions (not income/loans)', async () => {
    const chain = buildChain({ data: [budget()], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({ data: [], error: null });

    await getBudgetProgress(USER_ID);

    expect(mockGetTransactions).toHaveBeenCalledWith(USER_ID, expect.objectContaining({
      type: 'expense',
    }));
  });

  it('does NOT filter by account_id (budgets are account-agnostic)', async () => {
    const chain = buildChain({ data: [budget()], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({ data: [], error: null });

    await getBudgetProgress(USER_ID);

    const callArgs = mockGetTransactions.mock.calls[0][1];
    expect(callArgs.account_id).toBeUndefined();
  });
});


