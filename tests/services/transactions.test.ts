import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, getMonthlyStats } from '@/services/transactions';

// Build a fully-chainable mock: every method returns the chain,
// and the chain is thenable to resolve with terminalValue
function buildChain(terminalValue: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> & { then?: ReturnType<typeof vi.fn> } = {};
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'or', 'gte', 'lte', 'ilike', 'order', 'single', 'maybeSingle'];
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
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

// Build a raw row as Supabase would return with joined relations
function rawRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'txn-1',
    user_id: 'user-1',
    category_id: null,
    system_category_id: null,
    user_category_id: null,
    type: 'expense',
    amount: 100,
    description: 'Test',
    notes: null,
    date: '2024-06-15',
    created_at: '2024-06-15T10:00:00Z',
    updated_at: '2024-06-15T10:00:00Z',
    system_cat: null,
    user_cat: null,
    ...overrides,
  };
}

describe('transactions service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('returns normalized transactions', async () => {
      const rows = [rawRow({ system_category_id: 'sc-1', system_cat: { id: 'sc-1', name: 'Food', color: '#f00', icon: 'utensils' } })];
      mockFrom.mockReturnValue(buildChain({ data: rows, error: null }));

      const result = await getTransactions('user-1');
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.category_id).toBe('sc-1');
      expect(result.data?.[0]?.categories?.name).toBe('Food');
    });

    it('applies type filter', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getTransactions('user-1', { type: 'income' });
      expect(chain.eq).toHaveBeenCalledWith('type', 'income');
    });

    it('does not filter when type is all', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getTransactions('user-1', { type: 'all' });
      expect(chain.eq).not.toHaveBeenCalledWith('type', 'all');
    });

    it('applies category_id filter using or', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getTransactions('user-1', { category_id: 'cat-1' });
      expect(chain.or).toHaveBeenCalledWith('system_category_id.eq.cat-1,user_category_id.eq.cat-1');
    });

    it('applies date filters', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getTransactions('user-1', { date_from: '2024-01-01', date_to: '2024-12-31' });
      expect(chain.gte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(chain.lte).toHaveBeenCalledWith('date', '2024-12-31');
    });

    it('applies search filter', async () => {
      const chain = buildChain({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await getTransactions('user-1', { search: 'grocery' });
      expect(chain.ilike).toHaveBeenCalledWith('description', '%grocery%');
    });

    it('returns error on failure', async () => {
      const error = { message: 'DB error' };
      mockFrom.mockReturnValue(buildChain({ data: null, error }));

      const result = await getTransactions('user-1');
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  describe('getTransaction', () => {
    it('returns normalized single transaction', async () => {
      const row = rawRow({ user_category_id: 'uc-1', user_cat: { id: 'uc-1', name: 'Custom', color: '#00f', icon: 'tag' } });
      mockFrom.mockReturnValue(buildChain({ data: row, error: null }));

      const result = await getTransaction('txn-1');
      expect(result.data?.category_id).toBe('uc-1');
      expect(result.data?.categories?.name).toBe('Custom');
    });

    it('returns error on failure', async () => {
      mockFrom.mockReturnValue(buildChain({ data: null, error: { message: 'Not found' } }));

      const result = await getTransaction('nonexistent');
      expect(result.data).toBeNull();
    });
  });

  describe('createTransaction', () => {
    it('resolves system category and creates transaction', async () => {
      const row = rawRow({ system_category_id: 'sc-1' });
      let callIdx = 0;
      mockFrom.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) {
          // resolveCategoryColumns: check system_categories
          return buildChain({ data: { id: 'sc-1' }, error: null });
        }
        // actual insert
        return buildChain({ data: row, error: null });
      });

      const result = await createTransaction({
        user_id: 'user-1', type: 'expense', amount: 100,
        description: 'Test', date: '2024-01-01', category_id: 'sc-1',
      });
      expect(result.data?.id).toBe('txn-1');
    });

    it('resolves user category when not system', async () => {
      const row = rawRow({ user_category_id: 'uc-1' });
      let callIdx = 0;
      mockFrom.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) {
          // resolveCategoryColumns: check system_categories - not found
          return buildChain({ data: null, error: null });
        }
        // actual insert
        return buildChain({ data: row, error: null });
      });

      const result = await createTransaction({
        user_id: 'user-1', type: 'expense', amount: 50,
        description: 'Custom cat', date: '2024-01-01', category_id: 'uc-1',
      });
      expect(result.data?.id).toBe('txn-1');
    });

    it('handles null category_id', async () => {
      const row = rawRow();
      mockFrom.mockReturnValue(buildChain({ data: row, error: null }));

      const result = await createTransaction({
        user_id: 'user-1', type: 'expense', amount: 100,
        description: 'No cat', date: '2024-01-01', category_id: null,
      });
      expect(result.data?.category_id).toBeNull();
    });
  });

  describe('updateTransaction', () => {
    it('updates and resolves category', async () => {
      const row = rawRow({ amount: 200 });
      let callIdx = 0;
      mockFrom.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return buildChain({ data: { id: 'sc-1' }, error: null });
        return buildChain({ data: row, error: null });
      });

      const result = await updateTransaction('txn-1', { amount: 200, category_id: 'sc-1' });
      expect(result.data?.amount).toBe(200);
    });

    it('updates without category change', async () => {
      const row = rawRow({ amount: 300 });
      mockFrom.mockReturnValue(buildChain({ data: row, error: null }));

      const result = await updateTransaction('txn-1', { amount: 300 });
      expect(result.data?.amount).toBe(300);
    });
  });

  describe('deleteTransaction', () => {
    it('returns no error on success', async () => {
      mockFrom.mockReturnValue(buildChain({ error: null }));

      const result = await deleteTransaction('txn-1');
      expect(result.error).toBeNull();
    });
  });

  describe('getMonthlyStats', () => {
    it('returns monthly data for given year', async () => {
      const data = [{ type: 'income', amount: 1000, date: '2024-03-15' }];
      mockFrom.mockReturnValue(buildChain({ data, error: null }));

      const result = await getMonthlyStats('user-1', 2024);
      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
    });
  });
});
