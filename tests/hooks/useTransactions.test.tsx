import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useUpdateLoanTransaction,
  useDeleteLoanTransaction,
} from '@/hooks/useTransactions';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';
import type { ReactNode } from 'react';
import type { Transaction } from '@/types';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockGetTransactions = vi.fn();
const mockCreateTransaction = vi.fn();
const mockUpdateTransaction = vi.fn();
const mockDeleteTransaction = vi.fn();
const mockUpdateLoanTransaction = vi.fn();
const mockDeleteLoanTransaction = vi.fn();

vi.mock('@/services/transactions', () => ({
  getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
  createTransaction: (...args: unknown[]) => mockCreateTransaction(...args),
  updateTransaction: (...args: unknown[]) => mockUpdateTransaction(...args),
  deleteTransaction: (...args: unknown[]) => mockDeleteTransaction(...args),
  updateLoanTransaction: (...args: unknown[]) => mockUpdateLoanTransaction(...args),
  deleteLoanTransaction: (...args: unknown[]) => mockDeleteLoanTransaction(...args),
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

/** Wrapper bound to a caller-supplied QueryClient so cache state can be seeded/asserted. */
function wrapperFor(queryClient: QueryClient, user: { id: string } | null = { id: 'user-123' }) {
  const authValue = createMockAuth(user ? {} : { user: null });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
          <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
        </ThemeContext.Provider>
      </QueryClientProvider>
    );
  };
}

function txn(over: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1', user_id: 'user-123', type: 'expense', amount: 100, notes: 'Test',
    date: '2026-01-01', category_id: null, account_id: null,
    created_at: '', updated_at: '', categories: null,
    ...over,
  } as Transaction;
}

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches transactions', async () => {
    const data = [{ id: '1', notes: 'Test' }];
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
      type: 'expense', amount: 50, notes: 'Test',
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
      type: 'expense', amount: 0, notes: 'X',
      date: '2024-01-01', category_id: null,
    })).rejects.toThrow('Invalid');
  });

  it('rejects with "Not authenticated" when there is no user', async () => {
    const qc = createTestQueryClient();
    const { result } = renderHook(() => useCreateTransaction(), { wrapper: wrapperFor(qc, null) });
    await expect(result.current.mutateAsync({
      type: 'expense', amount: 10, notes: 'X',
      date: '2024-01-01', category_id: null,
    })).rejects.toThrow('Not authenticated');
    expect(mockCreateTransaction).not.toHaveBeenCalled();
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

  it('rejects and toasts on update error', async () => {
    mockUpdateTransaction.mockResolvedValue({ data: null, error: { message: 'Update failed' } });
    const { result } = renderHook(() => useUpdateTransaction(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync({ id: '1', input: { amount: 1 } })).rejects.toThrow('Update failed');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Update failed'));
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

  it('invalidates loan queries after delete so the Loans page refreshes', async () => {
    // A deleted transaction may be a loan disbursement/repayment, so loan views
    // (Loans page + Loan Summary card) must be refreshed too.
    mockDeleteTransaction.mockResolvedValue({ error: null });
    const queryClient = createTestQueryClient();
    const authValue = createMockAuth();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
            <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
          </ThemeContext.Provider>
        </QueryClientProvider>
      );
    }
    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: Wrapper });
    await result.current.mutateAsync('1');
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['loans'] });
    });
  });

  it('optimistically removes the transaction from every cached list, then confirms', async () => {
    mockDeleteTransaction.mockResolvedValue({ error: null });
    const qc = createTestQueryClient();
    const key = queryKeys.transactions.list('user-123');
    qc.setQueryData(key, [txn({ id: 't1' }), txn({ id: 't2', notes: 'Keep' })]);

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: wrapperFor(qc) });
    await result.current.mutateAsync('t1');

    const remaining = qc.getQueryData<Transaction[]>(key);
    expect(remaining?.map((t) => t.id)).toEqual(['t2']);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Transaction deleted'));
  });

  it('rolls the cache back to the snapshot when the delete fails', async () => {
    mockDeleteTransaction.mockResolvedValue({ error: { message: 'nope' } });
    const qc = createTestQueryClient();
    const key = queryKeys.transactions.list('user-123');
    qc.setQueryData(key, [txn({ id: 't1' }), txn({ id: 't2', notes: 'Keep' })]);

    const { result } = renderHook(() => useDeleteTransaction(), { wrapper: wrapperFor(qc) });
    await expect(result.current.mutateAsync('t1')).rejects.toThrow('nope');

    const restored = qc.getQueryData<Transaction[]>(key);
    expect(restored?.map((t) => t.id)).toEqual(['t1', 't2']);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to delete transaction'));
  });
});

describe('useUpdateLoanTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates a loan-linked transaction with its parent loan id', async () => {
    mockUpdateLoanTransaction.mockResolvedValue({ data: { id: 'lt1' }, error: null });
    const { result } = renderHook(() => useUpdateLoanTransaction(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ id: 'lt1', input: { amount: 250 }, loanId: 'loan-1' });

    expect(mockUpdateLoanTransaction).toHaveBeenCalledWith('lt1', { amount: 250 }, 'loan-1');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Transaction updated'));
  });

  it('surfaces the service error message when the update fails', async () => {
    mockUpdateLoanTransaction.mockResolvedValue({ data: null, error: { message: 'loan sync failed' } });
    const { result } = renderHook(() => useUpdateLoanTransaction(), { wrapper: createWrapper() });

    await expect(
      result.current.mutateAsync({ id: 'lt1', input: {}, loanId: 'loan-1' }),
    ).rejects.toThrow('loan sync failed');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('loan sync failed'));
  });
});

describe('useDeleteLoanTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes a repayment and shows the repayment toast', async () => {
    mockDeleteLoanTransaction.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useDeleteLoanTransaction(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ id: 'lt1', loanId: 'loan-1', eventType: 'repayment' });

    expect(mockDeleteLoanTransaction).toHaveBeenCalledWith('lt1', 'loan-1', 'repayment');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Repayment deleted — loan updated'));
  });

  it('deletes a disbursement and shows the whole-loan toast', async () => {
    mockDeleteLoanTransaction.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useDeleteLoanTransaction(), { wrapper: createWrapper() });

    await result.current.mutateAsync({ id: 'lt1', loanId: 'loan-1', eventType: 'disbursement' });

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Loan and all linked transactions deleted'),
    );
  });

  it('optimistically removes the loan transaction, then rolls back on failure', async () => {
    mockDeleteLoanTransaction.mockResolvedValue({ error: { message: 'boom' } });
    const qc = createTestQueryClient();
    const key = queryKeys.transactions.list('user-123');
    qc.setQueryData(key, [txn({ id: 'lt1' }), txn({ id: 't2', notes: 'Keep' })]);

    const { result } = renderHook(() => useDeleteLoanTransaction(), { wrapper: wrapperFor(qc) });
    await expect(
      result.current.mutateAsync({ id: 'lt1', loanId: 'loan-1', eventType: 'repayment' }),
    ).rejects.toThrow('boom');

    const restored = qc.getQueryData<Transaction[]>(key);
    expect(restored?.map((t) => t.id)).toEqual(['lt1', 't2']);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to delete transaction'));
  });
});

