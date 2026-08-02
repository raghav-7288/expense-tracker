import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import {
  useRecurringTransactions,
  useCreateRecurringTransaction,
  useUpdateRecurringTransaction,
  useDeleteRecurringTransaction,
  useGenerateDueTransactions,
} from '@/hooks/useRecurringTransactions';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';
import type { ReactNode } from 'react';
import type { RecurringTransaction } from '@/types';

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

const {
  mockGetRecurring,
  mockCreateRecurring,
  mockUpdateRecurring,
  mockDeleteRecurring,
  mockGenerateDue,
} = vi.hoisted(() => ({
  mockGetRecurring: vi.fn(),
  mockCreateRecurring: vi.fn(),
  mockUpdateRecurring: vi.fn(),
  mockDeleteRecurring: vi.fn(),
  mockGenerateDue: vi.fn(),
}));

vi.mock('@/services/recurring', () => ({
  getRecurringTransactions: (...a: unknown[]) => mockGetRecurring(...a),
  createRecurringTransaction: (...a: unknown[]) => mockCreateRecurring(...a),
  updateRecurringTransaction: (...a: unknown[]) => mockUpdateRecurring(...a),
  deleteRecurringTransaction: (...a: unknown[]) => mockDeleteRecurring(...a),
  generateDueTransactions: (...a: unknown[]) => mockGenerateDue(...a),
}));

function rule(over: Partial<RecurringTransaction> = {}): RecurringTransaction {
  return {
    id: 'r1', user_id: 'user-123', type: 'expense', amount: 1200, notes: 'Rent',
    category_id: 'c1', account_id: null, frequency: 'monthly',
    start_date: '2026-08-01', end_date: null, next_due_date: '2026-09-01',
    is_active: true, created_at: '', updated_at: '', categories: null, account: null,
    ...over,
  };
}

/** Wrapper bound to a caller-supplied QueryClient so cache/spies can be asserted. */
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

describe('useRecurringTransactions (query)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches the rules for the authenticated user', async () => {
    mockGetRecurring.mockResolvedValue({ data: [rule()], error: null });
    const qc = createTestQueryClient();
    const { result } = renderHook(() => useRecurringTransactions(), { wrapper: wrapperFor(qc) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetRecurring).toHaveBeenCalledWith('user-123');
    expect(result.current.data).toHaveLength(1);
  });

  it('returns an empty array (no fetch) when unauthenticated', async () => {
    const qc = createTestQueryClient();
    const { result } = renderHook(() => useRecurringTransactions(), {
      wrapper: wrapperFor(qc, null),
    });
    // enabled:false → query never runs.
    expect(result.current.data).toBeUndefined();
    expect(mockGetRecurring).not.toHaveBeenCalled();
  });

  it('throws when the service returns an error', async () => {
    mockGetRecurring.mockResolvedValue({ data: null, error: { message: 'DB down' } });
    const qc = createTestQueryClient();
    const { result } = renderHook(() => useRecurringTransactions(), { wrapper: wrapperFor(qc) });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useCreateRecurringTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates the rule, injects user_id, and materializes due occurrences immediately', async () => {
    mockCreateRecurring.mockResolvedValue({ data: rule(), error: null });
    mockGenerateDue.mockResolvedValue({ generated: 1, error: null });
    const qc = createTestQueryClient();
    const { result } = renderHook(() => useCreateRecurringTransaction(), { wrapper: wrapperFor(qc) });

    await result.current.mutateAsync({
      type: 'expense', amount: 1200, notes: 'Rent', category_id: 'c1',
      account_id: null, frequency: 'monthly', start_date: '2026-08-01', end_date: null,
    });

    expect(mockCreateRecurring).toHaveBeenCalledWith(
      expect.objectContaining({ notes: 'Rent', user_id: 'user-123' }),
    );
    // The create must kick generation so an already-due first occurrence appears at once.
    expect(mockGenerateDue).toHaveBeenCalledWith('user-123');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Recurring transaction scheduled'));
  });

  it('invalidates rules, transactions, dashboard, accounts and analytics on success', async () => {
    mockCreateRecurring.mockResolvedValue({ data: rule(), error: null });
    mockGenerateDue.mockResolvedValue({ generated: 0, error: null });
    const qc = createTestQueryClient();
    const spy = vi.spyOn(qc, 'invalidateQueries');
    const { result } = renderHook(() => useCreateRecurringTransaction(), { wrapper: wrapperFor(qc) });

    await result.current.mutateAsync({
      type: 'expense', amount: 10, notes: 'x', category_id: null,
      account_id: null, frequency: 'weekly', start_date: '2026-08-01', end_date: null,
    });

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.recurringTransactions.all });
      expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.transactions.all });
      expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.all });
      expect(spy).toHaveBeenCalledWith({ queryKey: queryKeys.accounts.all });
      expect(spy).toHaveBeenCalledWith({ queryKey: ['analytics'] });
    });
  });

  it('surfaces an error toast and rejects when the service fails', async () => {
    mockCreateRecurring.mockResolvedValue({ data: null, error: { message: 'insert failed' } });
    const qc = createTestQueryClient();
    const { result } = renderHook(() => useCreateRecurringTransaction(), { wrapper: wrapperFor(qc) });

    await expect(
      result.current.mutateAsync({
        type: 'expense', amount: 10, notes: 'x', category_id: null,
        account_id: null, frequency: 'weekly', start_date: '2026-08-01', end_date: null,
      }),
    ).rejects.toThrow('insert failed');
    expect(mockGenerateDue).not.toHaveBeenCalled();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('insert failed'));
  });
});

describe('useUpdateRecurringTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('updates a rule and shows a success toast', async () => {
    mockUpdateRecurring.mockResolvedValue({ data: rule({ is_active: false }), error: null });
    const qc = createTestQueryClient();
    const { result } = renderHook(() => useUpdateRecurringTransaction(), { wrapper: wrapperFor(qc) });

    await result.current.mutateAsync({ id: 'r1', input: { is_active: false } });

    expect(mockUpdateRecurring).toHaveBeenCalledWith('r1', { is_active: false });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Recurring transaction updated'));
  });

  it('rejects and toasts on error', async () => {
    mockUpdateRecurring.mockResolvedValue({ data: null, error: { message: 'nope' } });
    const qc = createTestQueryClient();
    const { result } = renderHook(() => useUpdateRecurringTransaction(), { wrapper: wrapperFor(qc) });

    await expect(result.current.mutateAsync({ id: 'r1', input: {} })).rejects.toThrow('nope');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('nope'));
  });
});

describe('useDeleteRecurringTransaction', () => {
  beforeEach(() => vi.clearAllMocks());

  it('optimistically removes the rule from the cache, then confirms on success', async () => {
    mockDeleteRecurring.mockResolvedValue({ error: null });
    const qc = createTestQueryClient();
    const key = queryKeys.recurringTransactions.list('user-123');
    qc.setQueryData(key, [rule({ id: 'r1' }), rule({ id: 'r2', notes: 'Gym' })]);

    const { result } = renderHook(() => useDeleteRecurringTransaction(), { wrapper: wrapperFor(qc) });
    await result.current.mutateAsync('r1');

    const remaining = qc.getQueryData<RecurringTransaction[]>(key);
    expect(remaining?.map((r) => r.id)).toEqual(['r2']);
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Recurring transaction deleted'));
  });

  it('rolls the cache back and toasts when the delete fails', async () => {
    mockDeleteRecurring.mockResolvedValue({ error: { message: 'boom' } });
    const qc = createTestQueryClient();
    const key = queryKeys.recurringTransactions.list('user-123');
    const original = [rule({ id: 'r1' }), rule({ id: 'r2', notes: 'Gym' })];
    qc.setQueryData(key, original);

    const { result } = renderHook(() => useDeleteRecurringTransaction(), { wrapper: wrapperFor(qc) });
    await expect(result.current.mutateAsync('r1')).rejects.toThrow('boom');

    // The optimistic removal was reverted to the pre-mutation snapshot.
    const restored = qc.getQueryData<RecurringTransaction[]>(key);
    expect(restored?.map((r) => r.id)).toEqual(['r1', 'r2']);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to delete recurring transaction'));
  });
});

describe('useGenerateDueTransactions (mount-time generator)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('generates once on mount and toasts when transactions were created', async () => {
    mockGenerateDue.mockResolvedValue({ generated: 3, error: null });
    const qc = createTestQueryClient();
    renderHook(() => useGenerateDueTransactions(), { wrapper: wrapperFor(qc) });

    await waitFor(() => expect(mockGenerateDue).toHaveBeenCalledWith('user-123'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('3 recurring transactions added'));
  });

  it('uses the singular noun when exactly one transaction is generated', async () => {
    mockGenerateDue.mockResolvedValue({ generated: 1, error: null });
    const qc = createTestQueryClient();
    renderHook(() => useGenerateDueTransactions(), { wrapper: wrapperFor(qc) });

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('1 recurring transaction added'));
  });

  it('stays silent when nothing is due', async () => {
    mockGenerateDue.mockResolvedValue({ generated: 0, error: null });
    const qc = createTestQueryClient();
    renderHook(() => useGenerateDueTransactions(), { wrapper: wrapperFor(qc) });

    await waitFor(() => expect(mockGenerateDue).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('swallows a generation error without toasting (non-critical background task)', async () => {
    mockGenerateDue.mockRejectedValue(new Error('network'));
    const qc = createTestQueryClient();
    renderHook(() => useGenerateDueTransactions(), { wrapper: wrapperFor(qc) });

    await waitFor(() => expect(mockGenerateDue).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('does not generate when unauthenticated', async () => {
    const qc = createTestQueryClient();
    renderHook(() => useGenerateDueTransactions(), { wrapper: wrapperFor(qc, null) });

    // Allow any effects to flush.
    await Promise.resolve();
    expect(mockGenerateDue).not.toHaveBeenCalled();
  });
});

