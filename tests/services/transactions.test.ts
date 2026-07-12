import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction, getMonthlyStats } from '@/services/transactions';

let mockChain: Record<string, unknown>;

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}));

describe('transactions service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('returns transactions without filters', async () => {
      const data = [{ id: '1', description: 'Test' }];
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data, error: null }),
      };

      const result = await getTransactions('user-1');
      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
    });

    it('applies type filter', async () => {
      const eqMock = vi.fn().mockReturnThis();
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: eqMock,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      await getTransactions('user-1', { type: 'income' });
      // eq should be called for user_id and type
      expect(eqMock).toHaveBeenCalledWith('type', 'income');
    });

    it('does not filter when type is all', async () => {
      const eqMock = vi.fn().mockReturnThis();
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: eqMock,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      await getTransactions('user-1', { type: 'all' });
      // eq called only for user_id, not for type
      expect(eqMock).not.toHaveBeenCalledWith('type', 'all');
    });

    it('applies category_id filter', async () => {
      const eqMock = vi.fn().mockReturnThis();
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: eqMock,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      await getTransactions('user-1', { category_id: 'cat-1' });
      expect(eqMock).toHaveBeenCalledWith('category_id', 'cat-1');
    });

    it('applies date_from filter', async () => {
      const gteMock = vi.fn().mockReturnThis();
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: gteMock,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      await getTransactions('user-1', { date_from: '2024-01-01' });
      expect(gteMock).toHaveBeenCalledWith('date', '2024-01-01');
    });

    it('applies date_to filter', async () => {
      const lteMock = vi.fn().mockReturnThis();
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        lte: lteMock,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      await getTransactions('user-1', { date_to: '2024-12-31' });
      expect(lteMock).toHaveBeenCalledWith('date', '2024-12-31');
    });

    it('applies search filter', async () => {
      const ilikeMock = vi.fn().mockReturnThis();
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: ilikeMock,
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      await getTransactions('user-1', { search: 'grocery' });
      expect(ilikeMock).toHaveBeenCalledWith('description', '%grocery%');
    });

    it('sorts by amount when specified', async () => {
      const orderMock = vi.fn().mockReturnThis();
      // The last order call in the chain resolves the query
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: orderMock,
      };
      // Make the chain thenable so await resolves
      Object.defineProperty(mockChain, 'then', {
        value: (resolve: (v: unknown) => unknown) => Promise.resolve(resolve({ data: [], error: null })),
      });

      await getTransactions('user-1', { sort_by: 'amount', sort_order: 'desc' });
      expect(orderMock).toHaveBeenCalledWith('amount', { ascending: false });
      // Also orders by date as secondary sort
      expect(orderMock).toHaveBeenCalledWith('date', { ascending: false });
    });
  });

  describe('getTransaction', () => {
    it('returns single transaction', async () => {
      const txn = { id: '1', description: 'Test' };
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: txn, error: null }),
      };

      const result = await getTransaction('1');
      expect(result.data).toEqual(txn);
    });
  });

  describe('createTransaction', () => {
    it('returns created transaction', async () => {
      const txn = { id: '1', amount: 100 };
      mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: txn, error: null }),
      };

      const result = await createTransaction({
        user_id: 'u1', type: 'expense', amount: 100,
        description: 'Test', date: '2024-01-01', category_id: null,
      });
      expect(result.data).toEqual(txn);
    });
  });

  describe('updateTransaction', () => {
    it('returns updated transaction', async () => {
      const txn = { id: '1', amount: 200 };
      mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: txn, error: null }),
      };

      const result = await updateTransaction('1', { amount: 200 });
      expect(result.data).toEqual(txn);
    });
  });

  describe('deleteTransaction', () => {
    it('returns no error on success', async () => {
      mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      const result = await deleteTransaction('1');
      expect(result.error).toBeNull();
    });
  });

  describe('getMonthlyStats', () => {
    it('returns monthly data for given year', async () => {
      const data = [{ type: 'income', amount: 1000, date: '2024-03-15' }];
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockResolvedValue({ data, error: null }),
      };

      const result = await getMonthlyStats('user-1', 2024);
      expect(result.data).toEqual(data);
      expect(result.error).toBeNull();
    });
  });
});


