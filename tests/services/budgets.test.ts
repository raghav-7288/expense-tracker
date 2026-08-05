import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBudgets, createBudget, updateBudget, deleteBudget, getBudgetProgress } from '@/services/budgets';

// ─── Mock Supabase ────────────────────────────────────────────────

function buildChain(terminalValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: ReturnType<typeof vi.fn> } = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'is', 'or', 'gte', 'lte', 'order', 'single', 'maybeSingle', 'in'];
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

// Mock categories service
vi.mock('@/services/categories', () => ({
  getMergedCategories: vi.fn().mockResolvedValue({
    data: [
      { id: '00000000-0000-4000-a000-000000000010', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils', source: 'system', isDefault: true, isCustom: false, editable: false, deletable: false, source_category_id: null },
      { id: '00000000-0000-4000-a000-000000000020', name: 'Transport', type: 'expense', color: '#f59e0b', icon: 'car', source: 'system', isDefault: true, isCustom: false, editable: false, deletable: false, source_category_id: null },
      { id: '00000000-0000-4000-a000-000000000030', name: 'Shopping', type: 'expense', color: '#8b5cf6', icon: 'shopping-bag', source: 'user', isDefault: false, isCustom: true, editable: true, deletable: true, source_category_id: null },
    ],
    error: null,
  }),
}));

// Mock transactions service
const mockGetTransactions = vi.fn();
vi.mock('@/services/transactions', () => ({
  getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
}));

// Mock date utils to return fixed dates
vi.mock('@/utils/formatDate', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/formatDate')>();
  return {
    ...original,
    getMonthStart: () => '2026-08-01',
    getMonthEnd: () => '2026-08-31',
    getWeekStart: () => '2026-08-04',
    getWeekEnd: () => '2026-08-10',
  };
});

// ─── Helpers ──────────────────────────────────────────────────────

// Use valid UUID formats so Zod validation passes
const USER_ID = '00000000-0000-4000-a000-000000000001';
const CAT_FOOD = '00000000-0000-4000-a000-000000000010';
const CAT_TRANSPORT = '00000000-0000-4000-a000-000000000020';
const CAT_SHOPPING = '00000000-0000-4000-a000-000000000030';

function buildBudget(overrides: Record<string, unknown> = {}) {
  return {
    id: 'budget-1',
    user_id: USER_ID,
    category_id: CAT_FOOD,
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

function buildTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tx-1',
    user_id: USER_ID,
    category_id: CAT_FOOD,
    type: 'expense',
    amount: 100,
    notes: 'Groceries',
    date: '2026-08-05',
    created_at: '2026-08-05T00:00:00Z',
    updated_at: '2026-08-05T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── CRUD Tests ───────────────────────────────────────────────────

describe('budgets service - CRUD', () => {
  describe('getBudgets', () => {
    it('fetches active budgets ordered by created_at desc', async () => {
      const budgets = [buildBudget(), buildBudget({ id: 'budget-2', category_id: CAT_TRANSPORT })];
      const chain = buildChain({ data: budgets, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getBudgets(USER_ID);

      expect(mockFrom).toHaveBeenCalledWith('budgets');
      expect(chain.select).toHaveBeenCalledWith('*');
      expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID);
      expect(chain.eq).toHaveBeenCalledWith('is_active', true);
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result.data).toEqual(budgets);
      expect(result.error).toBeNull();
    });

    it('returns error when query fails', async () => {
      const chain = buildChain({ data: null, error: { message: 'DB error' } });
      mockFrom.mockReturnValue(chain);

      const result = await getBudgets(USER_ID);

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: 'DB error' });
    });
  });

  describe('createBudget', () => {
    it('validates and inserts a valid budget', async () => {
      const newBudget = buildBudget();
      const chain = buildChain({ data: newBudget, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await createBudget({
        user_id: USER_ID,
        category_id: CAT_FOOD,
        category_source: 'system',
        amount: 500,
        period: 'monthly',
        alert_threshold: 0.8,
      });

      expect(mockFrom).toHaveBeenCalledWith('budgets');
      expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: USER_ID,
        category_id: CAT_FOOD,
        amount: 500,
        period: 'monthly',
      }));
      expect(result.data).toEqual(newBudget);
      expect(result.error).toBeNull();
    });

    it('rejects zero amount', async () => {
      const result = await createBudget({
        user_id: USER_ID,
        category_id: CAT_FOOD,
        category_source: 'system',
        amount: 0,
        period: 'monthly',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: expect.any(String) });
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('rejects negative amount', async () => {
      const result = await createBudget({
        user_id: USER_ID,
        category_id: CAT_FOOD,
        category_source: 'system',
        amount: -100,
        period: 'monthly',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: expect.any(String) });
    });

    it('rejects invalid period', async () => {
      const result = await createBudget({
        user_id: USER_ID,
        category_id: CAT_FOOD,
        category_source: 'system',
        amount: 500,
        period: 'yearly' as 'monthly',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: expect.any(String) });
    });

    it('rejects invalid category_source', async () => {
      const result = await createBudget({
        user_id: USER_ID,
        category_id: CAT_FOOD,
        category_source: 'invalid' as 'system',
        amount: 500,
        period: 'monthly',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: expect.any(String) });
    });

    it('applies default alert_threshold when not provided', async () => {
      const chain = buildChain({ data: buildBudget({ alert_threshold: 0.8 }), error: null });
      mockFrom.mockReturnValue(chain);

      await createBudget({
        user_id: USER_ID,
        category_id: CAT_FOOD,
        category_source: 'system',
        amount: 500,
        period: 'monthly',
      });

      expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({
        alert_threshold: 0.8,
      }));
    });

    it('rejects alert_threshold > 1', async () => {
      const result = await createBudget({
        user_id: USER_ID,
        category_id: CAT_FOOD,
        category_source: 'system',
        amount: 500,
        period: 'monthly',
        alert_threshold: 1.5,
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: expect.any(String) });
    });
  });

  describe('updateBudget', () => {
    it('updates a budget by id', async () => {
      const updated = buildBudget({ amount: 750 });
      const chain = buildChain({ data: updated, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await updateBudget('budget-1', { amount: 750 });

      expect(mockFrom).toHaveBeenCalledWith('budgets');
      expect(chain.update).toHaveBeenCalledWith({ amount: 750 });
      expect(chain.eq).toHaveBeenCalledWith('id', 'budget-1');
      expect(result.data).toEqual(updated);
    });
  });

  describe('deleteBudget', () => {
    it('deletes a budget by id', async () => {
      const chain = buildChain({ data: null, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await deleteBudget('budget-1');

      expect(mockFrom).toHaveBeenCalledWith('budgets');
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith('id', 'budget-1');
      expect(result.error).toBeNull();
    });
  });
});

// ─── Progress Calculation Tests ───────────────────────────────────

describe('budgets service - getBudgetProgress', () => {
  it('returns empty array when no budgets exist', async () => {
    const chain = buildChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const result = await getBudgetProgress(USER_ID);

    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('calculates 0% progress when no transactions exist', async () => {
    const chain = buildChain({ data: [buildBudget()], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({ data: [], error: null });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data).toHaveLength(1);
    const progress = result.data![0];
    expect(progress.spent).toBe(0);
    expect(progress.remaining).toBe(500);
    expect(progress.percentage).toBe(0);
    expect(progress.status).toBe('on_track');
  });

  it('calculates progress with one transaction', async () => {
    const chain = buildChain({ data: [buildBudget({ amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [buildTransaction({ amount: 200, category_id: CAT_FOOD, date: '2026-08-05' })],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    const progress = result.data![0];
    expect(progress.spent).toBe(200);
    expect(progress.remaining).toBe(300);
    expect(progress.percentage).toBe(40);
    expect(progress.status).toBe('on_track');
  });

  it('accumulates multiple transactions for same category', async () => {
    const chain = buildChain({ data: [buildBudget({ amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        buildTransaction({ id: 'tx-1', amount: 150, category_id: CAT_FOOD, date: '2026-08-03' }),
        buildTransaction({ id: 'tx-2', amount: 200, category_id: CAT_FOOD, date: '2026-08-10' }),
        buildTransaction({ id: 'tx-3', amount: 50, category_id: CAT_FOOD, date: '2026-08-20' }),
      ],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    const progress = result.data![0];
    expect(progress.spent).toBe(400);
    expect(progress.remaining).toBe(100);
    expect(progress.percentage).toBe(80);
  });

  it('ignores transactions from other categories', async () => {
    const chain = buildChain({ data: [buildBudget({ category_id: CAT_FOOD, amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        buildTransaction({ amount: 100, category_id: CAT_FOOD, date: '2026-08-05' }),
        buildTransaction({ amount: 999, category_id: CAT_TRANSPORT, date: '2026-08-05' }),
        buildTransaction({ amount: 888, category_id: CAT_SHOPPING, date: '2026-08-05' }),
      ],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data![0].spent).toBe(100);
  });

  it('detects warning status at exactly the threshold (80%)', async () => {
    const chain = buildChain({ data: [buildBudget({ amount: 500, alert_threshold: 0.8 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [buildTransaction({ amount: 400, category_id: CAT_FOOD, date: '2026-08-05' })],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data![0].percentage).toBe(80);
    expect(result.data![0].status).toBe('warning');
  });

  it('detects exceeded status at exactly 100%', async () => {
    const chain = buildChain({ data: [buildBudget({ amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [buildTransaction({ amount: 500, category_id: CAT_FOOD, date: '2026-08-05' })],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data![0].percentage).toBe(100);
    expect(result.data![0].status).toBe('exceeded');
  });

  it('handles overspent budgets (>100%)', async () => {
    const chain = buildChain({ data: [buildBudget({ amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [buildTransaction({ amount: 750, category_id: CAT_FOOD, date: '2026-08-05' })],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    const progress = result.data![0];
    expect(progress.percentage).toBe(150);
    expect(progress.remaining).toBe(0); // never negative
    expect(progress.status).toBe('exceeded');
  });

  it('handles large budget amounts', async () => {
    const chain = buildChain({ data: [buildBudget({ amount: 1000000 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [buildTransaction({ amount: 500000, category_id: CAT_FOOD, date: '2026-08-05' })],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data![0].percentage).toBe(50);
    expect(result.data![0].remaining).toBe(500000);
  });

  it('handles multiple budgets with different categories', async () => {
    const budgets = [
      buildBudget({ id: 'b1', category_id: CAT_FOOD, amount: 500 }),
      buildBudget({ id: 'b2', category_id: CAT_TRANSPORT, amount: 200 }),
    ];
    const chain = buildChain({ data: budgets, error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        buildTransaction({ amount: 300, category_id: CAT_FOOD, date: '2026-08-05' }),
        buildTransaction({ amount: 180, category_id: CAT_TRANSPORT, date: '2026-08-05' }),
      ],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data).toHaveLength(2);
    expect(result.data![0].spent).toBe(300);
    expect(result.data![0].percentage).toBe(60);
    expect(result.data![1].spent).toBe(180);
    expect(result.data![1].percentage).toBe(90);
    expect(result.data![1].status).toBe('warning');
  });

  it('uses weekly date range for weekly budgets', async () => {
    const chain = buildChain({ data: [buildBudget({ period: 'weekly', amount: 100 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        // Within week (Aug 4-10)
        buildTransaction({ id: 'tx-1', amount: 30, category_id: CAT_FOOD, date: '2026-08-05' }),
        // Outside week but within month
        buildTransaction({ id: 'tx-2', amount: 999, category_id: CAT_FOOD, date: '2026-08-15' }),
      ],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    // Only the transaction within the week range should count
    expect(result.data![0].spent).toBe(30);
    expect(result.data![0].percentage).toBe(30);
  });

  it('uses monthly date range for monthly budgets', async () => {
    const chain = buildChain({ data: [buildBudget({ period: 'monthly', amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        buildTransaction({ id: 'tx-1', amount: 100, category_id: CAT_FOOD, date: '2026-08-01' }),
        buildTransaction({ id: 'tx-2', amount: 100, category_id: CAT_FOOD, date: '2026-08-15' }),
        buildTransaction({ id: 'tx-3', amount: 100, category_id: CAT_FOOD, date: '2026-08-31' }),
      ],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data![0].spent).toBe(300);
    expect(result.data![0].percentage).toBe(60);
  });

  it('resolves category name and color from merged categories', async () => {
    const chain = buildChain({ data: [buildBudget({ category_id: CAT_FOOD })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({ data: [], error: null });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data![0].budget.category).toEqual(expect.objectContaining({
      id: CAT_FOOD,
      name: 'Food',
      color: '#ef4444',
    }));
  });

  it('handles unknown category gracefully', async () => {
    const chain = buildChain({ data: [buildBudget({ category_id: '00000000-0000-4000-a000-000000000099' })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({ data: [], error: null });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data![0].budget.category).toBeNull();
  });

  it('returns error when budgets query fails', async () => {
    const chain = buildChain({ data: null, error: { message: 'DB error' } });
    mockFrom.mockReturnValue(chain);

    const result = await getBudgetProgress(USER_ID);

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: 'DB error' });
  });

  it('returns error when transactions query fails', async () => {
    const chain = buildChain({ data: [buildBudget()], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({ data: null, error: { message: 'TX error' } });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data).toBeNull();
    expect(result.error).toEqual({ message: 'TX error' });
  });

  it('handles status just below threshold (on_track at 79%)', async () => {
    const chain = buildChain({ data: [buildBudget({ amount: 1000, alert_threshold: 0.8 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [buildTransaction({ amount: 790, category_id: CAT_FOOD, date: '2026-08-05' })],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data![0].percentage).toBe(79);
    expect(result.data![0].status).toBe('on_track');
  });

  it('handles custom threshold (60%)', async () => {
    const chain = buildChain({ data: [buildBudget({ amount: 500, alert_threshold: 0.6 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [buildTransaction({ amount: 300, category_id: CAT_FOOD, date: '2026-08-05' })],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    // 300/500 = 60% which is >= 0.6*100 = 60
    expect(result.data![0].percentage).toBe(60);
    expect(result.data![0].status).toBe('warning');
  });

  it('filters transactions outside the period window', async () => {
    const chain = buildChain({ data: [buildBudget({ period: 'monthly', amount: 500 })], error: null });
    mockFrom.mockReturnValue(chain);
    mockGetTransactions.mockResolvedValue({
      data: [
        // Before month start — should not count
        buildTransaction({ id: 'tx-old', amount: 999, category_id: CAT_FOOD, date: '2026-07-31' }),
        // Within month — should count
        buildTransaction({ id: 'tx-in', amount: 100, category_id: CAT_FOOD, date: '2026-08-15' }),
        // After month end — should not count
        buildTransaction({ id: 'tx-future', amount: 999, category_id: CAT_FOOD, date: '2026-09-01' }),
      ],
      error: null,
    });

    const result = await getBudgetProgress(USER_ID);

    expect(result.data![0].spent).toBe(100);
  });
});






