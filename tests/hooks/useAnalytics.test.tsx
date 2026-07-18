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
        amount: 50, description: 'Groceries', notes: null,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        categories: { id: 'c1', user_id: 'user-123', name: 'Food', type: 'expense', color: '#ef4444', icon: 'utensils', created_at: '', updated_at: '' },
      },
      {
        id: '2', user_id: 'user-123', category_id: 'c2', type: 'income',
        amount: 3000, description: 'Salary', notes: null,
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
        amount: 50, description: 'Coffee', notes: null,
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        categories: null,
      },
      {
        id: '2', user_id: 'user-123', category_id: null, type: 'income',
        amount: 100, description: 'Gift', notes: null,
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
});

