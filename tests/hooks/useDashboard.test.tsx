import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import { useDashboardStats, useRecentTransactions, useMonthlyData, useCategoryBreakdown } from '@/hooks/useDashboard';
import type { ReactNode } from 'react';

const mockGetTransactions = vi.fn();
const mockGetMonthlyStats = vi.fn();

vi.mock('@/services/transactions', () => ({
  getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
  getMonthlyStats: (...args: unknown[]) => mockGetMonthlyStats(...args),
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  const authValue = createMockAuth();
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

describe('useDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates stats from transactions', async () => {
    mockGetTransactions.mockResolvedValue({
      data: [
        { type: 'income', amount: 1000, date: '2024-06-01' },
        { type: 'expense', amount: 300, date: '2024-06-15' },
        { type: 'income', amount: 500, date: '2024-05-01' },
      ],
      error: null,
    });

    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(result.current.data!.totalIncome).toBeGreaterThan(0);
  });

  it('handles service error', async () => {
    mockGetTransactions.mockResolvedValue({ data: null, error: { message: 'Failed' } });

    const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useRecentTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns limited recent transactions', async () => {
    const txns = Array.from({ length: 10 }, (_, i) => ({
      id: String(i), type: 'expense', amount: 10, description: `T${i}`,
      date: '2024-06-01', user_id: 'u1', category_id: null, notes: null,
    }));
    mockGetTransactions.mockResolvedValue({ data: txns, error: null });

    const { result } = renderHook(() => useRecentTransactions(5), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(5);
  });
});

describe('useMonthlyData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggregates monthly income and expenses', async () => {
    const year = new Date().getFullYear();
    mockGetMonthlyStats.mockResolvedValue({
      data: [
        { type: 'income', amount: 1000, date: `${year}-03-15` },
        { type: 'expense', amount: 500, date: `${year}-03-20` },
        { type: 'income', amount: 800, date: `${year}-06-10` },
      ],
      error: null,
    });

    const { result } = renderHook(() => useMonthlyData(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(12);
    const march = result.current.data!.find(m => m.month === 'Mar');
    expect(march?.income).toBe(1000);
    expect(march?.expenses).toBe(500);
  });
});

describe('useCategoryBreakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('groups expenses by category', async () => {
    mockGetTransactions.mockResolvedValue({
      data: [
        { type: 'expense', amount: 200, categories: { name: 'Food', color: '#ef4444' } },
        { type: 'expense', amount: 100, categories: { name: 'Food', color: '#ef4444' } },
        { type: 'expense', amount: 50, categories: { name: 'Transport', color: '#3b82f6' } },
      ],
      error: null,
    });

    const { result } = renderHook(() => useCategoryBreakdown(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0]!.name).toBe('Food');
    expect(result.current.data![0]!.amount).toBe(300);
    expect(result.current.data![1]!.name).toBe('Transport');
  });

  it('handles items without categories', async () => {
    mockGetTransactions.mockResolvedValue({
      data: [
        { type: 'expense', amount: 100, categories: null },
      ],
      error: null,
    });

    const { result } = renderHook(() => useCategoryBreakdown(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data![0]!.name).toBe('Uncategorized');
  });
});


