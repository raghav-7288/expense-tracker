import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import type { ReactNode } from 'react';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockGetTransactions = vi.fn();
const mockCreateTransaction = vi.fn();
const mockUpdateTransaction = vi.fn();
const mockDeleteTransaction = vi.fn();

vi.mock('@/services/transactions', () => ({
  getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
  createTransaction: (...args: unknown[]) => mockCreateTransaction(...args),
  updateTransaction: (...args: unknown[]) => mockUpdateTransaction(...args),
  deleteTransaction: (...args: unknown[]) => mockDeleteTransaction(...args),
  getMonthlyStats: vi.fn(),
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

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches transactions', async () => {
    const data = [{ id: '1', description: 'Test' }];
    mockGetTransactions.mockResolvedValue({ data, error: null });

    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });

  it('passes filters to service', async () => {
    mockGetTransactions.mockResolvedValue({ data: [], error: null });
    const filters = { type: 'income' as const, sort_by: 'date' as const, sort_order: 'desc' as const };
    const { result } = renderHook(() => useTransactions(filters), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetTransactions).toHaveBeenCalledWith('user-123', filters);
  });

  it('throws on error', async () => {
    mockGetTransactions.mockResolvedValue({ data: null, error: { message: 'Failed' } });
    const { result } = renderHook(() => useTransactions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCreateTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a transaction', async () => {
    mockCreateTransaction.mockResolvedValue({ data: { id: '1' }, error: null });
    const { result } = renderHook(() => useCreateTransaction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      type: 'expense', amount: 50, description: 'Test',
      date: '2024-01-01', category_id: null,
    });
    expect(mockCreateTransaction).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-123', amount: 50,
    }));
  });

  it('handles create error', async () => {
    mockCreateTransaction.mockResolvedValue({ data: null, error: { message: 'Invalid' } });
    const { result } = renderHook(() => useCreateTransaction(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync({
      type: 'expense', amount: 0, description: 'X',
      date: '2024-01-01', category_id: null,
    })).rejects.toThrow('Invalid');
  });
});

describe('useUpdateTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates a transaction', async () => {
    mockUpdateTransaction.mockResolvedValue({ data: { id: '1', amount: 100 }, error: null });
    const { result } = renderHook(() => useUpdateTransaction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: '1', input: { amount: 100 } });
    expect(mockUpdateTransaction).toHaveBeenCalledWith('1', { amount: 100 });
  });
});

describe('useDeleteTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a transaction', async () => {
    mockDeleteTransaction.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: createWrapper() });
    await result.current.mutateAsync('1');
    expect(mockDeleteTransaction).toHaveBeenCalledWith('1');
  });

  it('handles delete error with rollback', async () => {
    mockDeleteTransaction.mockResolvedValue({ error: { message: 'Cannot delete' } });
    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync('1')).rejects.toThrow('Cannot delete');
  });
});

