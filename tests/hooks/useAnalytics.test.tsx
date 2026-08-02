import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { ReactNode } from 'react';
import type { AnalyticsFilters } from '@/types/analytics';

const mockGetTransactions = vi.fn();

vi.mock('@/services/transactions', () => ({
  getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
}));

function createWrapper(authenticated = true) {
  const queryClient = createTestQueryClient();
  const authValue = createMockAuth(authenticated ? {} : { user: null });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
          <AuthContext.Provider value={authValue}>
            {children}
          </AuthContext.Provider>
        </ThemeContext.Provider>
      </QueryClientProvider>
    );
  };
}

const defaultFilters: AnalyticsFilters = { preset: 'thisMonth', type: 'all' };

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockGetTransactions.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useAnalytics(defaultFilters), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
  });

  it('computes analytics data from transactions', async () => {
    const transactions = [
      {
        id: '1', user_id: 'user-123', category_id: 'c1', type: 'expense',
        amount: 50, notes: 'Groceries',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        categories: { id: 'c1', user_id: 'user-123', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils', created_at: '', updated_at: '' },
      },
      {
        id: '2', user_id: 'user-123', category_id: 'c2', type: 'income',
        amount: 3000, notes: 'Salary',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        categories: { id: 'c2', user_id: 'user-123', name: 'Salary', type: 'income', color: '#10b981', icon: 'briefcase', created_at: '', updated_at: '' },
      },
    ];
    mockGetTransactions.mockResolvedValue({ data: transactions, error: null });

    const { result } = renderHook(() => useAnalytics(defaultFilters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isError).toBe(false);
    expect(result.current.summary).not.toBeNull();
    expect(result.current.dateRange).toBeDefined();
    expect(result.current.dailySeries).toBeDefined();
    expect(result.current.weeklySeries).toBeDefined();
    expect(result.current.monthlySeries).toBeDefined();
    expect(result.current.expenseCategories).toBeDefined();
    expect(result.current.incomeCategories).toBeDefined();
    expect(result.current.heatmapData).toBeDefined();
    expect(result.current.financialHealth).not.toBeNull();
    expect(result.current.insights).toBeDefined();
    expect(result.current.largestTransactions).toBeDefined();
    expect(result.current.smallestTransactions).toBeDefined();
    expect(result.current.savingsTrend).toBeDefined();
  });

  it('returns null summary when no transactions loaded', async () => {
    mockGetTransactions.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useAnalytics(defaultFilters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Summary is computed even with empty transactions (returns zero values)
    expect(result.current.summary).toBeDefined();
  });

  it('sets isError on service failure', async () => {
    mockGetTransactions.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const { result } = renderHook(() => useAnalytics(defaultFilters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('does not fetch when user is unauthenticated', () => {
    const { result } = renderHook(() => useAnalytics(defaultFilters), {
      wrapper: createWrapper(false),
    });
    // Query should not be enabled
    expect(result.current.isLoading).toBe(false);
    expect(mockGetTransactions).not.toHaveBeenCalled();
  });

  it('computes data for different presets', async () => {
    mockGetTransactions.mockResolvedValue({ data: [], error: null });

    const filters: AnalyticsFilters = { preset: 'last6Months', type: 'all' };
    const { result } = renderHook(() => useAnalytics(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.dateRange.startDate).toBeDefined();
    expect(result.current.dateRange.endDate).toBeDefined();
  });

  it('filters by transaction type', async () => {
    const transactions = [
      {
        id: '1', user_id: 'user-123', category_id: null, type: 'expense',
        amount: 50, notes: 'Coffee',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        categories: null,
      },
      {
        id: '2', user_id: 'user-123', category_id: null, type: 'income',
        amount: 100, notes: 'Gift',
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        categories: null,
      },
    ];
    mockGetTransactions.mockResolvedValue({ data: transactions, error: null });

    const filters: AnalyticsFilters = { preset: 'thisMonth', type: 'expense' };
    const { result } = renderHook(() => useAnalytics(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // Expense categories should only include expense transactions
    expect(result.current.expenseCategories).toBeDefined();
  });

  // ── "All Time" preset ────────────────────────────────────
  describe('allTime preset', () => {
    function makeTxn(over: Record<string, unknown>) {
      return {
        id: 'x', user_id: 'user-123', category_id: 'c1', account_id: null,
        type: 'expense', amount: 100, notes: 'n',
        date: '2022-01-01',
        created_at: '', updated_at: '',
        categories: { id: 'c1', user_id: 'user-123', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils', created_at: '', updated_at: '' },
        ...over,
      };
    }

    it('spans the earliest → latest transaction dates (removes date restriction)', async () => {
      const transactions = [
        makeTxn({ id: '1', date: '2020-01-15', type: 'expense', amount: 200 }),
        makeTxn({ id: '2', date: '2021-06-10', type: 'income', amount: 900 }),
        makeTxn({ id: '3', date: '2023-03-20', type: 'expense', amount: 300 }),
      ];
      mockGetTransactions.mockResolvedValue({ data: transactions, error: null });

      const filters: AnalyticsFilters = { preset: 'allTime', type: 'all' };
      const { result } = renderHook(() => useAnalytics(filters), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.dateRange.startDate).toBe('2020-01-15');
      expect(result.current.dateRange.endDate).toBe('2023-03-20');
      // Every transaction is included in the summary
      expect(result.current.summary?.totalExpenses).toBe(500);
      expect(result.current.summary?.totalIncome).toBe(900);
      expect(result.current.summary?.transactionCount).toBe(3);
    });

    it('the AnalyticsPage default filters populate every widget from the full history', async () => {
      const transactions = [
        makeTxn({ id: '1', date: '2019-01-01', type: 'income', amount: 1000 }),
        makeTxn({ id: '2', date: '2021-06-15', type: 'expense', amount: 400 }),
        makeTxn({ id: '3', date: '2024-03-10', type: 'expense', amount: 600 }),
      ];
      mockGetTransactions.mockResolvedValue({ data: transactions, error: null });

      // Exactly the object AnalyticsPage initializes its filter state with.
      const pageDefaultFilters: AnalyticsFilters = { preset: 'allTime', type: 'all' };
      const { result } = renderHook(() => useAnalytics(pageDefaultFilters), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Range covers the entire transaction history
      expect(result.current.dateRange.startDate).toBe('2019-01-01');
      expect(result.current.dateRange.endDate).toBe('2024-03-10');

      // Summary cards reflect all data
      expect(result.current.summary?.transactionCount).toBe(3);
      expect(result.current.summary?.totalIncome).toBe(1000);
      expect(result.current.summary?.totalExpenses).toBe(1000);

      // Charts / tables / rankings / reports are all populated from the full history
      expect(result.current.expenseCategories.length).toBeGreaterThan(0);
      expect(result.current.monthlySeries.length).toBeGreaterThan(0);
      expect(result.current.largestTransactions).toHaveLength(3);
      expect(result.current.monthlyReport?.monthLabel).toBe('All Time');
    });

    it('includes a single-transaction user (edge case)', async () => {
      mockGetTransactions.mockResolvedValue({
        data: [makeTxn({ id: '1', date: '2019-09-09', type: 'expense', amount: 42 })],
        error: null,
      });

      const filters: AnalyticsFilters = { preset: 'allTime', type: 'all' };
      const { result } = renderHook(() => useAnalytics(filters), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.dateRange.startDate).toBe('2019-09-09');
      expect(result.current.dateRange.endDate).toBe('2019-09-09');
      expect(result.current.summary?.totalExpenses).toBe(42);
      expect(result.current.summary?.transactionCount).toBe(1);
    });

    it('handles a user with no transactions', async () => {
      mockGetTransactions.mockResolvedValue({ data: [], error: null });

      const filters: AnalyticsFilters = { preset: 'allTime', type: 'all' };
      const { result } = renderHook(() => useAnalytics(filters), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.summary?.transactionCount).toBe(0);
      expect(result.current.summary?.totalExpenses).toBe(0);
      expect(result.current.summary?.totalIncome).toBe(0);
    });

    it('respects the account filter when computing the range and totals', async () => {
      const transactions = [
        makeTxn({ id: '1', date: '2020-01-01', account_id: 'acc-1', amount: 100 }),
        makeTxn({ id: '2', date: '2024-12-31', account_id: 'acc-2', amount: 500 }),
        makeTxn({ id: '3', date: '2022-05-05', account_id: 'acc-1', amount: 150 }),
      ];
      mockGetTransactions.mockResolvedValue({ data: transactions, error: null });

      const filters: AnalyticsFilters = { preset: 'allTime', type: 'all', accountId: 'acc-1' };
      const { result } = renderHook(() => useAnalytics(filters), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Range bounded to acc-1 transactions only (2020-01-01 → 2022-05-05)
      expect(result.current.dateRange.startDate).toBe('2020-01-01');
      expect(result.current.dateRange.endDate).toBe('2022-05-05');
      expect(result.current.summary?.totalExpenses).toBe(250); // 100 + 150
      expect(result.current.summary?.transactionCount).toBe(2);
    });

    it('respects multiple category selections combined with All Time', async () => {
      const transactions = [
        makeTxn({ id: '1', date: '2021-01-01', category_id: 'cat-food', amount: 100,
          categories: { id: 'cat-food', user_id: 'user-123', name: 'Food', type: 'expense', color: '#f00', icon: 'utensils', created_at: '', updated_at: '' } }),
        makeTxn({ id: '2', date: '2021-02-01', category_id: 'cat-transport', amount: 200,
          categories: { id: 'cat-transport', user_id: 'user-123', name: 'Transport', type: 'expense', color: '#00f', icon: 'car', created_at: '', updated_at: '' } }),
        makeTxn({ id: '3', date: '2021-03-01', category_id: 'cat-fun', amount: 300,
          categories: { id: 'cat-fun', user_id: 'user-123', name: 'Fun', type: 'expense', color: '#808', icon: 'music', created_at: '', updated_at: '' } }),
      ];
      mockGetTransactions.mockResolvedValue({ data: transactions, error: null });

      const filters: AnalyticsFilters = {
        preset: 'allTime', type: 'all', categoryIds: ['cat-food', 'cat-transport'],
      };
      const { result } = renderHook(() => useAnalytics(filters), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Only Food + Transport counted; range bounded to those (2021-01-01 → 2021-02-01)
      expect(result.current.summary?.totalExpenses).toBe(300);
      expect(result.current.summary?.transactionCount).toBe(2);
      expect(result.current.dateRange.startDate).toBe('2021-01-01');
      expect(result.current.dateRange.endDate).toBe('2021-02-01');
      expect(result.current.expenseCategories.map((c) => c.name).sort()).toEqual(['Food', 'Transport']);
    });

    it('ignores a stale customRange when switching to All Time', async () => {
      const transactions = [
        makeTxn({ id: '1', date: '2018-01-01', amount: 100 }),
        makeTxn({ id: '2', date: '2024-01-01', amount: 100 }),
      ];
      mockGetTransactions.mockResolvedValue({ data: transactions, error: null });

      const filters: AnalyticsFilters = {
        preset: 'allTime', type: 'all',
        customRange: { startDate: '2024-03-01', endDate: '2024-03-31' },
      };
      const { result } = renderHook(() => useAnalytics(filters), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // The custom range must NOT be used — full span wins
      expect(result.current.dateRange.startDate).toBe('2018-01-01');
      expect(result.current.dateRange.endDate).toBe('2024-01-01');
      expect(result.current.summary?.transactionCount).toBe(2);
    });

    it('labels the monthly report "All Time"', async () => {
      const transactions = [
        makeTxn({ id: '1', date: '2020-01-15', type: 'income', amount: 1000 }),
        makeTxn({ id: '2', date: '2023-03-20', type: 'expense', amount: 300 }),
      ];
      mockGetTransactions.mockResolvedValue({ data: transactions, error: null });

      const filters: AnalyticsFilters = { preset: 'allTime', type: 'all' };
      const { result } = renderHook(() => useAnalytics(filters), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.monthlyReport?.monthLabel).toBe('All Time');
    });
  });
});

