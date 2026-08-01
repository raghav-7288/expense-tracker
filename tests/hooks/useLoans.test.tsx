import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { createTestQueryClient, createMockAuth } from '@/test/test-utils';
import {
  useLoans,
  useLoanSummary,
  useCreateLoan,
  useUpdateLoan,
  useDeleteLoan,
  useRecordRepayment,
} from '@/hooks/useLoans';
import type { ReactNode } from 'react';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const mockGetLoans = vi.fn();
const mockCreateLoan = vi.fn();
const mockUpdateLoan = vi.fn();
const mockDeleteLoan = vi.fn();
const mockRecordRepayment = vi.fn();
const mockGetLoanSummary = vi.fn();

vi.mock('@/services/loans', () => ({
  getLoans: (...args: unknown[]) => mockGetLoans(...args),
  getLoan: vi.fn(),
  createLoan: (...args: unknown[]) => mockCreateLoan(...args),
  updateLoan: (...args: unknown[]) => mockUpdateLoan(...args),
  deleteLoan: (...args: unknown[]) => mockDeleteLoan(...args),
  recordRepayment: (...args: unknown[]) => mockRecordRepayment(...args),
  getLoanTransactions: vi.fn(),
  getLoanSummary: (...args: unknown[]) => mockGetLoanSummary(...args),
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

describe('useLoans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches loans for authenticated user', async () => {
    const loans = [
      { id: 'loan-1', counterparty_name: 'Rahul', type: 'lent', outstanding_amount: 5000, status: 'active' },
      { id: 'loan-2', counterparty_name: 'Priya', type: 'borrowed', outstanding_amount: 3000, status: 'active' },
    ];
    mockGetLoans.mockResolvedValue({ data: loans, error: null });

    const { result } = renderHook(() => useLoans(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.counterparty_name).toBe('Rahul');
  });

  it('passes filters to service', async () => {
    mockGetLoans.mockResolvedValue({ data: [], error: null });
    const filters = { type: 'lent' as const, status: 'active' as const };

    const { result } = renderHook(() => useLoans(filters), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetLoans).toHaveBeenCalledWith('user-123', filters);
  });

  it('throws on service error', async () => {
    mockGetLoans.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const { result } = renderHook(() => useLoans(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useLoanSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns loan summary', async () => {
    const summary = {
      totalLent: 7000,
      totalBorrowed: 10000,
      outstandingLent: 3000,
      outstandingBorrowed: 8000,
      netReceivable: -5000,
      activeLoansCount: 2,
      settledLoansCount: 1,
    };
    mockGetLoanSummary.mockResolvedValue({ data: summary, error: null });

    const { result } = renderHook(() => useLoanSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.netReceivable).toBe(-5000);
    expect(result.current.data?.activeLoansCount).toBe(2);
  });
});

describe('useCreateLoan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a lent loan', async () => {
    const loan = { id: 'loan-new', type: 'lent', counterparty_name: 'Rahul', principal_amount: 5000 };
    mockCreateLoan.mockResolvedValue({ data: loan, error: null });

    const { result } = renderHook(() => useCreateLoan(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      counterparty_name: 'Rahul',
      type: 'lent',
      principal_amount: 5000,
      outstanding_amount: 5000,
    });

    expect(mockCreateLoan).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-123',
      counterparty_name: 'Rahul',
      type: 'lent',
      principal_amount: 5000,
    }));
  });

  it('creates a borrowed loan', async () => {
    const loan = { id: 'loan-new', type: 'borrowed', counterparty_name: 'Priya', principal_amount: 10000 };
    mockCreateLoan.mockResolvedValue({ data: loan, error: null });

    const { result } = renderHook(() => useCreateLoan(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      counterparty_name: 'Priya',
      type: 'borrowed',
      principal_amount: 10000,
      outstanding_amount: 10000,
    });

    expect(mockCreateLoan).toHaveBeenCalledWith(expect.objectContaining({
      type: 'borrowed',
      counterparty_name: 'Priya',
    }));
  });

  it('handles create error', async () => {
    mockCreateLoan.mockResolvedValue({ data: null, error: { message: 'Validation failed' } });

    const { result } = renderHook(() => useCreateLoan(), { wrapper: createWrapper() });
    await expect(
      result.current.mutateAsync({
        counterparty_name: '',
        type: 'lent',
        principal_amount: 0,
        outstanding_amount: 0,
      }),
    ).rejects.toThrow('Validation failed');
  });
});

describe('useUpdateLoan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates editable loan fields (counterparty, due date, notes)', async () => {
    const updatedLoan = {
      id: 'loan-1',
      counterparty_name: 'Rahul Kumar',
      due_date: '2026-10-01',
      notes: 'Updated note',
    };
    mockUpdateLoan.mockResolvedValue({ data: updatedLoan, error: null });

    const { result } = renderHook(() => useUpdateLoan(), { wrapper: createWrapper() });
    const data = await result.current.mutateAsync({
      id: 'loan-1',
      input: { counterparty_name: 'Rahul Kumar', due_date: '2026-10-01', notes: 'Updated note' },
    });

    expect(mockUpdateLoan).toHaveBeenCalledWith('loan-1', {
      counterparty_name: 'Rahul Kumar',
      due_date: '2026-10-01',
      notes: 'Updated note',
    });
    expect(data?.counterparty_name).toBe('Rahul Kumar');
  });

  it('handles update error', async () => {
    mockUpdateLoan.mockResolvedValue({ data: null, error: { message: 'Update failed' } });

    const { result } = renderHook(() => useUpdateLoan(), { wrapper: createWrapper() });
    await expect(
      result.current.mutateAsync({ id: 'loan-1', input: { counterparty_name: 'X' } }),
    ).rejects.toThrow('Update failed');
  });
});

describe('useDeleteLoan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a loan', async () => {
    mockDeleteLoan.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useDeleteLoan(), { wrapper: createWrapper() });
    await result.current.mutateAsync('loan-1');
    expect(mockDeleteLoan).toHaveBeenCalledWith('loan-1');
  });

  it('does not crash when a loan summary/detail object is cached (regression)', async () => {
    // The `loans.all` (['loans']) key partially matches list caches (arrays)
    // AND summary/detail caches (objects). The optimistic updater must not call
    // .filter() on the object caches, otherwise the whole delete throws
    // "old.filter is not a function" → "Failed to delete loan".
    const queryClient = createTestQueryClient();
    const authValue = createMockAuth();

    // Seed a list cache (Loan[]) and a summary cache (LoanSummary object)
    queryClient.setQueryData(['loans', 'user-123', undefined], [
      { id: 'loan-1', counterparty_name: 'Rahul' },
      { id: 'loan-2', counterparty_name: 'Priya' },
    ]);
    queryClient.setQueryData(['loans', 'summary', 'user-123'], {
      totalLent: 5000, totalBorrowed: 0, outstandingLent: 5000, outstandingBorrowed: 0,
      netReceivable: 5000, activeLoansCount: 2, settledLoansCount: 0,
    });
    mockDeleteLoan.mockResolvedValue({ error: null });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <ThemeContext.Provider value={{ darkMode: false, setDarkMode: vi.fn() }}>
          <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
        </ThemeContext.Provider>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteLoan(), { wrapper });

    // Must resolve, not reject
    await result.current.mutateAsync('loan-1');
    expect(mockDeleteLoan).toHaveBeenCalledWith('loan-1');

    // List cache had loan-1 optimistically removed
    const list = queryClient.getQueryData(['loans', 'user-123', undefined]) as Array<{ id: string }>;
    expect(list.some((l) => l.id === 'loan-1')).toBe(false);
    expect(list.some((l) => l.id === 'loan-2')).toBe(true);

    // Summary object cache is untouched (no crash)
    const summary = queryClient.getQueryData(['loans', 'summary', 'user-123']) as { totalLent: number };
    expect(summary.totalLent).toBe(5000);
  });

  it('handles delete error', async () => {
    mockDeleteLoan.mockResolvedValue({ error: { message: 'Cannot delete' } });

    const { result } = renderHook(() => useDeleteLoan(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync('loan-1')).rejects.toThrow('Cannot delete');
  });
});

describe('useRecordRepayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records a partial repayment successfully', async () => {
    const updatedLoan = { id: 'loan-1', outstanding_amount: 3000, status: 'partially_paid' };
    mockRecordRepayment.mockResolvedValue({ data: updatedLoan, error: null });

    const { result } = renderHook(() => useRecordRepayment(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      loan_id: 'loan-1',
      amount: 2000,
      date: '2026-08-15',
      notes: 'Repayment from Rahul',
    });

    expect(mockRecordRepayment).toHaveBeenCalledWith({
      loan_id: 'loan-1',
      amount: 2000,
      date: '2026-08-15',
      notes: 'Repayment from Rahul',
    });
  });

  it('records a full repayment that settles the loan', async () => {
    const settledLoan = { id: 'loan-1', outstanding_amount: 0, status: 'settled' };
    mockRecordRepayment.mockResolvedValue({ data: settledLoan, error: null });

    const { result } = renderHook(() => useRecordRepayment(), { wrapper: createWrapper() });
    const data = await result.current.mutateAsync({
      loan_id: 'loan-1',
      amount: 5000,
      date: '2026-08-28',
    });

    expect(data?.status).toBe('settled');
    expect(data?.outstanding_amount).toBe(0);
  });

  it('handles repayment error', async () => {
    mockRecordRepayment.mockResolvedValue({ data: null, error: { message: 'Amount exceeds outstanding' } });

    const { result } = renderHook(() => useRecordRepayment(), { wrapper: createWrapper() });
    await expect(
      result.current.mutateAsync({ loan_id: 'loan-1', amount: 99999, date: '2026-08-15' }),
    ).rejects.toThrow('Amount exceeds outstanding');
  });
});

